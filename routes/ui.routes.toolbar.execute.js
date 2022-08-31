import app from 'wampark'
import Routes from '../db/models/routes/index.js'

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

    console.log('details', details)

    const viewport = this.clientApplication.component('#viewport')

    try {
      confirmAction = await viewport.method('MessageBox', {
        title: 'Execute a file',
        message: 'Execute this file on server?',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
      })
    } catch (error) {
      viewport.method('Message', {
        type: 'info',
        message: 'Execute canceled',
      })
      return false
    }

    if (!confirmAction) {
      return false
    }
    
    // obter dados do formulario
    const model = await viewport.method('getState')

    try {
      const systemFile = await Routes.findById(model._id)
      const result = await this.call('file.' + systemFile._id, {}, this.routeProtocol)

      viewport.method('MessageBox', {
        title: 'Result',
        message: result,
        // showCancelButton: true,
        confirmButtonText: 'OK',
        // cancelButtonText: 'Cancel',
      })
      
      this.clientApplication.notify.success('System file exected!', 'Alright')
    } catch (err) {

      this.clientApplication.notify.error('Error during executing system file. Check terminal log', 'Opss!')
    }
  }
}

