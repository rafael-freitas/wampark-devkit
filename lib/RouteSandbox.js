import app from 'wampark'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

export default class RouteSandbox extends app.Route {
  static createSandbox (fromRoute, details, protocol) {
    let sandbox = RouteSandbox.extend(fromRoute)
    return sandbox
  }

  constructor () {
    super({
      uri: 'sandbox'
    })
  }

  setup (args = [], kwargs = {}, details = {}) {
    let [protocol = {}] = args
    this.details = details
    
    if (protocol.targetSession) {
      this.details = Object.assign({}, details, {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
      })
    } else {
      protocol = {
        fromUser: details.caller_authid,
        fromSession: details.caller,
        targetUser: details.caller_authid,
        targetSession: details.caller,
      }
    }
    this.protocol = protocol
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
  route (name, payload, options = {}) {
    return this.call(`${ROUTES_PREFIX}.${name}`, payload, options)
  }
}
