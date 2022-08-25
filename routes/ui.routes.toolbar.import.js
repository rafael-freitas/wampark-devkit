import app from 'wampark'
import Routes from '../db/models/routes/index.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.import'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const viewport = this.clientApplication.component('#viewport')
    const navlistLeft = this.clientApplication.component('#navlistLeft')
    const selected = await navlistLeft.method('getSelected')

    const uploadActionUrl = `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/upload`


    await viewport.method('addDialog', {
      id: 'dialogUploadRoute',
      //width: 'auto',
      title: 'Import a Route',
      subtitle: 'Importing a Route from your computer',
      content: `Note: A existing registred route will be overwrited!`
    })

    const dialog = this.clientApplication.component('#dialogUploadRoute')

    dialog.method('addComponent', {
      slot: 'main',
      modelState: 'dialog',
      component: 'i-upload',
      action: uploadActionUrl,
      id: 'inputUpload',
      name: 'file',
      label: 'Upload',
      events: [
        {
          on: 'success',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.importRoute.onUploadSuccess'
        }
      ]
    })

    // dialog buttons ----------------------

    await dialog.method('addComponent', {
      slot: 'footer',
      component: 'i-button',
      id: 'btnNext',
      label: 'Next',
      type: 'primary',
      events: [
        {
          on: 'click',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.importRoute.step2'
        }
      ]
    })
  }
}

