import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const { Schema } = mongoose

const MODEL_SYSTEM_USER_COLLECTION_NAME = process.env.MODEL_SYSTEM_USER_COLLECTION_NAME

const { ObjectId, Mixed } = Schema.Types

const baseSchema = {
  

}

/**
 *
 * @param Schema
 * @param types Array de campos passados por parametro ex: types(Schema, Campo1, Campo2...)
 */
export default function (Schema, ...types) {
  types.push(baseSchema)

  for (const type of types) {
    const schema = Object.assign({}, type, Schema.obj)
    Schema.add(schema)
  }

  return Schema
}
