'use strict'

import bcrypt from 'bcrypt'

export default function (ModelSchema) {
  const PASSWORD_SALT = 10

  Object.assign(ModelSchema.methods, {
    nextCountAsync () {
      return new Promise((resolve, reject) => {
        this.nextCount(async (erro, count) => {
          if (erro) reject(erro)

          resolve(count)
        })
      })
    },


    // ========================================================
    //              METODOS DO USUÁRIO
    // ========================================================

    // generating a hash
    encryptPassword (password) {
      return bcrypt.hashSync(password || this.password, bcrypt.genSaltSync(PASSWORD_SALT), null)
    },

    // checking if password is valid
    validatePassword (password) {
      return bcrypt.compareSync(password, this.password)
    },

    /**
     * Gera a password criptografada
     * @memberof Perfis.UsuariosModel
     * @method gerarpasswordAsync
     * @instance
     * @return {Promise<String>}
     */
    generatePasswordAsync () {
      if (!this.password) return null

      return bcrypt.hash(this.password, PASSWORD_SALT)
    },

    /**
     * @memberof Perfis.UsuariosModel
     * @method compararpasswordAsync
     * @param {String} password
     * @instance
     * @return {Promise<Boolean>}
     */
     validatePasswordAsync (password) {
      return bcrypt.compare(password, this.password)
    }

  })
}
