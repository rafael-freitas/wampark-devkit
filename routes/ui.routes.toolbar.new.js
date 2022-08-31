import app from 'wampark'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.new'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    console.log('endpoint', args, kwargs, details)

    const viewport = this.clientApplication.component('#viewport')
    viewport.method('setState', {})

    const navlistLeft = this.clientApplication.component('#navlistLeft')
    navlistLeft.method('setSelected', null)


  }
}

