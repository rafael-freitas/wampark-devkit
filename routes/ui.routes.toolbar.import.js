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

    const uploadActionUrl = `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/upload`

    await viewport.method('addDialog', {
      id: 'dialogUploadRoute',
      //width: 'auto',
      title: 'Import a Route',
      subtitle: 'Importing a Route from your computer',

      slots: {
        main: [
          {
            component: 'c-grid',
            cols: {
              1: {span: 24},
              2: {span: 24},
            },
            slots: {
              1: [
                {
                  component: 'c-text',
                  content: 'Note: An existing registred route will be OVERWRITED!'
                }
              ],
              2: [
                {
                  modelState: 'dialog',
                  component: 'i-upload',
                  action: uploadActionUrl,
                  autoUpload: true,
                  id: 'inputUpload',
                  name: 'file',
                  label: 'Upload',
                  events: [
                    {
                      on: 'success',
                      endpointPrefix: false,
                      endpoint: 'ui.routes.importRoute.onUploadSuccess'
                    }
                  ]
                }
              ],
            }
          }
        ]
      }
    })

  }
}

