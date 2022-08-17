
import app from 'wampark'
// enable .env file
import dotenv from 'dotenv/config'
import db from './lib/db/index.js'
import webserver from './lib/webserver/koa.js'
import importRoute from './lib/importRoute.js'
import createMongoFieldSearchQuery from './lib/db/createMongoFieldSearchQuery.js'
import generateQuery from './lib/db/queryGenerator.js'
import parseISODateToDateObject from './lib/db/parseISODateToDateObject.js'
import { createReadStreamFromBuffer, getBufferFromStream } from './lib/streaming.js'
import Routes from './db/models/routes/index.js'
import SystemUsers from './db/models/system_users/index.js'

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const log = app.logger()

// ----------- DATA BASE CONNECTION ----------
if (process.env.DB_ENABLE) {
  log.info(`DB is enabled ${log.colors.yellow(`${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)}`)
  // montar connection string do mongoos
  let mongodbConnectionString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  // se tiver usuario e senha adicionar na string de conexão
  if (process.env.DB_USER) {
    mongodbConnectionString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  }

  db.connect(mongodbConnectionString)
}

// ----------- WAMP SERVER CONNECTION ----------

process.nextTick(() => {
  app.connectWampServer({
    url: process.env.WAMP_URL,
    realm: process.env.WAMP_REALM,
    authid: process.env.WAMP_AUTHID,
    authpass: process.env.WAMP_AUTHPASS,
  })

  app.on('wamp.session.start', async session => {
    // esperar todos os modulos e rotas serem processados pra então iniciar o app
    app.emit('app.start', session)
  })
})


// ----------- WEBSERVER SETUP ----------

if (process.env.HTTP_ENABLE) {
  const HTTP_PORT = process.env.HTTP_PORT || 3000
  webserver.listen(HTTP_PORT)
  webserver.HTTP_ENABLE = true
  log.info(`webserver listening on port ${log.colors.yellow(HTTP_PORT)}`)
}

export default app

export const models = {
  Routes,
  SystemUsers,
}

export const lib = {
  db: {
    createMongoFieldSearchQuery,
    parseISODateToDateObject,
    ...generateQuery
  },
  stream: {
    createReadStreamFromBuffer,
    getBufferFromStream
  },
}
/**
 * Init routes for application
 * @param {Array} routes Initial routes from config.routes.js
 */
export function startEngine (routes, options = {}) {
  let executeRoutesEnabled = false
  if (!Array.isArray(routes.autoload)) {
    routes.autoload = []
  }
  if (options.ENABLE_ROUTES_EXECUTE_ENDPOINT || process.env.ENABLE_ROUTES_EXECUTE_ENDPOINT) {
    executeRoutesEnabled = true
    routes.autoload = routes.autoload.concat([
      join(__dirname, 'services/services.executeRoute.js'),
    ])
  }
  if (options.ENABLE_AUTHENTICATION_ENDPOINT || process.env.ENABLE_AUTHENTICATION_ENDPOINT) {
    executeRoutesEnabled = true
    routes.autoload = routes.autoload.concat([
      join(__dirname, 'services/services.authenticate.ticket.js'),
      join(__dirname, 'services/services.authorizer.js'),
    ])
  }
  if (options.ENABLE_ROUTES_UI_ENDPOINT || process.env.ENABLE_ROUTES_UI_ENDPOINT) {
    if (!executeRoutesEnabled) {
      throw new app.ApplicationError('DEVKIT001: ENABLE_ROUTES_EXECUTE_ENDPOINT must be enabled')
    }
    routes.autoload = routes.autoload.concat([
      // UI
      join(__dirname, 'routes/ui.routes.page.js'),
      join(__dirname, 'routes/ui.routes.toolbar.new.js'),
      join(__dirname, 'routes/ui.routes.toolbar.save.js'),
      join(__dirname, 'routes/ui.routes.toolbar.delete.js'),
      join(__dirname, 'routes/ui.routes.toolbar.execute.js'),
      join(__dirname, 'routes/ui.routes.toolbar.export.js'),
      join(__dirname, 'routes/ui.routes.toolbar.import.js'),
      join(__dirname, 'routes/ui.routes.importRoute.onUploadSuccess.js'),
      join(__dirname, 'routes/ui.routes.importRoute.step2.js'),
      join(__dirname, 'routes/ui.routes.importRoute.step3.js'),
      join(__dirname, 'routes/ui.routes.navlistLeft.requestDataset.js'),
      join(__dirname, 'routes/ui.routes.navlistLeft.onSelect.js'),

      // HTTP upload routes
      join(__dirname, 'http/routes/download/index.js'),
      join(__dirname, 'http/routes/upload/index.js'),
    ])
  }
// ----------- AUTOLOAD ROUTES ----------

  routes.autoload.forEach(routePath => {
    log.info(`loading route -> ${routePath}`)
    importRoute(routePath)
  })
}