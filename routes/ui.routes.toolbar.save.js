import app from 'wampark'
import Routes from '../db/models/routes/index.js'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT
const MODEL_ROUTES_UPDATEAT = process.env.MODEL_ROUTES_UPDATEAT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.save'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    let confirmSave = false

    const viewport = this.component('viewport')
    const navlistLeft = this.component('navlistLeft')

    // try {
    //   confirmSave = await viewport.MessageBox({
    //     title: 'Confirm',
    //     message: 'Continue to save it?',
    //     showCancelButton: true,
    //     confirmButtonText: 'OK',
    //     cancelButtonText: 'Cancel',
    //   })
    // } catch (error) {
    //   viewport.Message({
    //     type: 'info',
    //     message: 'Save data canceled',
    //   })
    //   return false
    // }

    // if (!confirmSave) {
    //   return false
    // }
    
    // obter dados do formulario
    const state = await viewport.method('getState')
    try {
      const isValid = await viewport.method('isFormValid')
      if (isValid) {
        try {
          let doc
          if (state._id) {
            doc = await Routes.findAndSave({_id: state._id}, {
              [MODEL_ROUTES_ENDPOINT]: state.endpoint,
              [MODEL_ROUTES_CONTENT]: state.content,
              [MODEL_ROUTES_UPDATEAT]: Date.now(),
              header: state.header,
            })
            // this.clientApplication.notify.success('Object updated!', 'Alright!!')
            viewport.Message({
              type: 'success',
              // title: 'Updated!',
              message: `${state._id} updated OK!`
            })
          } else {
            doc = new Routes({
              [MODEL_ROUTES_ENDPOINT]: state.endpoint,
              [MODEL_ROUTES_CONTENT]: state.content,
              [MODEL_ROUTES_UPDATEAT]: Date.now(),
              header: state.header,
            })
            // salvar no banco
            await doc.save()
            viewport.Message({
              type: 'success',
              // title: 'Updated!',
              message: `${doc._id} created OK!`
            })
            // this.clientApplication.notify.success('Object saved!', 'Alright!!')
          }
          // atualizar o formulario
          await viewport.method('updateState', doc)
          
          // selecionar o registro atual
          navlistLeft.setSelected( doc)
        } catch (error) {
          console.error('Error', error)
          viewport.method('Notification', {
            type: 'error',
            title: 'Opss!',
            message: error
          })
        }

        // atualizar nav-list
        await navlistLeft.handleQuickSearch()
      }
    } catch (err) {
      console.log('FORM ERROR', err, model)

      viewport.method('Notification', {
        type: 'warning',
        title: 'Formulário',
        message: 'Preencha os campos obrigatórios do formulário'
      })
    }
  }
}

