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
   * 
   */
  _id: {
    type: String,
    required: true
  },

  /**
   * UUID
   */
  hash: {
    type: String,
    required: true
  },

  /**
   * SEMVER version - jsdoc tag: version
   */
  version: {
    type: String,
    required: true,
    default: '0.0.0'
  },
  
  /**
   * SEMVER since - jsdoc tag: since
   */
  since: {
    type: String,
    required: true,
    default: '0.0.0'
  },

  /**
   * jsdoc tag: file
   */
  description: {
    type: String,
    default: ''
  },

  /**
   * jsdoc tag: author
   */
  author: {
    type: String,
    default: ''
  },

  /**
   * jsdoc tag: namespace
   */
  namespace: {
    type: String,
    default: ''
  },

  /**
   * Endpoint name
   */
  endpoint: {
    type: String,
    required: true
  },

  /**
   * file content
   * export default function content
   */
  content: {
    type: String
  },
  
  /**
   * file header
   */
   header: {
    type: String
  },

  /**
   * midlewares list
   */
  midlewares: {
    type: Array,
    default: () => []
  },

  /**
   * MARKDOWN
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