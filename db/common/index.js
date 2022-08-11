import triggers from './triggers.js'
import methods from './methods.js'
import statics from './statics.js'
import types from './types.js'

/**
 * @author Thiago Nogueira
 * @version 1.0
 * @date Fev 11 2018
 * @memberof Common
 * @mixin CommonModel
 */
export default function (ModelSchema, ErrorModule) {
  methods(ModelSchema, ErrorModule)
  triggers(ModelSchema, ErrorModule)
  statics(ModelSchema, ErrorModule)

  return types(ModelSchema)
}
