
/**
* ******************************************************************************************************
*
*   WebRoute
*
*     Classe de rota para protocolo HTTP sobre Express
*     Todas as rotas devem herdar de WebRoute
*
*
*   @author     Rafael Freitas
*   @date       Feb 13 2018
*
*   @memberof module:lib/routes
*   @class WebRoute
*   @extends Route {@link module:lib/routes.Route}
*
* ******************************************************************************************************
*/

import app from 'wampark'
import lodash from 'lodash'
import Router from 'koa-router'
import { fileURLToPath } from 'url'
// import { dirname } from 'path'

const { isEmpty, isFunction, defaults } = lodash

const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

const _defaults = {
  type: app.RouteTypes.ALL,
  options: {},
  view: '',
  path: null,
  middleware: []
}

const routerInstance = Router()

export default class WebRoute extends app.Route {
  constructor (properties = {}) {
    super(...arguments)

    properties = defaults(this, properties, _defaults, {
      router: routerInstance
    })

    Object.assign(this, properties)

    const { uri } = this

    if (isEmpty(uri)) {
      throw new ReferenceError('Propriedade "uri" requirido', __filename)
    }
  }

  // render (response, data = {}) {
  //   if (this.view) {
  //     response.vueRender(this.view, Object.assign({}, this, data))
  //     return
  //   }
  //   this.json(response, data)
  // }

  /**
   * 
   * @param {Koa} server 
   * @param {String} forcePath force a URI to be used in the route
   * @returns 
   */
  static attach (server, forcePath = null) {
    app.ApplicationError.assert(server, 'WR001: Koa server not found')
    const route = new this()

    let { type, endpoint, uri, router, path, middleware } = route

    // se o type for invalido usar o metodo ALL
    if (!isFunction(router[type])) {
      type = app.RouteTypes.ALL
    }

    path = forcePath || path

    const method = router[type]
    method.apply(router, [uri].concat(middleware || []).concat([endpoint.bind(route)]))
    server.use(router.routes())

    route.onAttachSuccess()
    route.printLogAttachSuccess()

    return route
  }

  /**
   * endpoint - Route endpoint
   *
   * @param {Function} ctx Koa request context
   * @param {Function} next Koa next function interface
   *
   */
  async endpoint (ctx, next) {}
}
