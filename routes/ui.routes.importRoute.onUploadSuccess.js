import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import path from 'path'
import fs from 'fs'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const MODEL_ROUTES_CONTENT = process.env.MODEL_ROUTES_CONTENT

/**
 * fuzzy search array
 * @param {Array} list 
 * @param {String} props row props to search. ex: "name description otherField"
 * @param {String} searchValue keyword
 * @returns {Array} filtered list
 */
function fuzzySearch (list, props, searchValue) {
  props = props.split(' ')
  let buf = ".*" + searchValue.replace(/(.)/g, "$1.*").toLowerCase()
  var reg = new RegExp(buf)
  let newList = list.filter((e) => {
    return props.map(p => reg.test(String(e[p]).toLowerCase())).includes(true)
  })
  return newList
}

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

    const { filepath } = kwargs

    const dialog = this.component('dialogUploadRoute')
    const viewport = this.component('viewport')

    let rawdata
    let fileData
    let isPack = false

    try {
      rawdata = fs.readFileSync(filepath)
      fileData = JSON.parse(rawdata)
      
      if (!rawdata || !fileData) {
        viewport.Notification({
          type: 'error',
          title: 'Invalid file',
          message: `E001: The file ${filepath} is not a JSON route file`
        })
        dialog.close()
        return
      }

      // pack
      if (fileData.data) {
        isPack = true
        if (fileData.data.length < 1) {
          viewport.Notification({
            type: 'error',
            title: 'Invalid pack',
            message: `E002: The file ${filepath} there is no a route list`
          })
          dialog.close()
          return
        }
      } else {
        if (!fileData._id || !fileData.hash) {
          viewport.Notification({
            type: 'error',
            title: 'Invalid file',
            message: `E003: The file ${filepath} is not a JSON route file`
          })
          dialog.close()
          return
        }
      }
    } catch (err) {
      console.error('Error to import JSON route file', err)
      viewport.Notification({
        type: 'error',
        title: 'File error',
        message: `Fail to open or parse ${filepath}: ${err.toString()}`
      })
      dialog.close()
      return
    }


    // remover todos os componentes do dialog
    dialog.clearSlot('main')

    dialog.addComponent({
      slot: 'footer',
      component: 'i-button',
      type: 'primary',
      label: 'Import',
      events: [
        {
          on: 'click',
          endpointPrefix: false,
          endpoint: 'ui.routes.importRoute.step3'
        }
      ]
    })

    if (isPack) {
      const filename = path.parse(filepath).name
      const data = fileData.data.map(x => {
        return {
          _id: x._id,
          hash: x.hash,
        }
      })

      const dataset = {
        total: data.length,
        data
      }
      dialog.addComponent({
        component: 'c-grid',
        row: [
          {
            span: 24,
            slot: [
              {
                component: 'c-text',
                content: `Checkout your route pack: ${filename}`
              }
            ]
          },

          {
            span: 24,
            slot: [
              {
                component: 'c-text',
                content: `Pack items: ${data.length}`
              },
              // {
              //   component: 'c-text',
              //   id: 'dialogImportPackTotal',
              //   content: `0`
              // }
            ]
          },

          {
            span: 24,
            slot: [
              {
                component: 'i-input',
                statePath: 'filterQuery',
                label: 'Filter:',
                methods: {
                  // fuzzySearch: String(fuzzySearch)
                },
                events: [
                  {
                    on: 'mounted',
                    eval: String(() => this.focus())
                  },
                  {
                    on: 'input',
                    eval: String(() => {
                      const table = this.getComponentById('tbImportRoutes')
                      const dialog = this.getComponentById('dialogUploadRoute')
                      clearTimeout(this.timer)
                      this.timer = setTimeout(() => {
                        table.updateDataset({
                          data: dialog.state.dataset.data.filter(x => 
                            x._id.toLocaleLowerCase().includes(String(this.value.value).toLocaleLowerCase())
                          )
                        })
                      }, 5)
                      
                    })
                  }
                ]
              }
            ]
          },

          {
            span: 24,
            slot: [
              {
                component: 'i-button',
                type: 'primary',
                plain: true,
                label: 'Select all',
                events: [
                  {
                    on: 'click',
                    eval: String(() => {
                      const table = this.getComponentById('tbImportRoutes')
                      table.refTable.value.toggleAllSelection()
                    })
                  }
                ]
              },
            ]
          },

          {
            span: 24,
            slot: [
              {
                slot: 'main',
                component: 'c-table',
                id: 'tbImportRoutes',
                enablePagination: false,
                height: 400,
                columns: [
                  {
                    slot: 'main',
                    component: 'c-table-column',
                    prop: '_id',
                    label: '_id',
                  },
                  {
                    slot: 'main',
                    component: 'c-table-column',
                    prop: 'hash',
                    label: 'hash',
                  },
                  {
                    slot: 'main',
                    component: 'c-table-column',
                    prop: '_id',
                    label: 'current hash',
                    events: [
                      {
                        on: 'requestCellValue',
                        endpointPrefix: false,
                        endpoint: 'ui.routes.cells.hash.requestCellValue'
                      },
                    ]
                  },
                ],
                events: [
                  // {
                  //   on: 'mounted',
                  //   eval: String(() => {
                  //     const dialog = this.getComponentById('dialogUploadRoute')
                  //     console.log(dialog.state.dataset)
                  //   })
                  // },
                  // {
                  //   on: 'requestDataset',
                  //   endpoint: 'ui.documentos.itens.tbItens.requestDataset'
                  // },
                ]
              }
            ]
          }

        ],
      })


      // STATE ----- atualizar state do dialog
      await dialog.setState({
        isPack,
        filepath: filepath,
        dataset: dataset,
        selecteds: []
      })

      // dialog.setMethod('fuzzySearch', String(fuzzySearch))

      // populate table
      dialog.eval(String(() => {
        const table = this.getComponentById('tbImportRoutes')
        table.updateDataset(this.state.dataset)
        // table.refTable.value.toggleAllSelection()
      }))

    } else {
      dialog.updateSlots({
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
            ],
            events: [
              {
                on: 'mounted',
                eval: String(() => this.focus())
              },
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

        // STATE ----- atualizar state do dialog
      dialog.setState({
        endpoint: fileData._id,
        hash: fileData.hash,
        filepath: filepath,
      })
    }
  }
}

