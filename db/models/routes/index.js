/**
 * @author Rafael Freitas
 * @date May 13 2021
 */
import mongoose from 'mongoose'

import methods from './methods.js'
import statics from './statics.js'
import validations from './validations.js'
import triggers from './triggers.js'
import virtuals from './virtuals.js'
import common from '../../common/index.js'

const { Mixed } = mongoose.Schema.Types

const COLLECTION_NAME = process.env.MODEL_ROUTES_COLLECTION_NAME
const FIELD_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT
const FIELD_CONTENT = process.env.MODEL_ROUTES_CONTENT

const SCHEMA_OPTIONS = {
  collection: COLLECTION_NAME,
  toObject: { virtuals: true }, toJSON: { virtuals: true }
}

const modelSchema = new mongoose.Schema({

  /**
   * Composto por todos os nodes pai + nome da chave
   */
  _id: {
    type: String,
    required: true
  },

  /**
   * aponta para o documento inicial de controle de versao
   * o primeiro documento publicado
   * @type {ObjectId}
   */
   __id: {
    type: String
  },

  hash: {
    type: String,
    required: true
  },

  /**
   * Nome da chave
   */
  [FIELD_ENDPOINT]: {
    type: String,
    required: true
  },

  /**
   * Especificação do processo
   * Códigos e statements
   */
   [FIELD_CONTENT]: {
    type: Mixed
  },
  /**
   * Header do arquivo
   * Use para imports
   */
   header: {
    type: String
  },

  /**
   * Documentação em MARKDOWN
   * @type {String}
   */
   documentation: {
    type: String
  }

}, SCHEMA_OPTIONS)


virtuals(modelSchema)
validations(modelSchema)
methods(modelSchema)
statics(modelSchema)
triggers(modelSchema)

// common methods, statics...
common(modelSchema)

export default mongoose.model(COLLECTION_NAME, modelSchema)