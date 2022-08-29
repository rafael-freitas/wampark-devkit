import app from 'wampark'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

export default class RouteSandbox extends app.Route {
  constructor () {
    super({
      uri: 'sandbox'
    })
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
    return this.call(...args)
  }
}
