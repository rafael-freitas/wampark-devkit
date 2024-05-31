import RouteSandbox from "./RouteSandbox"


export default class UIRoute extends RouteSandbox {

  viewport = null

  component = null

  moduleId = null

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)
    this.moduleId = String(this.uri).replace(/\W/ig, '_')
  }

  async endpoint (args, kwargs, details) {
    this.viewport = this.getComponentBySelector('viewport')

    this.component = this.viewport

    // obter componentes e atribuir ids
    let components = this.getUIComponents()
  }

  async getUIComponents (params = { args: [], kwargs: {}, details: {}}) {
    return {
      // lista de componentes
    }
  }

  async create (params = { args: [], kwargs: {}, details: {}}) {

  }

  setComponentId (component = {}, id) {
    component.id = `${this.moduleId}__${id}`
  }

  getComponentById (id) {
    return this.getComponentBySelector(`${this.moduleId}__${id}`)
  }
}
