import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import {createMongoFieldSearchQueryAnd} from '../lib/db/createMongoFieldSearchQuery.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.export.dialog.exportPack'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    const viewport = this.component('viewport')
    const dialog = this.component('dialogExportRoutes')

    const state = await dialog.method('getState')

    if (!state.selectedRoutes || state.selectedRoutes.length < 1) {
      viewport.Message({
        type: 'warn',
        message: `Please select 1 or more items to create a pack`
      })
      return
    }

    const selecteds = JSON.stringify(state.selectedRoutes)

    return viewport.method('downloadURI', `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/download?selecteds=${selecteds}`, Date.now())

  }
}

