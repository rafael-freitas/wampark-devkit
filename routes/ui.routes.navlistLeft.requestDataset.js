import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import {createMongoFieldSearchQueryAnd} from '../lib/db/createMongoFieldSearchQuery.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.navlistLeft.requestDataset'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    let { limit, skip, query } = kwargs

    const navlistLeft = this.component('navlistLeft')

    query = query.toLowerCase()

    let queryObject = {}

    if (query) {
      queryObject = createMongoFieldSearchQueryAnd('_id', query)
    }

    const resultset = await Routes.findBy(queryObject, '_id endpoint', {
      limit, skip, sort: {_id: 1}
    })

    // console.log('resultset', resultset)

    if (skip === 0) {
      await navlistLeft.clearDataset()
    }

    navlistLeft.updateDataset(resultset)
  }
}

