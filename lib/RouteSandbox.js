import app from 'wampark'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

export default class RouteSandbox extends app.Route {
  static createSandbox (fromRoute, details, protocol) {
    let sandbox = RouteSandbox.extend(fromRoute)
    return sandbox
  }

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)
  }

  beforeSetup (args = [], kwargs = {}, details = {}) {
    let [protocol = {}, ..._args] = args
    this.details = details

    if (typeof protocol !== 'object') {
      protocol = {
        protocolValue: protocol
      }
    }
    
    if (protocol.targetSession) {
      this.details = Object.assign({}, details, {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
      })
    } else {
      Object.assign(protocol || {}, {
        fromUser: details.caller_authid,
        fromSession: details.caller,
        targetUser: details.caller_authid,
        targetSession: details.caller,
      })
    }
    this.protocol = protocol
    // this.protocol.args = JSON.parse(JSON.stringify(args))
    this.protocol.args = _args
  }

  isRequestServerSession () {
    return this.protocol.fromSession === this.session.id
  }

  isHttpRequest () {
    return !!this.protocol.http
  }

  getHttpAuthorizationToken () {
    if (!this.protocol.headers) {
      return false
    }
    return this.protocol.headers.authorization
  }

  // o metodo endpoint com os parametros default args, kwargs e details; vai checar se existe um metodo default que veio do arquivo importado
  endpoint (args, kwargs, details) {
    // checar se existe o metodo default() e chamar passando args
    if (this.default) {
      return this.default({ args, kwargs, details })
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
  route (name, payload, options = {}) {
    return this.call(`${ROUTES_PREFIX}.${name}`, payload, options)
  }
}
