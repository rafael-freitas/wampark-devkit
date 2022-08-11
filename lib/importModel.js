import path from 'path'

export default async function importModel (modelName) {
  const { default: model } = await import(path.resolve(path.join('./src/store/models/', modelName, 'index.js')))
  return model
}