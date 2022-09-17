import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import RouteSandbox from '../lib/RouteSandbox.js'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.execute'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    let confirmAction = false

    // console.log('ui.routes.toolbar.execute details', details)

    const viewport = this.component('viewport')

    try {
      confirmAction = await viewport.MessageBox({
        title: 'Execute a file',
        message: 'Execute this file on server?',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
      })
    } catch (error) {
      viewport.Message({
        type: 'info',
        message: 'Execute canceled',
      })
      return false
    }

    if (!confirmAction) {
      return false
    }

    viewport.Message({
      type: 'info',
      message: 'Running route...',
    })
    
    // obter dados do formulario
    const state = await viewport.method('getState')

    try {
      const route = await Routes.findById(state._id)
      
      // criar sendbox
      const sandbox = RouteSandbox.extend(this)
      sandbox.beforeSetup(args, kwargs, details)
      sandbox.setup(args, kwargs, details)

      this.log.info(`Excuted by [${this.log.colors.yellow(details.caller)}/${details.caller_authid}] <${this.log.colors.silly(route._id)}>`)
      const result = await sandbox.route(route._id, {})

      viewport.MessageBox({
        title: 'Result',
        message: JSON.stringify(result) || '(no return)',
        // showCancelButton: true,
        confirmButtonText: 'OK',
        // cancelButtonText: 'Cancel',
      })
      
    } catch (err) {
      const error = app.ApplicationError.parse(err)
      viewport.method('Notification', {
        type: 'error',
        title: 'Ops!!',
        message: `Error during running route ${state._id}. Check terminal log`,
      })
      console.error(error)
    }
  }
}

