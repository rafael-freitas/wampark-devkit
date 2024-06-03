/**
 * @file Execute routes
 * @version 0.0.2
 * @since 0.0.0
 * @namespace services
 * @author Rafael Freitas
 * @created -
 * @updated 2024-05-31 03:00:51
 */
import app from 'wampark';
import shell from 'shelljs';
import path from 'path';
import fs from 'fs';

import RouteSandbox from '../lib/RouteSandbox.js';
import Routes from '../db/models/routes/index.js';

const RoutesError = app.ApplicationError;

// Configurações de variáveis de ambiente
const ROUTES_PREFIX = process.env.ROUTES_PREFIX || 'routes';
const SNIPPET_DIR = path.join(path.resolve(), '.snippets');
const SOURCE_DIR = path.join(path.resolve(), process.env.ROUTES_SOURCE_DIR, 'routes');
const ENABLE_ROUTES_SOURCE = Number(process.env.ENABLE_ROUTES_SOURCE);
const ROUTES_AUTOCREATE = Number(process.env.ROUTES_AUTOCREATE);

if (process.env.ROUTES_SOURCE_DIR) {
  shell.mkdir('-p', SOURCE_DIR);
}

/**
 * Verifica se um objeto é uma classe JavaScript.
 * @param {Object} obj - O objeto a ser verificado.
 * @returns {Boolean} - Retorna true se o objeto for uma classe, caso contrário false.
 */
function isClass(obj) {
  // Verifica se é uma função e se tem a propriedade 'prototype'
  const isFunction = typeof obj === 'function';
  const hasPrototype = obj.prototype && typeof obj.prototype === 'object';

  if (!isFunction || !hasPrototype) {
    return false;
  }

  // Verifica se foi declarada com 'class'
  const isClassDeclaration = /^class\s/.test(Function.prototype.toString.call(obj));

  return isClassDeclaration;
}

export default class ExecuteRoutesRoute extends app.Route {
  constructor() {
    super({
      type: app.RouteTypes.RPC,
      uri: ROUTES_PREFIX,
      options: {
        match: 'prefix'
      }
    });
    // Guardar as rotas importadas e os métodos indexados por hash
    this.routes = {};
    this.cache = {};
    this.cacheSource = {};
  }

  /**
   * Configura o contexto da rota.
   * @param {Array} args - Argumentos passados.
   * @param {Object} kwargs - Argumentos nomeados passados.
   * @param {Object} details - Detalhes da chamada.
   */
  setup(args = [], kwargs = {}, details = {}) {
    const [protocol = {}] = args;
    // Setar sempre o chamador inicial como protocolo
    if (protocol.targetUser) {
      this.details = {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
        procedure: details.procedure,
      };
    }
  }

  /**
   * Endpoint principal para execução das rotas.
   * @ignore
   * @param {Array} args - Argumentos passados.
   * @param {Object} kwargs - Argumentos nomeados passados.
   * @param {Object} details - Detalhes da chamada.
   */
  async endpoint(args = [], kwargs = {}, details = {}) {
    const routeId = String(this.details.procedure).replace(ROUTES_PREFIX + '.', '');

    let route = await Routes.findOne({ _id: routeId }, { _id: 1, hash: 1 }).lean();

    if (!route && ROUTES_AUTOCREATE) {
      // Buscar arquivo fonte
      route = await this.getRouteFromSourceFile(routeId);
    }
    if (!route) {
      throw new RoutesError(`services.executeRoute.A001: Route not found <${routeId}> uri: [${details.procedure}]`);
    }

    return this.executeRoute(route, args, kwargs, details);
  }

  /**
   * Obtém a rota a partir do arquivo de origem.
   * @param {String} routeId - ID da rota.
   * @returns {Object} - A rota encontrada.
   */
  async getRouteFromSourceFile(routeId) {
    const sourcePath = path.join(SOURCE_DIR, routeId + '.js');
    if (fs.existsSync(sourcePath)) {
      const file = Routes.parseFileContent(fs.readFileSync(sourcePath));
      const route = new Routes(file);
      Object.assign(route, { endpoint: routeId });
      await route.save();
      return route;
    }
  }

  /**
   * Salva a rota no diretório de snippets.
   * @param {Object} route - A rota a ser salva.
   */
  saveRouteToSnipetDirectory(route) {
    const routeSnippetDir = path.join(SNIPPET_DIR, route._id);
    // Limpar diretório de snippets desta rota
    shell.rm('-rf', routeSnippetDir);
    // Criar diretório do snippet
    shell.mkdir('-p', routeSnippetDir);
    // Montar path do arquivo (SNIPPET_DIR/ID/HASH)
    const filepath = path.join(routeSnippetDir, route.hash + '.js');
    // Gravar arquivo
    fs.writeFileSync(filepath, route.content);
  }

