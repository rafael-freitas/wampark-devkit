import app from 'wampark'
import Routes from '../db/models/routes/index.js'
const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.delete'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    // console.log('endpoint', args, kwargs, details)

    let confirmAction = false
    const navlistLeft = this.clientApplication.component('#navlistLeft')
    const viewport = this.clientApplication.component('#viewport')

    const selected = await navlistLeft.method('getSelected')
    // console.log('selected', selected)

    if (!selected || !selected._id) {
      viewport.method('Message', {
        type: 'info',
        message: 'Select a record to deletet it',
      })
      return
    }

    try {
      confirmAction = await viewport.method('MessageBox', {
        title: 'Confirm',
        message: 'Continue to remove it?',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
      })
    } catch (error) {
      viewport.method('Message', {
        type: 'info',
        message: 'Remove canceled',
      })
      return false
    }

    if (!confirmAction) {
      return false
    }

    if (selected && selected._id) {
      const result = await Routes.deleteOne({_id: selected._id})
      console.log('result remove', result)

      viewport.method('Message', {
        type: 'success',
        message: `${selected.endpoint} removed`,
      })

      // reload no nav-list
      navlistLeft.method('handleQuickSearch')
      navlistLeft.method('setSelected', null)
      viewport.method('setState', {})
    }

  }
}

