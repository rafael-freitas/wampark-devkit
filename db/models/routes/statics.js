
import _ from 'lodash'
import { v5 as _uuid } from 'uuid'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default function (modelSchema) {
  Object.assign(modelSchema.statics, {
    
    generateIdByDocument (doc) {
      return doc[MODEL_ROUTES_ENDPOINT]
    },

    generateFileContent (route) {
      const filePrefix = '___content'
      // wrapper para method async na classe atual
      let params = ['kwargs']
      
      // removendo parametros duplicados
      params = _.union(params)

      // wraper da funcao
      // assinatura: function content(kwargs, extraParams[])
      return `${route.header}\nexport default async function ${filePrefix} ({${params.join(', ')}}) {\n${route.content}\n}`
    },

    generateHash (header, content) {
      if (!content) {
        header = Date.now()
        content = Date.now()
      }
      return _uuid(header + content, _uuid.URL)
    },

    parseFileContent(str) {
      const regex = /^(.*?)(\nexport default async function ___content \(\{kwargs\}\) {\n)(.*?)\n}$/gs
      const parts = regex.exec(str)

      if (!parts) {
        return {
          hash: null,
          header: null,
          content: null,
        }
      }

      const header = parts[1]
      const content = parts[3]

      // let header = parts[1].replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1').replace(/\n(.*?)\n\n$/, '$1')

      const hash = this.generateHash(header, content)
      return {
        hash,
        header,
        content
      }

    }
  })
}
