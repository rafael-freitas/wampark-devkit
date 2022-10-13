import app from 'wampark'
import bodyParser from 'koa-body'
import mime from 'mime-types'
import fs from 'fs'
import path from 'path'
import shell from 'shelljs'
import WebRoute from '../../../lib/WebRoute.js'
import Routes from '../../../db/models/routes/index.js'


// const ROUTES_UPLOAD_DIR = process.env.ROUTES_UPLOAD_DIR || './.uploaded_routes'

const ROUTES_PREFIX = process.env.ROUTES_PREFIX || 'routes'

export default class WebRouteExecuteRoute extends WebRoute {
  constructor () {
    super({
      type: app.RouteTypes.ALL,
      uri: '/route/:endpoint',
      middleware: [
        bodyParser({
           uploadDir: './uploads',
           multipart: true,
           urlencoded: true
        })
      ]
    })
  }

  async endpoint (ctx, next) {
    
    try {
      app.ApplicationError.assert(ctx.params.endpoint, `WebRouteExecuteRoute.A001: endpoint is requred`)

      const route = await Routes.selectOne({_id: ctx.params.endpoint}, '_id')

      app.ApplicationError.assert.object(route, `WebRouteExecuteRoute.A002: Route not found`)

      const response = await app.currentSession.call(ROUTES_PREFIX + '.' + route._id, ctx.request)

      ctx.body = response

      ctx.set('Content-Type', 'json');
      ctx.set('Status', 500);
    }
    catch (err) {
      const error = app.ApplicationError.parse(err)

      ctx.body = {
        error: error.toObject()
      }
      ctx.set('Content-Type', 'json');
      ctx.set('Status', 500);
    }
    console.log(ctx.params.endpoint)
  }
}
