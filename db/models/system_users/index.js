/**
 * @author Rafael Freitas
 * @date May 09 2021
 */
import mongoose from 'mongoose'

import methods from './methods.js'
import statics from './statics.js'
import validations from './validations.js'
import triggers from './triggers.js'
import virtuals from './virtuals.js'
import common from '../../common/index.js'

const { Mixed, ObjectId } = mongoose.Schema.Types

const COLLECTION_NAME = process.env.MODEL_SYSTEM_USER_COLLECTION_NAME

const SCHEMA_OPTIONS = {
  collection: COLLECTION_NAME,
  toObject: { virtuals: true }, toJSON: { virtuals: true }
}

const systemUserModel = Object.assign({

  /**
   * A unique code to identifier an account
   */
  // accountId: {
  //   type: String,
  //   unique: true,
  //   required: true,
  //   index: true
  // },

  /**
   * Login identifier
   * @type {String}
   */
   [process.env.MODEL_SYSTEM_USER__NAME]: {
    type: String,
    index: true
  },
  /**
   * Login identifier
   * @type {String}
   */
   [process.env.MODEL_SYSTEM_USER__IDENTIFIER]: {
    type: String,
    unique: true,
    required: true,
    index: true,
    minlength: 3,
    maxlength: 24,
  },

  /**
   * User code can be used as identifier
   * @type {Number
   */
   [process.env.MODEL_SYSTEM_USER__CODE]: {
    unique: true,
    type: Number
  },

  /**
   * Encrypeted password
   * @type {String}
   */
   [process.env.MODEL_SYSTEM_USER__PASSOWRD]: {
    type: String,
    minlength: 3,
    maxlength: 64
  },

  /**
   * Email
   * @type {String}
   */
   [process.env.MODEL_SYSTEM_USER__EMAIL]: {
    type: String
  },

  /**
   * Crossbar role
   * @type {String}
   * @default 'frontend' acesso as rotas com prefixo 'web'
   */
  crossbarRole: {
    type: String,
    default: 'frontend'
  },

  /**
   * Propriedade define se o documento está ativo.
   * @type {Boolean}
   * @default true
   */
   [process.env.MODEL_SYSTEM_USER__ACTIVE]: {
    type: Boolean,
    default: true
  },

  /**
   * Propriedade informa qual usuário que criou o registro
   * @type {ObjectId}
   */
   [process.env.MODEL_SYSTEM_USER__CREATEDBY]: {
    type: ObjectId,
    ref: COLLECTION_NAME
  },

  /**
   * Propriedade armazena a data que o documento foi criado
   * @type {Date}
   * @default Date.now() timestamp com a data atual em milisegundos
   */
   [process.env.MODEL_SYSTEM_USER__CREATEDAT]: {
    type: Date,
    default: Date.now
  },

  /**
   * Guarda que usuário atualizou o registro
   * @type {ObjectId}
   */
   [process.env.MODEL_SYSTEM_USER__UPDATEBY]: {
    type: ObjectId,
    ref: COLLECTION_NAME
  },

  /**
   * Propriedade armazena a data que da última alteração do documento
   * @type {Date}
   * @default Date.now() timestamp com a data atual em milisegundos
   */
   [process.env.MODEL_SYSTEM_USER__UPDATEAT]: {
    type: Date,
    default: Date.now
  },
  /**
   * Propriedade define se o documento está excluido.
   * @type {Boolean}
   * @default false
   */
   _deleted: {
    type: Boolean,
    default: false
  },

  /**
   * Propriedade informa qual usuário fez a remoção lógica.
   * @type {ObjectId}
   */
   [process.env.MODEL_SYSTEM_USER__DELETEDBY]: {
    type: ObjectId,
    ref: COLLECTION_NAME
  },

  /**
   * Propriedade informa qual usuário fez a remoção lógica.
   * @type {ObjectId}
   */
  _deletedAt: {
    type: Date
  },
})

const modelSchema = new mongoose.Schema(systemUserModel, SCHEMA_OPTIONS)

common(modelSchema)
virtuals(modelSchema)
validations(modelSchema)
methods(modelSchema)
statics(modelSchema)
triggers(modelSchema)

export default mongoose.model(COLLECTION_NAME, modelSchema)