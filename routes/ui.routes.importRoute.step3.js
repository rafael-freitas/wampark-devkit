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

  async updateRoute (endpoint, data) {
    let doc = await Routes.findOne({_id: endpoint})
    if (doc && doc._id) {
      return  Routes.findAndSave({_id: endpoint}, Object.assign({}, doc, data, {
        [MODEL_ROUTES_ENDPOINT]: endpoint,
      }))
    } else {
      doc = new Routes( Object.assign({}, doc, data, {
        [MODEL_ROUTES_ENDPOINT]: endpoint,
      }))
      // salvar no banco
      return doc.save()
    }
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
        let fileData = JSON.parse(rawdata)

        if (state.isPack) {
          const done = await Promise.all(fileData.data.map(async x => {
            return this.updateRoute(x.endpoint, x)
          }))
          viewport.method('Notification', {
            type: 'success',
            title: 'Pack imported!',
            message: `Pack ${state.filepath} processed and imported!`
          })
        } else {
          
          let doc = await Routes.findOne({_id: state.endpoint})
          if (doc && doc._id) {
            doc = await this.updateRoute(state.endpoint, fileData)
            viewport.method('Notification', {
              type: 'success',
              title: 'Updated!',
              message: `${state.endpoint} updated!`
            })
          } else {
            doc = await this.updateRoute(state.endpoint, fileData)
            viewport.method('Notification', {
              type: 'success',
              title: 'Saved!',
              message: `${state.endpoint} created!`
            })
          }
          // selecionar o registro atual
          navlistLeft.method('setSelected', doc)
        }
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

