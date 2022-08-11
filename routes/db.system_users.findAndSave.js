import app from 'wampark'
import Model from '../db/models/system_users/index.js'

export default class StoreModelFind extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'db.system_users.findAndSave'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const { query, data } = kwargs
    return Model.findAndSave(query, data)
  }
}

