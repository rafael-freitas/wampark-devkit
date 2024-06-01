import RouteSandbox from "./RouteSandbox.js"

export default class ModuleRoute extends RouteSandbox {

  namespace = null
  namespaceId = null

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)
    this.namespaceId = String(this.namespace || this.uri).replace(/\W/ig, '_')
    
    const self = this
    this.RouteError = class RouteError extends this.ApplicationError {
      constructor (...args) {
        super(...args)
        if (!this.uri) {
          this.uri = self.uri
        }
      }
    }
  }

  async endpoint (args, kwargs, details) {
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
    
  }

  async afterCreate (requestParams = { args: [], kwargs: {}, details: {}, response: undefined}) {

  }
}
