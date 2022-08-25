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
    let route

    try {
      rawdata = fs.readFileSync(filepath)
      route = JSON.parse(rawdata)
      
      if (!rawdata || !route) {
        viewport.method('Notification', {
          type: 'error',
          title: 'Invalid file',
          message: `E001: The file ${filepath} is not a JSON route file`
        })
        dialog.method('close')
        return
      }
      
      if (!route._id || !route.hash) {
        viewport.method('Notification', {
          type: 'error',
          title: 'Invalid file',
          message: `E002: The file ${filepath} is not a JSON route file`
        })
        dialog.method('close')
        return
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
      slot: 'main',
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
    })

    dialog.method('addComponent', {
      slot: 'main',
      modelState: 'dialog',
      component: 'i-input',
      id: 'dialog_txtHash',
      name: 'hash',
      label: 'Hash',
      type: 'text',
      disabled: true,
      modelState: 'dialog',
    })

    // dialog buttons ----------------------

    // adicionar botao de proximo
    // await dialog.method('removeComponentFromSlot', 'btnNext')
    
    btnNext.method('removeEvents', 'click')
    btnNext.updateProps({
      label: 'Finish',
      disabled: false,
      events: [
        {
          on: 'click',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.importRoute.step3'
        }
      ]
    })
    
    // await dialog.method('addComponent', {
    //   slot: 'footer',
    //   component: 'i-button',
    //   id: 'btnNext',
    //   label: 'Finish',
    //   type: 'primary',
    //   events: [
    //     {
    //       on: 'click',
    //       target: 'server',
    //       endpoint: 'ui.routes.importRoute.step3'
    //     }
    //   ]
    // })

    // STATE ----- atualizar state do dialog
    dialog.method('setState', {
      endpoint: route._id,
      hash: route.hash,
      filepath: filepath,
    })

    const dialog_txtEndpoint = await this.clientApplication.component('#dialog_txtEndpoint')
    dialog_txtEndpoint.method('focus')

  }
}

