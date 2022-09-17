'use strict'
import _ from 'lodash'
import { v5 as _uuid } from 'uuid'

export default function (ModelSchema) {

  Object.assign(ModelSchema.methods, {
    getFileContent () {
      return this.constructor.generateFileContent(this)
    },

    getHash () {
      return this.constructor.generateHash(this.header, this.content)
    },
  })
}
