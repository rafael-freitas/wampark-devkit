import app from 'wampark'
import Model from '../db/models/system_users/index.js'

export default class StoreModelFind extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'db.system_users.find'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const cursor = Model.find(kwargs)
    return cursor.exec()
  }
}

