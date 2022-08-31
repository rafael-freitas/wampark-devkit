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
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    this.details = details
    const routeId = this.routeId()

    const route = await Routes.findOne({ _id: routeId }).lean()

    if (!route) {
      throw new RoutesError(`services.executeRoute.A001: No Route found <${routeId}> uri: [${details.procedure}]`)
    }

    // criar o diretorio de snippets dinamicos de cada workflow chamado
    route.snippetDir = path.join(SNIPPET_DIR, routeId)
    shell.mkdir('-p', route.snippetDir)

    try {
      return await this.executeRoute(route, kwargs, details)
    } catch (err) {
      const error = RoutesError.parse(err)
      // console.error(error)
      return Promise.reject(error)
    }
  }

  /**
   * Chamada RPC para uma rota dinamica
   * Este metodo adiciona o prefix da rota de execução no endpoint
   * @param  {String} name rota: `route.store.appAcoes.list
   * @param  {Mixed} payload
   * @param  {Oject} options opções de chamada do RPC via crossbar
   * @param  {Oject} routeProtocol especificar um RouteProtocol default: null
   * @return {Promise}
   */
  callRoute (name, payload, options = {}, routeProtocol = null) {
    return this.call(`${ROUTES_PREFIX}.${name}`, payload, options, routeProtocol)
  }

  /**
   * Chamada RPC para uma rota dinamica
   * Este metodo adiciona o prefix da rota de execução no endpoint
   * @param  {String} name rota: `route.store.appAcoes.list
   * @param  {Mixed} payload
   * @param  {Oject} options opções de chamada do RPC via crossbar
   * @param  {Oject} routeProtocol especificar um RouteProtocol default: null
   * @return {Promise}
   */
  route (...args) {
    return this.callRoute(...args)
  }

  async executeRoute (route, kwargs, details) {
    RoutesError.assert(route, 'B001: route instance required')

    let clousureReturnMethod
    let clousureReturnErrorMethod
    // valor de retorno do workflow
    let processFlowResult

    // console.log('this.details', this.details)
    this.log.info(`Running by [${this.log.colors.yellow(details.caller)}/${details.caller_authid}] <${this.log.colors.silly(route._id)}>`)

    // criar um sandbox - extendendo esta classe RouteWorkflowsExecute - 
    // para isolar cada execução do workflow com uma instancia do sandbox
    // permitindo a passagem de valores através do this para os steps do workflow
    let sandbox = RouteSandbox.extend(this)
    // sandbox.__setupSandbox(route, kwargs)
    // copiar os dados do caller para o sandbox
    sandbox.details = details

    Object.assign(sandbox, {
      
      clientApplication: {

        component (querySelector) {
          const protocol = {
            querySelector
          }
          return {
            method (name, ...args) {   
              return sandbox.session.call(`agent.${details.caller}`, [protocol], {
                plugin: 'execComponentMethod',
                payload: {
                  method: name,
                  args
                }
              })
            }
          }
        },
      },

      route (_endpoint, _kwargs, _options) {
        const protocol = {
          fromUser: details.caller_authid,
          fromSession: details.caller,
          targetUser: details.caller_authid,
          targetSession: details.caller,
        }
        return sandbox.session.call(`${ROUTES_PREFIX}.${_endpoint}`, [protocol], _kwargs, _options)
      }
    })

    // converter codigo em metodo da classe Sandbox - gravar em arquivo no diretorio .snippets/
    const { default: contentMethod } = await this.wrapFunction(route, route.content, 'content')

    // executar metodo e tratar erro do metodo
    try {
      clousureReturnMethod = await contentMethod.call(sandbox, { kwargs })
      // this.log.info(`Route complete <${this.log.colors.silly(route._id)}>`)
    } catch (err) {
      if (err instanceof app.ApplicationError) {
        throw err
      }
      const error = new RoutesError(`B002: <${route._id}> snippet error: ${err.message || err.toString()}`, err)
      // this.log.error(`Route error <${this.log.colors.silly(route._id)}>:` + error.toJSON())
      throw error
    } finally {
    }
    // retornar valor
    return clousureReturnMethod
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

  /**
   * Retorna log para o front end
   */
   async print (...args) {
    console.log(...args)
    await this.app.currentComponent.addLog(args)
  }
}

