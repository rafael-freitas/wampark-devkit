
/**
* ******************************************************************************************************
*
*   Ticket Authentication Route
*
*     functions para ajudar a validaçao
*
*     > bcrypt.hashSync('admin', 10)
*     '$2a$10$YL428KaSI5l3tac/BDwcTuFMhrZmsCycepz0T5BQjRgjKg5tI0lsW'
*
*
*   @author     Rafael Freitas
*   @date       Feb 03 2018
*
*   @namespace Authentication
*
* ******************************************************************************************************
*/

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import lodash from 'lodash'
import app from 'wampark'
// model de usuarios
import system_users from '../db/models/system_users/index.js'

const { isEmpty } = lodash
const { Route, RouteTypes, ApplicationError } = app
const { JWT_SALT } = process.env
const USER_PASSWORD_FIELDNAME = process.env.MODEL_SYSTEM_USER__PASSOWRD
const USER_IDENTIFIER_FIELDNAME = process.env.USER_IDENTIFIER_FIELDNAME
const USER_EMAIL_FIELDNAME = process.env.USER_EMAIL_FIELDNAME


// assets
if (!JWT_SALT || typeof JWT_SALT !== 'string') throw new Error('A001: JWT_SALT is invalid or is undefined')


export default class ServiceTicketAuthentication extends Route {
  constructor () {
    super({
      type: RouteTypes.RPC,
      uri: 'services.authenticate.ticket',
      options: {}
    })
  }

  endpoint (args, kwargs, details) {
    return new Promise((resolve, reject) => {
      const [realm, authid, details] = args
      const { log } = this
      const ticket = JSON.parse(details.ticket)

      // Output - 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
      if (mongoose.connection.readyState !== 1) {
        log.error('Mongoose (database) not connected')
        return Promise.reject(new ApplicationError('F001: Database not connected'))
      }
      log.debug(`Begin authentication for user ${log.colors.data(authid)} on realm ${log.colors.data(realm)}`)

      try {
        if (ticket.token) {
          Promise
            .resolve({ authid, ticket })
            .then(this.verifyJwtToken.bind(this))
            .then(this.selectUser.bind(this))
            .then(this.createSession.bind(this))
            .then((value) => {
              log.info(`TOKEN session for ${log.colors.data(authid)} - ${log.ok}`)
              return value
            })
            .then(resolve)
            .catch(err => {
              log.error('Token authentication fail ' + err.toString())
              console.log(err.stack.toString())
              return Promise.reject(err)
            })
            .catch(reject)
        } else {
          Promise
            .resolve({ authid, ticket })
            .then(this.selectUser.bind(this))
            .then(this.comparePassword.bind(this))
            .then(this.createWebToken.bind(this))
            .then(this.createSession.bind(this))
            .then((value) => {
              log.info(`TICKET session for ${log.colors.data(authid)} - ${log.ok}`)
              return value
            })
            .then(resolve)
            .catch(err => {
              log.error('Credentials authentication failed', err.toString())
              console.log(err.stack.toString())
              return Promise.reject(err)
            })
            .catch(reject)
        }
      } catch (e) {
        log.error('Authentication fail', e.toString())
        console.log(e.stack.toString())
      }
    })
    // end Promise
  }

  /**
   * @method verifyJwtToken
   * @param {Object} credentials Objeto com os dados do formulário de login
   * @return {Object} Objeto com os dados do formulário de login
   */
  verifyJwtToken ({ authid, ticket }) {
    const decoded = jwt.verify(ticket.token, JWT_SALT)

    if (authid !== decoded.user) throw new ApplicationError('AUTHTD002: Token user is invalid')
    return { authid, ticket }
  }

  /**
   * @method selectUser
   * @param {Object} credentials Dados do usuário provido pelo formulário de login
   * @return {Promise}
   */
  selectUser ({ authid, ticket }) {
    return new Promise((resolve, reject) => {
      // const { system_users } = mongoose.models
      const { log } = this

      if (!authid) throw new ApplicationError('AUTHTD000: authid is required')
      log.info('Select user by authid', log.colors.green(authid))
      system_users.findByLogin(authid)
        .then(this.verifyIfUserExist.bind(this))
        .then(user => resolve({ user, authid, ticket }))
        .catch(reject)
    })
  }

  /**
   * @method verifyIfUserExist
   * @param {User} user Model do usuário
   * @return {User}
   */
  verifyIfUserExist (user) {
    if (isEmpty(user)) throw new ApplicationError('AUTHTD001: User not found')
    return user
  }

  /**
   * @method comparePassword
   * @param {Object} credentials Dados do usuário provido pelo formulário de login
   * @param {User} user Model de usuário
   * @return {Promise}
   */
  comparePassword ({ authid, ticket, user }) {
    const { log } = this

    return new Promise((resolve, reject) => {
      if ( isEmpty(user)) return reject(new ApplicationError('AUTHTA001: User or ticket is empty'))

      // extract the password from user model
      const userPassword = user[USER_PASSWORD_FIELDNAME]

      bcrypt
        .compare(ticket.password, userPassword)
        .then(isPasswordValid => isPasswordValid ? { authid, ticket, user } : Promise.reject(new ApplicationError('AUTHTA004: Invalid password')))
        .then(resolve)
        .catch(err => {
          if (err && err.code) {
            // Ocorreu um ApplicationError A004
            return Promise.reject(err)
          }
          log.warn(`Check password failed <${ticket.password}> for <${userPassword}>`)
          return Promise.reject(new ApplicationError('AUTHTA005: Check password failed', err))
        })
        .catch(reject)
    })
  }

  /**
   * @method createWebToken
   * @param {String} jwtSalt
   * @return {Function}
   */
  createWebToken ({ authid, ticket, user } = {}) {
    if (isEmpty(user) || isEmpty(ticket)) throw new ApplicationError('AUTHTD001: arg deve conter os objetos user e credentials')

    const token = jwt.sign({ user: user[USER_IDENTIFIER_FIELDNAME], email: useruser[USER_EMAIL_FIELDNAME] }, JWT_SALT)
    ticket.token = token
    return { user, authid, ticket }
  }

  /**
   * Enviar o ROLE (papel do usuario no WAMP)
   * Enviar o TOKEN (JWT)
   * Enviar os RULES (regras para modulos e rotas do angular)
   * @method createSession
   * @param {Object}
   * @property {Object} user Model do usuário
   * @property {Object} credentials Dados do login do usuário
   * @return {Object} Retorna a sessão do usuário
   */
  createSession ({ user, authid, ticket } = {}) {
    if (isEmpty(user) || isEmpty(ticket)) return {}

    return {
      role: user._doc.crossbarRole,
      extra: {
        token: ticket.token
      }
    }
  }
}
