import app from 'wampark'
import Routes from '../db/models/routes/index.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.export'
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

    const viewport = this.clientApplication.component('#viewport')

    const navlistLeft = this.clientApplication.component('#navlistLeft')
    const selected = await navlistLeft.method('getSelected')

    if (!selected || !selected._id) {
      viewport.method('Message', {
        type: 'info',
        message: 'Select a record to export',
      })
      return
    }

    viewport.method('downloadURI', `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/download?_id=${selected._id}`, selected._id)

    // const route = await Routes.findOne({_id: selected._id})
    // const fileContent = JSON.stringify(route)


    // console.log('route', route)
  }
}

