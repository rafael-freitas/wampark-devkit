/**
 * @author Rafael Freitas
 * @date Aug 4 2022
 */
 import mongoose from 'mongoose'

 import methods from './methods.js'
 import statics from './statics.js'
 import validations from './validations.js'
 import triggers from './triggers.js'
 import common from '../../common/index.js'

const COLLECTION_NAME = 'files'

const SCHEMA_OPTIONS = {
  collection: COLLECTION_NAME
}

const { ObjectId } = mongoose.Schema.Types

const modelSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  documentRef: {
    type: ObjectId,
    required: true
  }

}, SCHEMA_OPTIONS)

// virtuals(modelSchema)
validations(modelSchema)
methods(modelSchema)
statics(modelSchema)
triggers(modelSchema)

// common methods, statics...
common(modelSchema)

export default mongoose.model(COLLECTION_NAME, modelSchema)