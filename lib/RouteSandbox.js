import app from 'wampark'

export default class RouteSandbox extends app.Route {
  constructor () {
    super({
      uri: 'sandbox'
    })
  }
}
