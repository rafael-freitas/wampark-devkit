import app from 'wampark'
import Routes from '../db/models/routes/index.js'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.importRoute.onUploadSuccess'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const { default: fs} = await import('fs')

    const { filepath } = kwargs

    const dialog = this.clientApplication.component('#dialogUploadRoute')
    const viewport = this.clientApplication.component('#viewport')
    const btnNext = this.clientApplication.component('#btnNext')

    let rawdata
    let fileData
    let isPack = false

    try {
      rawdata = fs.readFileSync(filepath)
      fileData = JSON.parse(rawdata)
      
      if (!rawdata || !fileData) {
        viewport.method('Notification', {
          type: 'error',
          title: 'Invalid file',
          message: `E001: The file ${filepath} is not a JSON route file`
        })
        dialog.method('close')
        return
      }

      // pack
      if (fileData.data) {
        isPack = true
        if (fileData.data.length < 1) {
          viewport.method('Notification', {
            type: 'error',
            title: 'Invalid pack',
            message: `E002: The file ${filepath} there is no a route list`
          })
          dialog.method('close')
          return
        }
      } else {
        if (!fileData._id || !fileData.hash) {
          viewport.method('Notification', {
            type: 'error',
            title: 'Invalid file',
            message: `E003: The file ${filepath} is not a JSON route file`
          })
          dialog.method('close')
          return
        }
      }
    } catch (err) {
      console.error('Error to import JSON route file', err)
      viewport.method('Notification', {
        type: 'error',
        title: 'File error',
        message: `Fail to open or parse ${filepath}: ${err.toString()}`
      })
      dialog.method('close')
      return
    }


    // remover todos os componentes do dialog
    dialog.method('clearSlot', 'main')

    dialog.method('addComponent', {
      slot: 'footer',
      component: 'i-button',
      type: 'primary',
      label: 'Finish',
      events: [
        {
          on: 'click',
          endpointPrefix: false,
          endpoint: 'ui.routes.importRoute.step3'
        }
      ]
    })

    if (isPack) {
      dialog.method('addComponent', {
        slot: 'main',
        modelState: 'dialog',
        component: 'c-text',
        content: 'Pack list: ' + JSON.stringify(fileData.data.map(x => x._id))
      })

      // STATE ----- atualizar state do dialog
      dialog.method('setState', {
        isPack,
        filepath: filepath,
      })

    } else {
      dialog.method('updateSlots', {
        main: [
          {
            modelState: 'dialog',
            component: 'i-input',
            id: 'dialog_txtEndpoint',
            name: 'endpoint',
            label: 'Endpoint',
            type: 'text',
            modelState: 'dialog',
            rules: [
              {
                required: true,
                message: "endpoint is riquered",
                trigger: ['blur', 'change'],
              }
            ]
          },

          {
            slot: 'main',
            modelState: 'dialog',
            component: 'i-input',
            id: 'dialog_txtHash',
            name: 'hash',
            label: 'Hash',
            type: 'text',
            disabled: true,
            modelState: 'dialog',
          }
        ],
      })

      const dialog_txtEndpoint = await this.clientApplication.component('#dialog_txtEndpoint')
      dialog_txtEndpoint.method('focus')

        // STATE ----- atualizar state do dialog
      dialog.method('setState', {
        endpoint: fileData._id,
        hash: fileData.hash,
        filepath: filepath,
      })
    }
  }
}

