
const MODEL_SYSTEM_DATA_NAME = process.env.MODEL_SYSTEM_DATA_NAME
const MODEL_SYSTEM_DATA_KEY = process.env.MODEL_SYSTEM_DATA_KEY

export default function (modelSchema) {
  Object.assign(modelSchema, {
    generateIdByDocument (doc) {
      // é root
      if (!doc[MODEL_SYSTEM_DATA_KEY]) {
        return doc[MODEL_SYSTEM_DATA_NAME]
      }
      return [doc[MODEL_SYSTEM_DATA_KEY], doc[MODEL_SYSTEM_DATA_NAME]].join('/')
    },
  })
}
