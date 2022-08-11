
import app from 'wampark'
import Routes from '../../../db/models/routes/index.js'
import WebRoute from '../../../lib/WebRoute.js'

export default class ApiDownloadFileWebRoute extends WebRoute {
  constructor () {
    super({
      type: app.RouteTypes.GET,
      uri: '/api/routes/download',
    })
  }

  async endpoint (ctx, next) {
    try {
      app.ApplicationError.assert(ctx.query._id, 'RT001: Route id required')

      if (!ctx.query._id) {
        throw new Error('You must provide the _id parameter in the request body')
      }

      const route = await Routes.findOne({_id: ctx.query._id})
      const fileContent = JSON.stringify(route)
      const filename = `${ctx.query._id}.json`

      ctx.body = fileContent

      ctx.set('Content-disposition', 'attachment; filename=' + filename);
      ctx.set('Content-type', 'json')
    } catch (error) {
      res.status(500).send(error)
    }
  }
}
