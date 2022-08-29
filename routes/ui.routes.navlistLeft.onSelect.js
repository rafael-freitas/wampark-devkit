import app from 'wampark'

function truncate_with_ellipsis(s,maxLength) {
  if (s.length > maxLength) {
     return s.substring(0, maxLength) + '...'
  }
  return s
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
    viewport.method('setWindowTitle', `${selected._id}`)
    
  }
}

