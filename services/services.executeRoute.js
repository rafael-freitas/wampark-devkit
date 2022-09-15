import app from 'wampark'
import shell from 'shelljs'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import RouteSandbox from '../lib/RouteSandbox.js'
import Routes from '../db/models/routes/index.js'

const RoutesError = app.ApplicationError

// generate random WORKER ID wether no ID is specified
const ROUTES_WORKER_ID = app.config.ROUTES_WORKER_ID || process.pid
// const ROUTES_PREFIX = 'routes.' + ROUTES_WORKER_ID
const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

const SNIPPET_CONTENT_PREFIX = 'content_'
const SNIPPET_CATCH_ERROR_PREFIX = 'catch_'
const SNIPPET_DIR = path.join(path.resolve(), '.snippets')

const SNIPPET_BODY_NAME = 'body'
const SNIPPET_RETURN_NAME = 'processFlowResult'
const SNIPPET_ERROR_HANDLER_NAME = 'RoutesErrorHandler'
const SNIPPET_CATCH_NAME = 'catch'

export default class ExecuteRoutesRoute extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: ROUTES_PREFIX,
      options: {
        match: 'prefix'
      }
    })
    // guardar as rotas importadas e os metodos indexados por hash
    this.routes = {}
  }

  setup (args = [], kwargs = {}, details = {}) {
    const [protocol = {}] = args
    // setar sempre o chamador inicial como protocolo
    if (protocol.targetUser) {
      this.details = {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
        procedure: details.procedure,
      }
    }
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const routeId = this.routeId()

    const route = await Routes.findOne({ _id: routeId }).lean()

    if (!route) {
      throw new RoutesError(`services.executeRoute.A001: No Route found <${routeId}> uri: [${details.procedure}]`)
    }

    return this.callRouteInstanceMethod(route, args, kwargs, details)
  }

  async callRouteInstanceMethod (..._args) {
    const [route, args = [], kwargs = {}, details = {}] = _args

    let cache = this.routes[route._id]
    if (cache) {
      // se o hash mudou importar o snippet novamente
      if (cache.hash !== route.hash) {
        this.log.info(`Removing route cache [${cache.hash}] <${this.log.colors.silly(route._id)}>`)
        delete this.routes[route._id]
        return this.callRouteInstanceMethod(..._args)
      }
      try {
        this.log.info(`Running [${route.hash}] <${this.log.colors.silly(route._id)}> by [${this.log.colors.yellow(details.caller)}/${details.caller_authid}]`)

        // create sandbox
        const sandbox = RouteSandbox.extend(this)
        sandbox.uri = `sandbox#${route._id}`
        sandbox.log = sandbox.getLogger()
        sandbox.beforeSetup(args, kwargs, details)
        sandbox.setup(args, kwargs, details)

        return await cache.contentMethod.call(sandbox, {args, kwargs, details})
      } catch (err) {
        if (err instanceof app.ApplicationError) {
          throw err
        }
        throw RoutesError.parse(err)
  
        // throw new RoutesError(`services.callRouteInstanceMethod.E001: <${route._id}> ${error.message}`, err)
      }
    } else {
      this.log.info(`Creating route sandbox [${route.hash}] <${this.log.colors.silly(route._id)}>`)
      // criar o diretorio de snippets dinamicos de cada workflow chamado
      route.snippetDir = path.join(SNIPPET_DIR, route._id)
      shell.mkdir('-p', route.snippetDir)

      // converter codigo em metodo da classe Sandbox - gravar em arquivo no diretorio .snippets/
      const { default: contentMethod } = await this.wrapFunction(route, route.content, 'content')

      this.routes[route._id] = {
        contentMethod,
        hash: route.hash
      }

      return this.callRouteInstanceMethod(..._args)
    }
  }

  routeId () {
    return String(this.details.procedure).replace(ROUTES_PREFIX + '.', '')
  }

  getClousureMethodName (prefix, id) {
    return `${prefix}__` + String(id).replace(/\W/ig, '_')
  }

  /**
   * Cria uma função dinamicmente para um bloco de código.
   * A função recebe apenas um objeto como parâmetro em forma de atribuição via desestruturação para em variáveis internas no escopo da função.
   * 
   * Exemplo:
   *  
   ```js
    module.exports = async function body__5f18fc515847d94acda6cce8 ({workflow, step, payload, route, require, RoutesError}) {
      ...
    }
    ```
   * 
   * Desestruturação de variáveis: 
   * https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Operators/Atribuicao_via_desestruturacao
   * 
   * @param {MongooseDocument} workflow 
   * @param {Object} step Step atual
   * @param {String} snippet Bloco de código de corpo da funcão
   * @param {String} prefix Prefixo para usado para identificação no nome do arquivo JS da função. Ex: processFlowResult_209319238_nomeQualquer.js
   * @param {String} functionName Usado na identificação no nome do arquivo JS da função. Ex: prefix_123123_nomeQualquer.js
   * @param {Array} extraParams Uma lista contendo os parâmetros adicionais que irãm compor o objeto de parâmetro da função.
   */
  async wrapFunction (route, snippet, filePrefix, extraParams = []) {
    const snippetPath = path.join(SNIPPET_DIR, route._id, `${filePrefix}_${route.hash}.js`)

    if (fs.existsSync(snippetPath)) {
      // se config.debug (arquivo config/env/all.js) estiver ativo reprocessar script
      // permitr o uso do comando debugger no corpo do snippet
      // if (config.debug) {
      //   return requireUncached(snippetPath)
      // }
      // return require(snippetPath)
      return await import(snippetPath)
    }

    // wrapper para method async na classe atual
    let params = ['kwargs'].concat(extraParams)
    const header = [
      '/**\n',
      [
        `* Route: ${route._id || ''}`,
        `* Hash: ${route.hash || ''}`
      ].join('\n '),
      '\n*/',
      '\n',
      // `\nimport app from 'wampark'`,
      '\n',
      route.header || '',
      '\n',
    ].join('')

    // removendo parametros duplicados
    params = _.union(params)

    // wraper da funcao
    // assinatura: function content(kwargs, extraParams[])
    snippet = `${header}\n\nexport default async function ${filePrefix} ({${params.join(', ')}}) {\n${snippet}\n}`
    // criar um hash com o snippet
    // const md5 = crypto.createHash('md5').update(route._id + snippet).digest('hex')
    // criar o nome do arquivo da funcao
    
    // gravar snippet em arquivo no Sistema Operacional
    fs.writeFileSync(snippetPath, snippet)
    return await import(snippetPath)
  }
}

