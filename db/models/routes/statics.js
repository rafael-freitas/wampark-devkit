
import { v5 as _uuid } from 'uuid'
import md5 from 'md5'

const MODEL_ROUTES_ENDPOINT = process.env.MODEL_ROUTES_ENDPOINT

export default function (modelSchema) {
  Object.assign(modelSchema.statics, {
    
    generateIdByDocument (doc) {
      return doc[MODEL_ROUTES_ENDPOINT]
    },

    generateFileContent (route) {

      const now = new Date().toISOString()

      const DEFAULT_HEADER = 
      [
        '/**',
        ' * @file ',
        ' * @version 0.0.0',
        ' * @since 0.0.0',
        ' * @namespace ',
        ' * @author ',
        ` * @created ${now}`,
        ' */',
        '',
      ]
      .join('\n')

      let jsdoc = this.extractJSDOC(route.content)

      if (!jsdoc.version) {
        route.content = DEFAULT_HEADER + route.content
      }

      return route.content
    },

    generateHash (content) {
      if (!content) {
        content = Date.now()
      }
      return _uuid(md5(content), _uuid.URL)
    },

    extractJSDOC (content) {
      const file = {};
      const regexComments = /^\/\*\*([\s\S]*?)\*\//m;
      const regexTag = /@(\w+)\s+([^\n*]+)/g;
    
      const comment = regexComments.exec(content);
    
      if (comment) {
        let match;
        while ((match = regexTag.exec(comment[1])) !== null) {
          file[match[1]] = match[2].trim();
        }
      }
    
      return file;
    },

    parseFileContent (str) {
      let content = String(str)
      let file = this.extractJSDOC(content)

      file.hash = this.generateHash(content)
      file.content = content
    
      return file
    }
  })
}
