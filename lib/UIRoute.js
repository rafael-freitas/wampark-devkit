import RouteSandbox from "./RouteSandbox"

import lodash from 'lodash'

export default class UIRoute extends RouteSandbox {

  viewport = null

  scope = null

  components = {}

  namespace = null
  namespaceId = null
  namespaceComponentId = null
  namespaceComponentName = 'scope'

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)
    this.namespaceId = String(this.namespace || this.uri).replace(/\W/ig, '_')
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

  async handleCreate (args, kwargs, details) {
    const requestParams = {args, kwargs, details}
    let response = null
    let error

    try {
      await this.beforeCreate(requestParams)
      response = await this.create(requestParams)
      // async call
      this.afterCreate({args, kwargs, details, response})
    } catch (err) {
      try {
        error = await this.catchErrors(err)
      } catch (err2) {
        error = this.ApplicationError.parse(err2)
      }
      return this.handleErrors(error)
    }
    
    return this.handleResponse(response)
  }

  async handleAfterCreate (requestParams = { args: [], kwargs: {}, details: {}}) {
    Primise.all([
      this.afterCreate({args, kwargs, details})
    ])
  }

  async handleResponse (response) {
    return response
  }

  handleErrors (error) {
    return Promise.reject(error)
  }

  catchErrors (err) {
    const error = this.ApplicationError.parse(err)
    this.log.error(error.toString())
    return Promise.reject(error)
  }

  async beforeCreate (requestParams = { args: [], kwargs: {}, details: {}}) {

  }

  async create (requestParams = { args: [], kwargs: {}, details: {}}) {
    // criar componentes
  }

  async afterCreate (requestParams = { args: [], kwargs: {}, details: {}, response: undefined}) {

  }

  async createNamespaceComponents (requestParams = { args: [], kwargs: {}, details: {}}) {
    return {
      // lista de componentes
    }
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
