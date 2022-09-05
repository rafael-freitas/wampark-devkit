
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

      if (ctx.query.selecteds) {
        const selecteds = JSON.parse(ctx.query.selecteds)
        const result = await Routes.findBy({_id: {$in: selecteds}})
        if (result.data.length < 1) {
          throw new Error('You must select 1 or more routes on selecteds parameter')
        }

        const fileContent = JSON.stringify(result)
        const filename = `routes_pack_${Date.now()}.json`
  
        ctx.body = fileContent
        ctx.set('Content-disposition', 'attachment; filename=' + filename);

      } else {
        if (!ctx.query._id) {
          throw new Error('You must provide the _id parameter in the request body')
        }
  
        const route = await Routes.findOne({_id: ctx.query._id})
        const fileContent = JSON.stringify(route)
        const filename = `${ctx.query._id}.json`
  
        ctx.body = fileContent
        ctx.set('Content-disposition', 'attachment; filename=' + filename);
      }

      
      ctx.set('Content-type', 'json')
    } catch (error) {
      res.status(500).send(error)
    }
  }
}
