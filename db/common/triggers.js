
export default function (ModelSchema, ErrorModule) {
  ModelSchema.pre('save', function (next) {
    this.atualizadoEm = new Date()

    // if (!this._uuid) {
    //   this._uuid = uuid()
    // }

    // se for o primeiro registro guardar o _id na versao para manter historico
    // if (!this.__id) {
    //   this.__id = this._id
    // }

    // if (this.publicado === true) {
    //   return next(new ErrorModule('TRG001: Não é possivel editar um registro publicado'))
    // }

    const erro = this.validateSync()

    if (!erro) next()

    next(new ErrorModule('TRG002: Ocorreu um erro de validação', erro))
  })

  // ModelSchema.post('save', function (next) {

  //   // se for o primeiro registro guardar o _id na versao para manter historico
  //   if (!this._versaoRef) {
  //     this._versaoRef = this._id
  //   }

  //   next()
  // })
}
