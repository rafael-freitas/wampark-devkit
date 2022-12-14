import { v5 as _uuid } from 'uuid'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

const uuid = function (str) {
  if (!str) {
    throw new Error('uuid str is required')
  }
  return _uuid(str, _uuid.URL)
}


export default function (ModelSchema) {
  ModelSchema.pre('validate', function (next) {
    this._id = this[MODEL_ROUTES_ENDPOINT]
    this.__id = this._id
    this.hash = this.getHash()
    next()
  })

  ModelSchema.pre('update', async function (next) {
    if (this._update[MODEL_ROUTES_ENDPOINT]) {
      // this._update._uuid = uuid(this._update[MODEL_ROUTES_ENDPOINT])
      // this._update.hash = uuid(this._update.content)
    }
    next()
  })

  ModelSchema.pre('save', async function (next) {
    // se alterar o name criar uma nova chave
    if (!this.isNew && this.isModified(MODEL_ROUTES_ENDPOINT)) {
      // remove old record
      await this.constructor.deleteOne({ _id: this.__id })

      const doc = { ...this._doc }
      delete doc.__v
      // doc.hash = uuid(doc.content + this._uuid)
      await this.constructor.update({ _id: this._id }, doc, { upsert: true, runValidators: false, setDefaultsOnInsert: false })
      // throw new Error(`O _id do registro foi modificado.`)
      return next(false)
    }
    next()
  })
}