  /**
   * Importa a rota do diretório de snippets.
   * @param {Object} route - A rota a ser importada.
   * @returns {Object} - O módulo importado.
   */
  async importRouteFileFromSnipetDirectory(route) {
    const filepath = path.join(SNIPPET_DIR, route._id, route.hash + '.js');
    if (!fs.existsSync(filepath)) {
      // Obter rota completa do banco
      const fullRoute = await Routes.findOne({ _id: route._id }).lean();
      // Salvar snippet no sistema de arquivos
      this.saveRouteToSnipetDirectory(fullRoute);
    }
    return import(filepath + '?hash=' + route.hash);
  }

  /**
   * Importa a rota do diretório de origem.
   * @param {Object} route - A rota a ser importada.
   * @returns {Object} - O módulo importado.
   */
  async importRouteFileFromSourceDirectory(route) {
    const filepath = path.join(SOURCE_DIR, route._id + '.js');
    if (!fs.existsSync(filepath)) {
      throw new RoutesError(`services.executeRoute.A002: Route source file not found <${route._id}>`);
    }
    return import(filepath + '?hash=' + route.hash);
  }

  async checkAuthorization (instance) {
    const requireAuthentication = instance.requireAuthentication()
    if (requireAuthentication) {
      if (instance.isRequestServerSession()) {
        let authorization = await instance.checkAuthorization()

        if (authorization === false) {
          throw new RoutesError(`401: Unauthorized to access route <${route._id}>`);
        }
      }
    }
  }

  /**
   * Executa a rota.
   * @param {Object} route - A rota a ser executada.
   * @param {Array} args - Argumentos passados.
   * @param {Object} kwargs - Argumentos nomeados passados.
   * @param {Object} details - Detalhes da chamada.
   * @returns {Any} - O resultado da execução da rota.
   */
  async executeRoute(route, args, kwargs, details) {
    // 1 - Checar se já está no cache
    const cacheKey = route._id;

    // Se não estiver no cache, carregar arquivo fonte
    if (!this.cache[cacheKey]) {
      let file;
      if (ENABLE_ROUTES_SOURCE) {
        file = await this.importRouteFileFromSourceDirectory(route);
      } else {
        file = await this.importRouteFileFromSnipetDirectory(route);
      }

      // Se file.default não for uma função, levantar erro
      if (!file.default || typeof file.default !== 'function') {
        throw new RoutesError(`services.executeRoute.A003: Route file must export a function <${route._id}>`);
      }

      // Checar se o file.default é uma classe usando isClass() e guardar a flag
      const flagClass = isClass(file.default);

      this.cache[cacheKey] = { file, hash: route.hash, flagClass };
    } else {
      // Se estiver no cache, verificar se o hash mudou
      if (this.cache[cacheKey].hash !== route.hash) {
        let file;
        if (ENABLE_ROUTES_SOURCE) {
          file = await this.importRouteFileFromSourceDirectory(route);
        } else {
          file = await this.importRouteFileFromSnipetDirectory(route);
        }

        // Se file.default não for uma função, levantar erro
        if (!file.default || typeof file.default !== 'function') {
          throw new RoutesError(`services.executeRoute.A004: Route file must export a function <${route._id}>`);
        }

        // Checar se o file.default é uma classe usando isClass() e guardar a flag
        const flagClass = isClass(file.default);

        this.cache[cacheKey] = { file, hash: route.hash, flagClass };
      }
    }

    // 2 - Executar rota
    const { file, flagClass } = this.cache[cacheKey];
    const routeClass = file.default;

    // Verificar se routeClass é uma class ou uma function
    if (flagClass) {
      // Se for uma class, criar instância e chamar método
      const instance = new routeClass({
        uri: route._id,
        // Copiar session do crossbar
        session: this.session
      });

      if (!instance.session) {
        instance.session = this.session
      }

      // Verificar se instance é uma instância da classe Routes ou extendeu a classe Routes
      if (instance instanceof RouteSandbox) {
        // Chamar os métodos de configuração beforeSetup e setup passando args, kwargs e details
        await instance.beforeSetup(args, kwargs, details);
        await instance.setup(args, kwargs, details);
        // checar autorizacao de acesso
        await this.checkAuthorization(instance)
        // Chamar método endpoint da classe Routes com os parâmetros args, kwargs, details
        return instance.endpoint(args, kwargs, details);
      } else {
        // Se não for uma instância da classe Routes, levantar erro de RoutesError
        throw new RoutesError(`services.executeRoute.E001: Route class must extend RouteSandbox`);
      }
    } else {
      // Se for uma função, criar uma instância da classe RouteSandbox
      const sandbox = new RouteSandbox({
        uri: route._id,
        ...file,
        // Copiar session do crossbar
        session: this.session
      });
      
      if (!sandbox.session) {
        sandbox.session = this.session
      }

      await sandbox.beforeSetup(args, kwargs, details);
      await sandbox.setup(args, kwargs, details);
      // checar autorizacao de acesso
      await this.checkAuthorization(sandbox)
      // Chamar método endpoint com os parâmetros args, kwargs, details
      return sandbox.endpoint(args, kwargs, details);
    }
  }
}
