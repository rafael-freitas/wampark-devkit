export default function (ModelSchema) {
  ModelSchema
    .virtual('path')
    .get(function () {
      return ModelSchema.statics.generateIdByDocument(this)
    })
}