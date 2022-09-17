import app from 'wampark'
import Routes from '../db/models/routes/index.js'
const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.toolbar.delete'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const { command } = kwargs

    if (command === 'bulk') {
      this.addDialogBulkDelete()
      return
    }

    let confirmAction = false
    const navlistLeft = this.component('navlistLeft')
    const viewport = this.component('viewport')

    const selected = await navlistLeft.method('getSelected')
    // console.log('selected', selected)

    if (!selected || !selected._id) {
      viewport.Message({
        type: 'warning',
        message: 'Select a record to delete it',
      })
      return
    }

    try {
      confirmAction = await viewport.MessageBox({
        title: 'Confirm',
        message: 'Continue to remove it?',
        showCancelButton: true,
        confirmButtonText: 'OK',
        cancelButtonText: 'Cancel',
      })
    } catch (error) {
      viewport.Message({
        type: 'info',
        message: 'Remove canceled',
      })
      return false
    }

    if (!confirmAction) {
      return false
    }

    if (selected && selected._id) {
      const result = await Routes.deleteOne({_id: selected._id})

      viewport.Message({
        type: 'success',
        message: `${selected.endpoint} removed`,
      })

      // reload no nav-list
      navlistLeft.handleQuickSearch()
      navlistLeft.setSelected( null)
      viewport.setState({})
    }

  }

  async addDialogBulkDelete () {
    const viewport = this.component('viewport')

    await viewport.addDialog({
      id: 'dialogBulkDelete',
      //width: 'auto',
      title: 'Bulk delete',
      subtitle: 'Delete many routes at a time',

      slots: {
        main: [
          {
            component: 'c-grid',
            row: [
              {
                span: 24,
                slot: [
                  {
                    component: 'c-text',
                    content: `WARNING: The selected routes will be removed from data base permanently`
                  }
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
                        endpointPrefix: false,
                        endpoint: 'ui.routes.dialogs.delete.requestDataset'
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
                          const table = this.getComponentById('tbRoutesDelete')
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
                    id: 'tbRoutesDelete',
                    enablePagination: true,
                    pageSize: 20,
                    defaultSort: {prop: '_id', order: 1},
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
                    ],
                    events: [
                      {
                        on: 'requestDataset',
                        endpointPrefix: false,
                        endpoint: 'ui.routes.dialogs.delete.requestDataset'
                      }
                    ]
                  }
                ]
              }
    
            ],
          }
        ],

        footer: [
          {
            component: 'i-button',
            type: 'primary',
            // plain: true,
            label: 'Delete',
            events: [
              {
                on: 'click',
                endpointPrefix: false,
                endpoint: 'ui.routes.dialogs.delete.bulkDelete'
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

