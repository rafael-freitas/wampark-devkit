import loadsh from 'lodash'
import mongoose from 'mongoose'
import app from 'wampark'

const { isObject, isEmpty, cloneDeep } = loadsh

const DatabaseError = app.ApplicationError

const { ObjectId } = mongoose.Types

function parseMongoObjects (target) {
  // so aceitar objeto ou array
  if (!['object', 'array'].includes(typeof target)) {
    return target
  }
  for (const i in target) {
    if (Object.prototype.hasOwnProperty.call(target, i)) {
      const element = target[i]
      if (!element) {
        continue
      }
      if (i === '_id' && String(element).length === 24) {
        try {
          target[i] = ObjectId(element)
          continue
        } catch (error) {
          // o _id pode ser uma string e nao um ObjectId valido
        }
      }
      if (typeof element.$date === 'string') {
        target[i] = new Date(element.$date)
      } else if (typeof element.$objectid === 'string') {
        target[i] = ObjectId(element.$objectid)
      } else {
        parseMongoObjects(element)
      }
    }
  }
  return target
}

export default function (ModelSchema, ErrorModule = DatabaseError) {
  Object.assign(ModelSchema.statics, {

    parseMongoObjects,

    /**
     * 
     */
    unshiftDefaultPipelineMatch (pipeline) {
      if (Array.isArray(pipeline)) {
        pipeline.unshift({ $match: { _deleted: false } })
      }
    },

    /**
     * Retorna um registro populado
     * @param args
     */
    async selectOne (...args) {
      const [query = {}, fields, options = {}] = args
      const { _deleted = false } = query
      const { populate = '', isLean = true } = options

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      parseMongoObjects(query)

      return this.findOne(query, fields, options)
        // .where('_deleted')
        // .equals(_deleted)
        // .where('_currentVersion')
        // .equals(true)
        .populate(populate)
        .lean(isLean)
        .exec()
    },

    /**
     * Retorna um dataset com totalizador
     * @memberof Common.CommonModel
     * @method findBy
     * @async
     * @param {Object}
     * @property {Object} query Condição de busca
     * @property {Object|String} fields Campos que vão ser projetados
     * @property {Object} options Opções da busca
     * @property {Object|String} populate
     * @property {Boolean} isLean Se true irá retornar um objeto comum sem instancia do model, caso contrario irá
     *                            retornar um model | Default true
     * @return {Promise<Array>}
     */
    async findBy (...args) {
      const [query, fields, options = {}] = args
      const { populate = '', limit = 0, isLean = true, skip } = options
      let total = 0

      if (!options.sort) {
        options.sort = { createdAt: -1 }
      }

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      parseMongoObjects(query)

      const data = await this.find(query, fields, options)
        // .where('_deleted')
        // .equals(false)
        // .where('_currentVersion')
        // .equals(true)
        .populate(populate)
        .lean(isLean)
        .exec()

      // se tiver paginacao ativa
      if (limit > 0) {
        total = await this.countDocuments({ ...query })
      } else {
        total = data.length
      }

      return {
        total,
        limit,
        skip,
        data
      }
    },

    /**
     * se nenhuma pipeline de contagem for passada usar a padrao com a query* Retorna um pipeline padrao para contar o total de registros da consulta
     */
    getPipelineCount (pipeline = [], query) {
      if (!Array.isArray(pipeline) && typeof pipeline === 'object') {
        query = pipeline
        pipeline = []
      }

      const countPipeline = cloneDeep(pipeline)
      // se foi passado uma query adicionar como $match da pipeline de contagem
      if (typeof query === 'object') {
        countPipeline.push({ $match: query })
      }

      return countPipeline.concat([{ $project: { _id: 1 } }, { $count: 'total' }, { $unwind: '$total' }])
    },

    /**
     * 
     * @param args.query consulta
     * @param args.fields campos de retorno. default: todos
     * @param args.options skip, limit e sort
     * @param args.pipeline pipeline do Mongoose
     * @param args.countPipeline pipeline do Mongoose para totalizar a consulta
     * @returns {Object} resultset {data, total, limit, skip}
     */
    async findByAggregate (...args) {
      let [query = {}, fields, options = {}, pipeline = [], countPipeline] = args
      const { skip, limit, sort } = options
      let total = 0

      // adicionar ao final do pipeline a query
      pipeline.push({
        $match: query
      })

      // se nenhuma pipeline de contagem for passada usar a padrao com a query
      if (!countPipeline) {
        countPipeline = this.getPipelineCount(pipeline, query)
      }

      this.unshiftDefaultPipelineMatch(countPipeline)

      // adicionando o match _deleted:false
      this.unshiftDefaultPipelineMatch(pipeline)

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      parseMongoObjects(pipeline)
      parseMongoObjects(countPipeline)

      // se tiver paginacao ativa
      try {
        if (limit > 0) {
          const result = await this.aggregate(countPipeline)

          // so atualziar o total se retornar algum resutlado se nao total=0 ja declarado acima
          if (result.length > 0) {
            // extrair o primeiro resutlado com o contador
            const [countTotal = {}] = result
            // checar se o total foi retornado pelo aggregate
            if (typeof countTotal.total === 'undefined') {
              throw new DatabaseError('db.common.findByAggregate.E001: countPipeline must project prop "total"')
            }
            total = countTotal.total
          }
        }
      } catch (error) {
        throw new DatabaseError('db.common.findByAggregate.E002: aggregate execution fail', error)
      }

      try {
        if (sort) {
          pipeline.push({ $sort: sort })
        }

        if (skip) {
          pipeline.push({ $skip: skip })
        }

        if (!isEmpty(fields)) {
          pipeline.push({ $project: fields })
        }

        if (limit) {
          pipeline.push({ $limit: limit })
        }

        const data = await this.aggregate(pipeline).allowDiskUse(true)

        if (!limit) {
          total = data.length
        }

        return {
          total,
          limit,
          skip,
          data
        }
      } catch (error) {
        throw new DatabaseError('db.common.findByAggregate.E003: count aggregate execution fail', error)
      }
    },

    /**
     * Retorna todos os registros inclusive os excluidos
     * @memberof Common.CommonModel
     * @method findBy
     * @async
     * @param {Object}
     * @property {Object} query Condição de busca
     * @property {Object|String} fields Campos que vão ser projetados
     * @property {Object} options Opções da busca
     * @property {Object|String} populate
     * @property {Boolean} isLean Se true irá retornar um objeto comum sem instancia do model, caso contrario irá
     *                            retornar um model | Default true
     * @return {Promise<Array>}
     */
    async findAllBy (...args) {
      const [query, fields, options = {}] = args
      const { populate = '', limit = 0, isLean = true, skip } = options
      let total = 0

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      parseMongoObjects(query)

      const data = await this.find(query, fields, options)
        .populate(populate)
        .lean(isLean)
        .exec()

      // se tiver paginacao ativa
      if (limit > 0) {
        total = await this.countDocuments({ ...query, _deleted: false })
      } else {
        total = data.length
      }

      return {
        total,
        limit,
        skip,
        data
      }
    },

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
      DatabaseError.assert(isObject(query), 'db.common.findAndSave.A001: query is required')
      DatabaseError.assert(!isEmpty(query), 'db.common.findAndSave.A002: query is empty')
      
      // remover controle de versao do mongoose
      delete data.__v

      // Adicionar caso não exista o __id
      if (!data.__id) {
        data.__id = data._id
      }

      // converter $date: "2019-05-11T21:03:35.773Z" -> ISODate("2019-05-11T21:03:35.773Z")
      parseMongoObjects(query)

      const doc = await this.findOne(query)
        // .where('_deleted')
        // .equals(false)
        // // salvar sempre no rascunho
        // .where('published')
        // .equals(false)
        .exec()

      if (!doc) {
        throw new DatabaseError('db.common.findAndSave.E002: document not found to execute update')
      }
      // mesclar o documento recuperado do banco com os novos dados a serem atualizado
      Object.assign(doc, data)

      try {
        return doc.save()
      } catch (err) {
        throw DatabaseError.parse(err)
      }
    },

    /**
     * @description
     * Atualiza o registro status de ativo para falso
     * @memberof Common.CommonModel
     * @method logicalRemove
     * @async
     * @param {Array} query
     * @return {Promise<Object>}
     */
    logicalRemove (query = [], _deletedBy) {
      DatabaseError.assert(Array.isArray(query), 'db.common.logicalRemove.A001: must to be and array')
      DatabaseError.assert(!isEmpty(_deletedAt), 'db.common.logicalRemove.A002: _deletedAt is empty')

      if (typeof _deletedBy === 'object') {
        _deletedBy = _deletedBy._id
      }

      return this.updateMany({ _id: { $in: query }, _deleted: false }, { $set: { _deleted: true, _deletedBy: _deletedBy._id, _deletedAt: new Date() } })
    },

    /**
     * Wrapper do metodo find() nativo removendo registros excluidos
     * @return {Promise}
     */
    search (...args) {
      return this.find(...args)
        .where('_deleted')
        .equals(false)
        .where('_currentVersion')
        .equals(true)
        .lean()
    }
  })
}
