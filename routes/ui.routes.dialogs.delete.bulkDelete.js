import app from 'wampark'
import Routes from '../db/models/routes/index.js'
const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.dialogs.delete.bulkDelete'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const { command } = kwargs

    if (command === 'bulk') {
      this.addDialogBulkDelete()
      return
    }

    let confirmAction = false
    const navlistLeft = this.component('navlistLeft')
    const viewport = this.component('viewport')
    const dialog = this.component('dialogBulkDelete')
    const table = this.component('tbRoutesDelete')

    const selecteds = await table.getSelectionRows()

    if (!selecteds.length) {
      viewport.Message({
        type: 'info',
        message: 'Select almost (1) item to delete',
      })
      return
    }

    const results = []
    for (const item of selecteds) {
      try {
        const result = await Routes.deleteOne({_id: item._id})
        results.push(result)
      } catch (err) {
        const error = app.ApplicationError.parse(err)
        console.error(error)
        viewport.Notification({
          type: 'error',
          title: 'Bulk delete',
          message: error.message
        })
      }
    }

    viewport.Notification({
      type: 'success',
      title: 'Bulk delete',
      message: `Delete (${results.length}) successful from (${selecteds.length}) items selecteds`
    })

    dialog.close()

    // reload no nav-list
    navlistLeft.handleQuickSearch()

  }
}

