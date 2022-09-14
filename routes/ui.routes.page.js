import app from 'wampark'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.page'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    // console.log('endpoint', args, kwargs, details)

    // layout -------------------

    const viewport = this.clientApplication.component('#viewport')

    viewport.method('setWindowTitle', `Application Routes (${ROUTES_PREFIX})`)

    viewport.method('addHotkeys', 'ctrl+s, command+s', {
      endpointPrefix: false,
      endpoint: 'ui.routes.toolbar.save'
    })
    
    viewport.method('updateProps', {
      labelPosition: 'top',
      labelWidth: 'auto'
    })

    viewport.method('addComponent', {
      component: 'layout-dual-aside',
      id: 'pageLayout',
      title: 'Routes',
      showLeftSlot: true,
      columnWidth: '350px',

      slots: {
        toolbar: [
          {
            component: 'i-button',
            name: 'btnSave',
            label: 'Save',
            type: 'primary',
            events: [
              {
                on: 'click',
                target: 'server',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.save'
              }
            ]
          },

          {
            component: 'i-button',
            name: 'btnNew',
            label: 'New route',
            type: 'success',
            plain: true,
            events: [
              {
                on: 'click',
                target: '#inputEndpoint',
                method: 'focus'
              },
              {
                on: 'click',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.new'
              }
            ]
          },

          {
            component: 'i-button',
            name: 'btnDelete',
            label: 'Delete',
            type: 'danger',
            plain: true,
            events: [
              {
                on: 'click',
                target: 'server',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.delete'
              }
            ]
          },

          {
            component: 'i-button',
            name: 'btnExecute',
            label: 'Execute',
            type: 'info',
            plain: true,
            events: [
              {
                on: 'click',
                target: 'server',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.execute'
              }
            ]
          },

          // {
          //   component: 'i-button',
          //   name: 'btnExport',
          //   label: 'Export',
          //   type: 'primary',
          //   plain: true,
          //   events: [
          //     {
          //       on: 'click',
          //       target: 'server',
          //       endpointPrefix: false,
          //       endpoint: 'ui.routes.toolbar.export'
          //     }
          //   ]
          // },

          {
            component: 'i-button',
            name: 'btnImport',
            label: 'Import',
            type: 'primary',
            plain: true,
            events: [
              {
                on: 'click',
                target: 'server',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.import'
              }
            ]
          },

          {
            component: 'c-dropdown',
            events: [
              {
                on: 'command',
                endpointPrefix: false,
                endpoint: 'ui.routes.toolbar.export'
              }
            ],

            slots: {
              main: [
                {
                  component: 'i-button',
                  label: 'Export',
                  type: 'primary',
                  plain: true,
                },
              ],

              dropdown: [
                {
                  component: 'el-dropdown-item',
                  label: 'Export selected route',
                  command: 'route',
                },
                {
                  component: 'el-dropdown-item',
                  label: 'Export a route pack',
                  command: 'pack',
                },
              ]
            }
          },

        ],

        widgets: [
          {
            component: 'c-small-widget',
            description: 'Endpoint',
            // formatter: 'datetime',
            statePath: 'endpoint',
          },
          {
            component: 'c-small-widget',
            description: 'Update at',
            formatter: 'datetime',
            statePath: 'updatedAt',
          },
        ],

        left: [
          {
            component: 'nav-list',
            id: 'navlistLeft',
            name: 'navlistLeft',
            labelKey: 'endpoint',
            captionKey: 'endpoint',
            limit: 50,
            events: [
              {
                on: 'requestDataset',
                endpointPrefix: false,
                endpoint: 'ui.routes.navlistLeft.requestDataset'
              },
              {
                on: 'select',
                endpointPrefix: false,
                endpoint: 'ui.routes.navlistLeft.onSelect'
              },
            ]
          }
        ],
        main: [
          {
            component: 'c-card',
            id: 'form_card1',
            title: 'Route',

            slots: {
              main: [
                {
                  component: 'c-grid',
                  cols: {
                    1: {span: 17},
                    2: {span: 7}
                  },
            
                  slots: {
                    1: [
                      {
                        component: 'i-input',
                        id: 'inputEndpoint',
                        name: 'endpoint',
                        label: 'Endpoint',
                        rules: [
                          {
                            required: true,
                            message: "routes name is riquered",
                            trigger: "change",
                          }
                        ]
                      }
                    ],
                    2: [
                      {
                        component: 'i-input',
                        id: 'inputHash',
                        name: 'hash',
                        label: 'Hash',
                        disabled: true,
                      }
                    ],
                  }
                }
              ]
            }
          },

          {
            component: 'c-card',
            id: 'form_card2',
            title: 'Content',

            slots: {
              main: [
                {
                  component: 'c-grid',
                  cols: {
                    1: {span: 24},
                    2: {span: 24}
                  },
            
                  slots: {
                    1: [
                      {
                        component: 'i-code',
                        id: 'inputHeader',
                        name: 'header',
                        label: 'Header'
                      }
                    ],
                    2: [
                      {
                        component: 'i-code',
                        id: 'inputContent',
                        name: 'content',
                        label: 'export default async function content ({kwargs})',
                      }
                    ],
                  }
                }
              ]
            }
          },

        ]
      }
    })

  }
}

