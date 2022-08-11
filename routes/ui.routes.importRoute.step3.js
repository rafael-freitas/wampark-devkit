import app from 'wampark'
import Routes from '../db/models/routes/index.js'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.importRoute.step3'
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

    const viewport = this.clientApplication.component('#viewport')
    const navlistLeft = this.clientApplication.component('#navlistLeft')
    const dialog = this.clientApplication.component('#dialogUploadRoute')
    const btnNext = this.clientApplication.component('#btnNext')

    btnNext.method('disable', true)

    debugger

    // get dialog state
    const state = await dialog.method('getState')

    if (!state.filepath) {
      viewport.method('Notification', {
        type: 'error',
        title: 'Opss!',
        message: 'filepath not found'
      })
      return
    }

    try {
      try {
        let rawdata = fs.readFileSync(state.filepath)
        let route = JSON.parse(rawdata)
        let doc = await Routes.findOne({_id: state.endpoint})
        if (doc && doc._id) {
          doc = await Routes.findAndSave({_id: state.endpoint}, Object.assign({}, doc, route, {
            [MODEL_ROUTES_ENDPOINT]: state.endpoint,
          }))
          viewport.method('Notification', {
            type: 'success',
            title: 'Updated!',
            message: `${state.endpoint} updated!`
          })
        } else {
          doc = new Routes( Object.assign({}, doc, route, {
            [MODEL_ROUTES_ENDPOINT]: state.endpoint,
          }))
          // salvar no banco
          await doc.save()
          viewport.method('Notification', {
            type: 'success',
            title: 'Saved!',
            message: `${state.endpoint} created!`
          })
        }
        
        // selecionar o registro atual
        navlistLeft.method('setSelected', doc)
      } catch (error) {
        console.error('Error', error)
        viewport.method('Notification', {
          type: 'error',
          title: 'Opss!',
          message: error
        })
      }

      // atualizar nav-list
      await navlistLeft.method('handleQuickSearch')
    } catch (err) {
      console.log('FORM ERROR', err, model)

      viewport.method('Notification', {
        type: 'warning',
        title: 'Formulário',
        message: 'Preencha os campos obrigatórios do formulário'
      })
    } finally {
      dialog.method('close')
    }

    dialog.method('close')

  }
}

