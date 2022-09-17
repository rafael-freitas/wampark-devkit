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

    const viewport = this.component('viewport')
    viewport.setState({})

    const navlistLeft = this.component('navlistLeft')
    navlistLeft.setSelected( null)


  }
}

