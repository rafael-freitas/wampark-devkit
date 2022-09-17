import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import fs from 'fs'
import path from 'path'

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

    const viewport = this.component('#viewport')
    const navlistLeft = this.component('#navlistLeft')
    const dialog = this.component('#dialogUploadRoute')
    const btnNext = this.component('#btnNext')

    btnNext.disable(true)

    // get dialog state
    const state = await dialog.getState()

    if (!state.filepath) {
      viewport.Notification({
        type: 'error',
        title: 'Opss!',
        message: 'filepath not found'
      })
      return
    }

    const filename = path.parse(state.filepath).name

    try {
      try {
        let rawdata = fs.readFileSync(state.filepath)
        let fileData = JSON.parse(rawdata)

        if (state.isPack) {
          const table = this.component('tbImportRoutes')
          const selecteds = await table.getSelectionRows()

          if (selecteds.length < 1) {
            viewport.Notification({
              type: 'warning',
              title: 'Pack import',
              message: `Select almost one route to import`
            })
            return
          }

          const filtred = fileData.data.filter(x => selecteds.findIndex(o => o._id == x._id) > -1)
          const done = await Promise.all(filtred.map(async x => {
            return this.updateRoute(x.endpoint, x)
          }))

          viewport.Notification({
            type: 'success',
            title: 'Pack import',
            message: `Pack imported ${filtred.length} of ${fileData.data.length} items from ${filename}`
          })
          dialog.close()
          
        } else {
          
          let doc = await Routes.findOne({_id: state.endpoint})
          if (doc && doc._id) {
            doc = await this.updateRoute(state.endpoint, fileData)
            viewport.Notification({
              type: 'success',
              title: 'Route import',
              message: `${state.endpoint} updated!`
            })
          } else {
            doc = await this.updateRoute(state.endpoint, fileData)
            viewport.Notification({
              type: 'success',
              title: 'Route import',
              message: `${state.endpoint} created!`
            })
            
          }
          // selecionar o registro atual
          navlistLeft.method('setSelected', doc)
        }
      } catch (err) {
        const error = app.ApplicationError.parse(err)
        console.error(this.uri, error)
        viewport.Notification({
          type: 'error',
          title: 'Opss!',
          message: error.message
        })
      }

      // atualizar nav-list
      await navlistLeft.handleQuickSearch()
    } catch (err) {
      console.log('FORM ERROR', err, model)

      viewport.Notification({
        type: 'warning',
        title: 'Import routes',
        message: 'Fill the form'
      })
    } finally {
      
    }

  }
}

