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
      state: {
        title: 'Routessss'
      }
    })

    // configure layout ------------------

    const layout = this.clientApplication.component('#pageLayout')

    layout.method('addComponent', {
      slot: 'left',
      component: 'nav-list',
      id: 'navlistLeft',
      name: 'navlistLeft',
      labelKey: 'endpoint',
      events: [
        {
          on: 'requestDataset',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.navlistLeft.requestDataset'
        },
        {
          on: 'select',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.navlistLeft.onSelect'
        },
      ]
    })

    // panels -----------------------

    layout.method('addComponent', {
      slot: 'main',
      component: 'c-collapse',
      id: 'layoutCollapse',
    })

    const collapse = this.clientApplication.component('#layoutCollapse')

    collapse.method('addPanel', {
      name: 'panel1',
      title: 'General',
    })
    collapse.method('addPanel', {
      name: 'panel2',
      title: 'Content',
    })

    // form -----------------------

    await collapse.method('addComponent', {
      slot: 'panel1',
      component: 'c-grid',
      id: 'row1',
      cols: {
        1: {span: 17},
        2: {span: 7}
      }
    })

    const row1 = this.clientApplication.component('#row1')

    row1.method('addComponent', {
      slot: 1,
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
    })
    row1.method('addComponent', {
      slot: 2,
      component: 'i-input',
      id: 'inputHash',
      name: 'hash',
      label: 'Hash',
      disabled: true,
    })

    collapse.method('addComponent', {
      slot: 'panel2',
      component: 'i-code',
      id: 'inputHeader',
      name: 'header',
      label: 'Header'
    })
    
    collapse.method('addComponent', {
      slot: 'panel2',
      component: 'i-code',
      id: 'inputContent',
      name: 'content',
      label: 'export default async function content ({kwargs})',
    })

    // toolbar ---------------------

    layout.method('addComponent', {
      slot: 'toolbar',
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
    })

    layout.method('addComponent', {
      slot: 'toolbar',
      component: 'i-button',
      name: 'btnNew',
      label: 'New item',
      type: 'success',
      plain: true,
      events: [
        {
          on: 'click',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.toolbar.new'
        }
      ]
    })

    layout.method('addComponent', {
      slot: 'toolbar',
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
    })

    layout.method('addComponent', {
      slot: 'toolbar',
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
    })

    layout.method('addComponent', {
      slot: 'toolbar',
      component: 'i-button',
      name: 'btnExport',
      label: 'Export',
      type: 'primary',
      plain: true,
      events: [
        {
          on: 'click',
          target: 'server',
          endpointPrefix: false,
          endpoint: 'ui.routes.toolbar.export'
        }
      ]
    })

    layout.method('addComponent', {
      slot: 'toolbar',
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
    })
  }
}

