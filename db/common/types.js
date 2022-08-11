import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'

const { Schema } = mongoose

const MODEL_SYSTEM_USER_COLLECTION_NAME = process.env.MODEL_SYSTEM_USER_COLLECTION_NAME

const { ObjectId, Mixed } = Schema.Types

const baseSchema = {
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
   * @memberof Common.Types
   * @instance
   * @type {ObjectId}
   */
  _deletedBy: {
    type: ObjectId,
    ref: MODEL_SYSTEM_USER_COLLECTION_NAME
  },

  /**
   * Propriedade informa qual usuário fez a remoção lógica.
   * @memberof Common.Types
   * @instance
   * @type {ObjectId}
   */
  _deletedAt: {
    type: Date
  },

  /**
   * Propriedade define se o documento está ativo.
   * @memberof Common.Types
   * @instance
   * @type {Boolean}
   * @default true
   */
  active: {
    type: Boolean,
    default: true
  },

  /**
   * Propriedade informa qual usuário que criou o registro
   * @memberof Common.Types
   * @instance
   * @type {ObjectId}
   */
  createdBy: {
    type: ObjectId,
    ref: MODEL_SYSTEM_USER_COLLECTION_NAME
  },

  /**
   * Propriedade armazena a data que o documento foi criado
   * @memberof Common.Types
   * @instance
   * @type {Date}
   * @default Date.now() timestamp com a data atual em milisegundos
   */
   createdAt: {
    type: Date,
    default: Date.now
  },

  /**
   * Guarda que usuário atualizou o registro
   * @memberof Common.Types
   * @instance
   * @type {ObjectId}
   */
  updatedBy: {
    type: ObjectId,
    ref: MODEL_SYSTEM_USER_COLLECTION_NAME
  },

  /**
   * Propriedade armazena a data que da última alteração do documento
   * @memberof Common.Types
   * @instance
   * @type {Date}
   * @default Date.now() timestamp com a data atual em milisegundos
   */
   updatedAt: {
    type: Date,
    default: Date.now
  },

  /**
   * Flag para indicar se o registro é publicado ou rascunho
   * true => publicado
   * false => rascunho
   * @instance
   * @type {Boolean}
   * @default false
   */
  published: {
    type: Boolean,
    default: false
  },

  /**
   * Data em que o registro foi published
   * @instance
   * @type {Date}
   */
  publishedAt: {
    type: Date
  },

  /**
   * Guarda que usuário publicou o registro
   * @memberof Common.Types
   * @instance
   * @type {ObjectId}
   */
  publishedBy: {
    type: ObjectId,
    ref: MODEL_SYSTEM_USER_COLLECTION_NAME
  },

  _uuid: {
    type: String,
    default () {
      return uuidv4()
    }
  },

  /**
   * Flag para indicar que este documento é a ultima versao publicada
   * @type {Boolean}
   */
   _currentVersion: {
    type: Boolean,
    default: true
  },

  /**
   * Aponta para versão de rascunho atual
   * @type {ObjectId}
   */
  _versionRef: {
    type: ObjectId
  },

  /**
   * aponta para o documento inicial de controle de versao
   * o primeiro documento publicado
   * @type {ObjectId}
   */
  __id: {
    type: ObjectId
  },

  /**
   * Dados customizados do registro
   * @type {Mixed}
   */
  props: {
    type: Mixed
  },

  /**
   * Versão do registro
   * @type {Number}
   * @default 1
   */
  _versao: {
    type: Number,
    default: 1
  },

  /**
   * Codigo para identificar as operações de banco de dados para possibilitar um rollback
   * O codigo pode guardar o registro que originou este registro
   * Nota: este campo foi criado vendo a necessidade de construir uma solução de rollback
   * para transações de movimentação de estoque
   * @type {Mixed}
   */
  _regref: {
    type: Mixed
  }
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
