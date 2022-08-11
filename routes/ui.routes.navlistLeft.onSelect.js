import app from 'wampark'

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.navlistLeft.onSelect'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    // console.log('ui.routes.navlistLeft.onSelect', args, kwargs, details)

    const viewport = this.clientApplication.component('refViewport')

    const navlistLeft = this.clientApplication.component('#navlistLeft')
    const selected = await navlistLeft.method('getSelected')

    viewport.method('setState', selected)
    
  }
}

