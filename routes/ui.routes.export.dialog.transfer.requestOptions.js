import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import {createMongoFieldSearchQueryAnd} from '../lib/db/createMongoFieldSearchQuery.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.export.dialog.transfer.requestOptions'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    // let { limit, skip, query } = kwargs

    const limit = 250

    const viewport = this.clientApplication.component('#viewport')
    const dialog = this.clientApplication.component('#dialogExportRoutes')
    const transfer = this.clientApplication.component('#transferExportRoutes')

    const state = await dialog.method('getState')

    let query = String(state.query).toLowerCase()

    let queryObject = {}

    if (query) {
      queryObject = createMongoFieldSearchQueryAnd('_id', query)
    }

    const resultset = await Routes.findByAggregate(queryObject, {
      _id: 1
    }, {
      limit
    })

    if (resultset.total > limit) {
      viewport.method('Message', {
        type: 'warn',
        message: `Max items were be reached. Max items is ${limit}`
      })
    }

    transfer.method('updateOptions', resultset.data)
  }
}

