import { v5 as _uuid } from 'uuid'

const MODEL_SYSTEM_DATA_NAME = process.env.MODEL_SYSTEM_DATA_NAME
const MODEL_SYSTEM_DATA_KEY = process.env.MODEL_SYSTEM_DATA_KEY

const uuid = function (str) {
  return _uuid(str, _uuid.URL)
}


export default function (ModelSchema) {
  // ModelSchema.pre('find', function () {
  //   this.populate('componenteForm')
  // })

  ModelSchema.pre('validate', function (next) {
    this._id = this.path
    this._uuid = uuid(this._id)
    next()
  })

  ModelSchema.pre('update', async function (next) {
    if (this._update[MODEL_SYSTEM_DATA_NAME]) {
      this._update._id = this.model.generateIdByDocument(this._update)
      this._update._uuid = uuid(this._update._id)
    }
    next()
  })

  // ModelSchema.pre('update', async function (next) {
  //   if (this._update.name) {
  //     this._id = this.path
  //     this.uuid = uuid(this._id)
  //     // this._update._id = this.model.createRegistroId(this._update)
  //     // this._update.uuid = uuid(this._update._id)
  //   }
  //   next()
  // })

  ModelSchema.pre('save', async function (next) {
    // se alterar o name criar uma nova chave
    if (!this.isNew && this.isModified(MODEL_SYSTEM_DATA_NAME)) {
      // remover registro antigo
      await this.remove({ _uuid: this._uuid })

      // let doc = new this.constructor({
      //   ...this._doc
      // })
      // await doc.save()

      const doc = { ...this._doc }
      delete doc.__v
      await this.constructor.update({ uuid }, doc, { upsert: true, runValidators: false, setDefaultsOnInsert: false })
      // throw new Error(`O _id do registro foi modificado.`)
      return next(false)
    }
    next()
  })
}
