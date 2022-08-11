export default function (ModelSchema, ErrorModule) {
  Object.assign(ModelSchema.methods, {
    /**
     * Adicionar o usuario de criação e atualização
     */
    setUsuario (usuario) {
      let id = usuario._id

      if (typeof usuario === 'string') {
        id = usuario
      }

      this.criadoPor = id
      this.atualizadoPor = id
    },

    async publicar () {
      if (this.publicado === false) {
        this.publicado = true
        this.publicadoEm = Date.now()
        const rascunho = await this.incrementarVersao({
          publicadoEm: null,
          publicado: false
        })
        return rascunho
      }
      return false
    },

    async despublicar () {
      if (this.publicado === true) {
        this.publicado = false
        this.publicadoEm = null
        const rascunho = await this.incrementarVersao({
          publicadoEm: this.publicadoEm,
          publicado: true
        })
        return rascunho
      }
      return false
    },


    /**
     *
     * @param props campos a serem sobrescritos
     */
    async incrementarVersao (props = {}) {
      if (!this._versao) {
        this._versao = 0
      }

      // se for o primeiro registro guardar o _id na versao para manter historico
      if (!this.__id) {
        this.__id = this._id
      }

      const rascunho = this.clonar(props)

      // incrementar versao do rascunho
      ++rascunho._versao

      // remover flag de versaoAtual de todos os documentos
      const result = await this.constructor.update({ __id: this.__id }, { $set: { _currentVersion: false } }, { multi: true })
      console.log('result update', result)

      this._currentVersion = true

      // salvar o rascunho e lincar o documento publicado com o novo rascunho
      await rascunho.save()
      this._versaoRef = rascunho._id
      return this.save()
    },

    /**
     *
     * @param overwriteProps propriedades para serem sobrescritas
     */
    clonar (overwriteProps = {}) {
      const doc = Object.assign({
        ...this._doc
      }, overwriteProps)

      doc._id = null
      delete doc._id
      delete doc.__v
      delete doc.index

      doc.publicado = false
      return new this.constructor(doc)
    }
  })
}
