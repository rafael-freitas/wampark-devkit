import loadsh from 'lodash'

const { isObject, isEmpty, cloneDeep } = loadsh

export default function (modelSchema) {

  Object.assign(modelSchema.statics, {
    /**
     * @description
     * Atualiza os dados de um documento, ativando os hooks de save.
     * Seleciona um registro na collection através de findOne() filtrando por `_deleted:true` e `published:false`
     * e atualiza o registro selecionado através do método save() do Mongoose
     * @author Rafael Freitas
     * @updateAt 16 Jul 2020
     * @memberof Common.CommonModel
     * @method findAndSave
     * @async
     * @param {Object} query
     * @param {Object} data
     * @property {Object|String} populate
     * @return {Promise<Object>} Retorna o documento selecionado
     */
    async findAndSave (query, data = {}) {
      if (!isObject(query) || isEmpty(query)) {
        return Promise.reject(new ErrorModule('CMM-B002: Objeto de query é inválido'))
      }

      // remover controle de versao do mongoose
      delete data.__v
      delete data.password

      // Adicionar caso não exista o __id
      if (!data.__id) {
        data.__id = data._id
      }

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      this.parseDateToISODate(query)

      const doc = await this.findOne(query)
        .where('_deleted')
        .equals(false)
        .exec()

      if (!doc) return Promise.reject(new ErrorModule('CMM-B003: Documento não encontrado ou não há versao de rascunho'))
      // mesclar o documento recuperado do banco com os novos dados a serem atualizado
      Object.assign(doc, data)

      return doc.save()
    },
    async changePassword (query, data = {}) {
      if (!isObject(query) || isEmpty(query)) {
        return Promise.reject(new ErrorModule('CMM-B002: Objeto de query é inválido'))
      }

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      this.parseDateToISODate(query)

      const doc = await this.findOne(query)
        .where('_deleted')
        .equals(false)
        .exec()

      if (!doc) return Promise.reject(new ErrorModule('CMM-B003: Documento não encontrado ou não há versao de rascunho'))
      // mesclar o documento recuperado do banco com os novos dados a serem atualizado
      doc.password = doc.encryptPassword(data.password)

      return doc.save()
    }
  })

  
  /**
   * Retorna um usuario por LOGIN, EMAIL ou CODIGO DE ACESSO
   * Você também pode retornar o usuário com os dados de Grupo de Permissões (grupoPermissoes)
   * e a empresa de contexto selecionada (contextos.empresa)
   * @param {String} login Login do usuario. ex: admin
   * @param {Boolean} returnAllUserData Se TRUE retorna os dados do usuario com seus grupos de permissoes e dados da empresa de contexto. Default FALSE
   */
  modelSchema.statics.findByLogin = async function (login) {
    if (typeof login !== 'string') {
      throw new Error(`A00:${login} must to be a string`)
    }

    // selecionar usuario por login ou email
    const query = [{ [process.env.MODEL_SYSTEM_USER__IDENTIFIER]: login }, { [process.env.MODEL_SYSTEM_USER__EMAIL]: login }]
    // converter o login em numero para tentar localizar o usuario por codigo de acesso tambem
    const code = Number(login)

    // checar se o login é um code de acesso valido, se for adicionar à condição OU de seleção de usuario
    if (!isNaN(code)) {
      query.push({ [process.env.MODEL_SYSTEM_USER__CODE]: code })
    }

    const cursor = this.findOne({ $or: query })

    // // se returnAllUserData TRUE popular o registro com Grupo de Permissões e a empresa de contexto
    // if (returnAllUserData === true) {
    //   cursor
    //     .select('-password')
    // }
    // cursor.lean(true)

    return cursor.exec()
  }
}
