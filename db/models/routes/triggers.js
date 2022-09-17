import { v5 as _uuid } from 'uuid'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

const uuid = function (str) {
  if (!str) {
    throw new Error('uuid str is required')
  }
  return _uuid(str, _uuid.URL)
}


export default function (ModelSchema) {
  // ModelSchema.pre('find', function () {
  //   this.populate('componenteForm')
  // })

  ModelSchema.pre('validate', function (next) {
    this._id = this.path
    this.___uuid = this._uuid
    // gerar um uuid unico na primeira vez q salvar pra identificar o registro
    if (!this._uuid) {
      this._uuid = uuid(this._id + Date.now())
    }
    if (!this.header) {
      this.header = ''
    }
    this.hash = this.getHash()
    next()
  })

  ModelSchema.pre('update', async function (next) {
    if (this._update[MODEL_ROUTES_ENDPOINT]) {
      this._update._uuid = uuid(this._update._id)
      // this._update.hash = uuid(this._update.content)
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
    if (!this.isNew && this.isModified(MODEL_ROUTES_ENDPOINT)) {
      // remover registro antigo
      await this.constructor.remove({ _uuid: this.___uuid })

      // let doc = new this.constructor({
      //   ...this._doc
      // })
      // await doc.save()

      const doc = { ...this._doc }
      delete doc.__v
      // doc.hash = uuid(doc.content + this._uuid)
      await this.constructor.update({ _uuid: this._uuid }, doc, { upsert: true, runValidators: false, setDefaultsOnInsert: false })
      // throw new Error(`O _id do registro foi modificado.`)
      return next(false)
    }
    next()
  })
}
