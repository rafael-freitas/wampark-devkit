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

    const viewport = this.component('viewport')
    const dialog = this.component('dialogExportRoutes')
    const transfer = this.component('transferExportRoutes')

    const state = await dialog.method('getState')

    let query = String(state.query).toLowerCase()

    let queryObject = {}

    if (query) {
      queryObject = createMongoFieldSearchQueryAnd('_id', query)
    }

    const resultset = await Routes.findBy(queryObject, '_id', {
      _id: 1
    }, {
      limit
    })

    if (resultset.total > limit) {
      viewport.Message({
        type: 'warn',
        message: `Max items were be reached. Max items is ${limit}`
      })
    }

    transfer.method('updateOptions', resultset.data)
  }
}

