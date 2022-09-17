import app from 'wampark'
// import Routes from '../db/models/routes/index.js'

const uploadActionUrl = `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/upload`

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
    const { command } = kwargs

    this.addDialogImport()
  }

  async addDialogImport () {
    const viewport = this.component('viewport')

    await viewport.addDialog({
      id: 'dialogUploadRoute',
      //width: 'auto',
      title: 'Import routes',
      subtitle: 'Importing a route or pack of routes from your computer',

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
                  content: 'Note: Whether the route exists it will be OVERWRITED!'
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

