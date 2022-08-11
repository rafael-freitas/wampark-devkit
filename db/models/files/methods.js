import { createReadStream } from 'fs'
import { createReadStreamFromBuffer } from '../../../lib/streaming.js'
import { Attachment } from './gridfs.js'

export default function (ModelSchema) {
  /**
   * @method attachFile
   * @return {Promise}
   */
  ModelSchema.methods.attachFile = function ({ name = 'unknownfile', type = '', path, readstream, buffer }) {
    if (buffer) {
      readstream = createReadStreamFromBuffer(buffer)
    } else if (!readstream) {
      readstream = createReadStream(path)
    }

    return new Promise((resolve, reject) => {
      Attachment.writeFile({
        filename: name,
        contentType: type,
        metadata: {
          // guardar referencia do model vinculado ao imagemRef
          ref: this._id
        }
      },
      readstream,
      (err, createdFile) => {
        if (err) {
          return reject(err)
        }
        this.documentRef = createdFile._id

        // salvar automaticamente para garantir os vinculos do imagemRef e do documento
        this.save().then(r => resolve(createdFile))
      })
    })
  }

  ModelSchema.methods.read = function () {
    return Attachment.readFile({ _id: this.documentRef })
  }

  /**
   * readFile - recupera do gridfs um stream
   * @returns {Promise<Stream>} Retorna um objeto Stream
   */
  ModelSchema.methods.readFile = function () {
    return new Promise((resolve, reject) => {
      Attachment.readFile({ _id: this.documentRef }, (error, unlinkedAttachment) => {
        if (error) {
          return reject(error)
        }

        resolve(unlinkedAttachment)
      })
    })
  }

  ModelSchema.methods.deleteFile = function () {
    return new Promise((resolve, reject) => {
      Attachment.deleteFile(this.documentRef, (error, unlinkedAttachment) => {
        if (error) {
          return reject(error)
        }

        resolve(unlinkedAttachment)
      })
    })
  }
}
