import ModuleRoute from "./ModuleRoute.js"

export default class UIRoute extends ModuleRoute {

  viewport = null

  scope = null

  components = {}

  namespace = null
  namespaceId = null
  namespaceComponentId = null
  namespaceComponentName = 'scope'

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)
    if (!this.namespaceComponentId) {
      this.namespaceComponentId = `${this.namespaceId}_${this.namespaceComponentName}`
    }
  }

  async endpoint (args, kwargs, details) {
    this.viewport = this.getComponentBySelector('viewport')

    // dialog ou drawer
    this.scope = this.getNamespaceComponentById(this.namespaceComponentId)

    return this.handleCreate(args, kwargs, details)
  }

  configureNamespaceComponents (components = this.components) {
    Object.keys(components).forEach((key) => {
      if (components[key].id !== null) {
        components[key].id = `${this.namespaceId}_${key}`
      }
    })
  }

  setNamespaceComponentId (component = {}, id) {
    component.id = `${this.namespaceId}__${id}`
  }

  getNamespaceComponentById (id) {
    return this.getComponentBySelector(`${this.namespaceId}__${id}`)
  }
}
