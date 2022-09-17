import app from 'wampark'
import Routes from '../db/models/routes/index.js'
import createMongoFieldSearchQuery from '../lib/db/createMongoFieldSearchQuery.js'

export default class UiComponent extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: 'ui.routes.dialogs.delete.requestDataset'
    })
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    const { $componentId } = kwargs

    // componentes
    const table = this.component('tbRoutesDelete')
    const dialog = this.component('dialogBulkDelete')

    const keyword = await dialog.getStateValueOf('filterQuery')

    const { pageSize, currentPage, sort } = await table.getRequestProps()

    let skip = (currentPage - 1) * pageSize

    let query = {
      $or: []
    }

    // if has keyword
    if (keyword) {
      query.$or.push({$and: createMongoFieldSearchQuery('_id', keyword)})
    } else {
      query.$or.push({_id: {$exists:true}})
    }

    const queryObject = {
      query,
      fields: '_id hash',
      options: {
        limit: pageSize,
        skip,
        sort
      }
    }
    // obter resultado da consulta no banco
    const dataset = await Routes.findBy(queryObject.query, queryObject.fields, queryObject.options)

    // atualizar tabela
    table.updateDataset(dataset)
  }
}

