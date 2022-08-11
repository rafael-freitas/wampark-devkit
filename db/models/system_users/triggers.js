// import validators from '../../../lib/validators'

const FIELD_PASSOWRD = process.env.MODEL_SYSTEM_USER__PASSOWRD

export default function (ModelSchema) {

  ModelSchema.pre('findOneAndUpdate', function (next) {
    if (this._update[FIELD_PASSOWRD] === '') {
      delete this._update[FIELD_PASSOWRD]
      return next()
    }

    this._update[FIELD_PASSOWRD] = this._update.encryptPassword(this._update[FIELD_PASSOWRD])
    next()
  })

  ModelSchema.pre('save', function (next) {
    if (this[FIELD_PASSOWRD] === '') {
      delete this[FIELD_PASSOWRD]
      return next()
    }

    this[FIELD_PASSOWRD] = this.encryptPassword(this[FIELD_PASSOWRD])
    next()
  })
}
