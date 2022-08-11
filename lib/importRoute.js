import app from 'wampark'
import path from 'path'
import WebRoute from './WebRoute.js'
import webserver from './webserver/koa.js'

export default async function importRoute (routePath) {
  const { default: RouteClass } = await import(path.resolve(routePath))
  if ( new RouteClass instanceof WebRoute) {
    const route = RouteClass.attach(webserver)
    app.setSession(route)

  } else {
    app.attachRoute(RouteClass)
  }
}