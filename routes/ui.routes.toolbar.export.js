import app from 'wampark'

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

    const { command } = kwargs

    const viewport = this.component('viewport')

    const navlistLeft = this.component('navlistLeft')
    const selected = await navlistLeft.method('getSelected')

    if (command === 'route') {
      if (!selected || !selected._id) {
        viewport.Message({
          type: 'info',
          message: 'Select a record to export',
        })
        return
      }
  
      return viewport.method('downloadURI', `//${process.env.HTTP_HOST}:${process.env.HTTP_PORT}/api/routes/download?_id=${selected._id}`, selected._id)
    } else {
      this.addDialogExport()
    }
  }

  async addDialogExport () {
    const viewport = this.component('viewport')

    await viewport.addDialog({
      id: 'dialogExportRoutes',
      //width: 'auto',
      title: 'Export routes',
      subtitle: 'Create a pack of routes',

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
                  content: 'Select on or many routes to create the pack'
                },
                {
                  component: 'i-input',
                  id: 'dialog_txtQuery',
                  label: 'Search routes',
                  name: 'query',
                  modelState: 'dialog',
                  events: [
                    {
                      on: 'input',
                      endpointPrefix: false,
                      endpoint: 'ui.routes.export.dialog.transfer.requestOptions'
                    }
                  ]
                }
              ],
              2: [
                {
                  component: 'i-transfer',
                  // label: 'Pack list',
                  id: 'transferExportRoutes',
                  titles: ['Avaliable routes', 'Routes on pack'],
                  modelState: 'dialog',
                  name: 'selectedRoutes',
                  fields: {
                    key: '_id',
                    label: '_id'
                  },
                  filterable: true,
                }
              ],
            }
          }
        ],

        footer: [
          {
            component: 'i-button',
            type: 'primary',
            // plain: true,
            label: 'Export',
            events: [
              {
                on: 'click',
                endpointPrefix: false,
                endpoint: 'ui.routes.export.dialog.exportPack'
              }
            ]
          },
        ]
      }
    })

    const input = this.component('dialog_txtQuery')
    input.method('focus')
  }
}

