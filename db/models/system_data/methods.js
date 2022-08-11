'use strict'

export default function (ModelSchema) {

  Object.assign(ModelSchema.methods, {
    getId () {
      return ModelSchema.generateIdByDocument(this)
    }
  })
}
