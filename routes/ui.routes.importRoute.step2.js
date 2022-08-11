import app from 'wampark'
import Routes from '../db/models/routes/index.js'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.importRoute.step2'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const dialog = this.clientApplication.component('#dialogUploadRoute')

    const inputUpload = this.clientApplication.component('#inputUpload')

    const btnNext = this.clientApplication.component('#btnNext')

    btnNext.method('updateProps', {
      disabled: true
    })

    inputUpload.method('submitUpload')

  }
}

