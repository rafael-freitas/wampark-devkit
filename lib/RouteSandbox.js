import app from 'wampark'
import lodash from 'lodash'
import jwt from 'jsonwebtoken'

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'
const { JWT_SALT } = process.env

// verificar se o JWT_SALT foi inicializado no .env ou variavel de ambiente
if (!JWT_SALT || typeof JWT_SALT !== 'string') throw new Error('A001: JWT_SALT is invalid or is undefined')

export default class RouteSandbox extends app.Route {
  static createSandbox (fromRoute, details, protocol) {
    let sandbox = RouteSandbox.extend(fromRoute)
    return sandbox
  }

  constructor (properties = { uri: 'sandbox' }) {
    super(properties)

    const self = this
    this.ApplicationError = class ApplicationError extends app.ApplicationError {
      constructor (...args) {
        super(...args)
        if (!this.uri) {
          this.uri = self.uri
        }
      }
    }
  }

  beforeSetup (args = [], kwargs = {}, details = {}) {
    let [protocol = {}, ..._args] = args
    this.details = details

    if (typeof protocol !== 'object') {
      protocol = {
        protocolValue: protocol
      }
    }
    
    if (protocol.targetSession) {
      this.details = Object.assign({}, details, {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
      })
    } else {
      Object.assign(protocol || {}, {
        fromUser: details.caller_authid,
        fromSession: details.caller,
        targetUser: details.caller_authid,
        targetSession: details.caller,
      })
    }
    this.protocol = protocol
    // this.protocol.args = JSON.parse(JSON.stringify(args))
    this.protocol.args = _args
  }

  isRequestServerSession () {
    return this.protocol.fromSession === this.session.id
  }

  isHttpRequest () {
    return !!this.protocol.http
  }

  /**
   * Premitir executar esta rota via http?
   * @default true
   * @returns {Boolean}
   */
  allowHttpRequest () {
    return true
  }

  /**
   * Indica que a rota requer autenticação para acessar o endpoint
   * @returns {Boolean}
   */
  requiresAuthentication () {
    return false
  }

  autorizeUser(authid) {

  }

  /**
   * Se a rota requer autenticação de usuário (e não é uma sessao do backend) verifica se o usuario tem acesso
   * @default true Por padrão o acesso é garantido para qualquer usuário exceto o usuário do backend
   * @returns {Boolean}
   */
  async checkAuthorization () {
    if (this.isRequestServerSession()) {
      let token = this.getAuthorizationToken()
      if (token && this.isHttpRequest()) {
        try {
          let realm = this.session.realm
          // const decoded = jwt.verify(token, JWT_SALT)
          // let {realm, authid} = decoded

          // if (!realm) {
          //   realm = this.session.realm
          // }
          // chamar o servico de autenticaçao para validar o token
          let response = await this.session.call('services.authenticate.ticket', [
            realm,
            // authid = será extraido do token
            null,
            {
              ticket: {
                token
              }
            }
          ])
          if (!response) {
            throw new this.ApplicationError(`403: Forbidden`)
          }
          return true
        } catch (err) {
          const error = this.ApplicationError.parse(err)
          throw new this.ApplicationError(`500: Token verify fail ${error.toString()}`)
        }
      }
      throw new this.ApplicationError(`401: Unauthorized to access this route`)
    }
    return true
  }

  getAuthorizationToken () {
    let token = lodash.get(this.protocol, 'request.header.authorization')
    if (token) {
      // authorization: Bearer TOKEN
      token = String(token).split(' ')[1]
    }
    // if (!token) {
    //   token = lodash.get(this.protocol, 'request.header.x-api-key')
    // }
    return token
  }

  // o metodo endpoint com os parametros default args, kwargs e details; vai checar se existe um metodo default que veio do arquivo importado
  endpoint (args, kwargs, details) {
    // checar se existe o metodo default() e chamar passando args
    if (this.default) {
      return this.default({ args, kwargs, details })
    }
  }


  /**
   * Chamada RPC para uma rota dinamica
   * Este metodo adiciona o prefix da rota de execução no endpoint
   * @param  {String} name rota: `route.store.appAcoes.list
   * @param  {Mixed} payload
   * @param  {Oject} options opções de chamada do RPC via crossbar
   * @param  {Oject} routeProtocol especificar um RouteProtocol default: null
   * @return {Promise}
   */
  route (name, payload, options = {}) {
    return this.call(`${ROUTES_PREFIX}.${name}`, payload, options)
  }
}
