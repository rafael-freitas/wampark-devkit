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
    const fileParts = Routes.parseFileContent(state.sourceCode)
    state.header = fileParts.header
    state.content = fileParts.content
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
          const document = Object.assign(doc.toObject(), {
            header: null,
            content: null,
            sourceCode: doc.getFileContent()
          })
          await viewport.updateState(document)
          
          // selecionar o registro atual
          navlistLeft.setSelected( doc)
        } catch (err) {
          const error = this.ApplicationError.parse(err)
          console.error('Error', error)
          switch (error.code) {
            case 11000:
              viewport.Notification({
                type: 'error',
                title: 'Routes',
                message: `${state.endpoint} maybe exists! ${error.message}`
              })
            break
          }

          viewport.Notification({
            type: 'error',
            title: 'Routes',
            message: error.message
          })
          
        }

        // atualizar nav-list
        await navlistLeft.handleQuickSearch()
      }
    } catch (err) {
      const error = this.ApplicationError.parse(err)
      console.log(this.uri, error)

      viewport.Notification({
        type: 'warning',
        title: 'Routes',
        message: error.message
      })
    }
  }
}

