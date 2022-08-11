export default function (ModelSchema) {
  ModelSchema
    .virtual('path')
    .get(function () {
      return ModelSchema.generateIdByDocument(this)
    })
}