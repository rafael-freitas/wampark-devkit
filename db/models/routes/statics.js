
const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default function (modelSchema) {
  Object.assign(modelSchema, {
    generateIdByDocument (doc) {
      return doc[MODEL_ROUTES_ENDPOINT]
    },
  })
}
