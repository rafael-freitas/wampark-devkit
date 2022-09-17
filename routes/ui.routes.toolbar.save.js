import app from 'wampark'
import path from 'path'
import fs from 'fs'
import Routes from '../db/models/routes/index.js'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT
const MODEL_ROUTES_UPDATEAT = process.env.MODEL_ROUTES_UPDATEAT
const ENABLE_ROUTES_SOURCE_SYNC = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC)
const SOURCE_DIR = path.join(path.resolve(), process.env.ROUTES_SOURCE_DIR, 'routes')

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
            if (ENABLE_ROUTES_SOURCE_SYNC) {
              const sourcePath = path.join(SOURCE_DIR, doc._id + '.js')
              console.log(`[${this.uri}] UPDATE] ${doc._id} -> ${doc.hash}`)
              fs.writeFileSync(sourcePath, Routes.generateFileContent(doc))
            }
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
            if (ENABLE_ROUTES_SOURCE_SYNC) {
              const sourcePath = path.join(SOURCE_DIR, doc._id + '.js')
              console.log(`[${this.uri}] UPDATE] ${doc._id} -> ${doc.hash}`)
              fs.writeFileSync(sourcePath, Routes.generateFileContent(doc))
            }
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

