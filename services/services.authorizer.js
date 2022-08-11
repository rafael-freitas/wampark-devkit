
/**
* ******************************************************************************************************
*
*   Wamp routes access authorizer route
*
*
*   @author     Rafael Freitas
*   @date       May 11 2021
*
*   @namespace Services
*
* ******************************************************************************************************
*/

import app from 'wampark'

export default class ServiceAuthorizer extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'services.authorizer',
      options: {}
    })
  }

  /**
   * Procudure para autenticar usuarios do frontend
   * Configuração no arquivo config.json do Crossbar.io:
   * ```
   * {
   *     "name": "frontend",
   *     "authorizer": "server.authorizer"
   * }
   * ```
   * __Tipo:__ RPC
   * @event "server.authorizer"
   * @param {Object[]} args
   * @param {int} args[].0 - session: id da sessão
   * @param {String} args[].1 - uri: rota
   * @param {String} args[].2 - action: liberar
   * @param {Object} kwargs - não usado
   * @param {Object} details - detalhes do usuario de sessão
   * @return {Boolean} Retorna `true` se o usuário da sessão está autorizado à acessar a rota
   */
  endpoint (args, kwargs, details) {
    return new Promise(async (resolve, reject) => {
      const [details, uri, action] = args
      const { session, authid } = details
      const { log } = this
      
      try {
        log.debug(`grant access action: [${log.colors.data(action)}] on <${log.colors.data(uri)}> user: ${log.colors.data(authid)} on sesion ${log.colors.data(session)} - ${log.ok}`)
        resolve({ allow: true, disclose: true })
      } catch (error) {
        log.error(`access deny action: [${log.colors.data(action)}] on <${log.colors.data(uri)}> user: ${log.colors.data(authid)} on sesion ${log.colors.data(session)} - ${log.ok}`, error)
        resolve({ allow: false, disclose: false })
      }
    })
  }
}
