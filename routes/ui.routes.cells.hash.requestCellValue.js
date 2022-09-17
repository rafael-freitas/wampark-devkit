import app from 'wampark'
import Routes from '../db/models/routes/index.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.cells.hash.requestCellValue'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    const { value } = kwargs

    const route = await Routes.findOne({_id: value}, {hash:1})

    if (route) {
      return route.hash
    }
    return '-'
  }
}

