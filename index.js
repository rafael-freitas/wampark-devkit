
import app from 'wampark'
import dotenv from 'dotenv'
import db from './lib/db/index.js'
import webserver from './lib/webserver/koa.js'
import importRoute from './lib/importRoute.js'
import createMongoFieldSearchQuery from './lib/db/createMongoFieldSearchQuery.js'
import validators from './lib/validators/index.js'
import formatters from './lib/formatters.js'
import generateQuery from './lib/db/queryGenerator.js'
import parseISODateToDateObject from './lib/db/parseISODateToDateObject.js'
import { createReadStreamFromBuffer, getBufferFromStream } from './lib/streaming.js'
import Routes from './db/models/routes/index.js'
import SystemUsers from './db/models/system_users/index.js'

import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

// enable .env file
dotenv.config({ path: '.env' })
dotenv.config({ path: 'dev.env', override: true })
dotenv.config({ path: 'prod.env', override: true })


const __dirname = dirname(fileURLToPath(import.meta.url))

const log = app.logger()


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
  validators,
  formatters
}

/**
 * 
 * @param {*} file filepath from application base path
 * @returns {String} full file path
 */
export function pathTo (file) {
  return join(__dirname, '../', file)
}

/**
 * 1- Connect to databse
 * 2- Enable webserver
 * 3- Connect to WAMP server nextTick
 * 
 */
export function setup () {

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
}

/**
 * Init routes for application
 * @param {Array} routes Initial routes from config.routes.js
 */
export function startEngine (routes, options = {}) {
  setup()
  Object.assign(options, process.env, options)
  let executeRoutesEnabled = false
  if (!Array.isArray(routes.autoload)) {
    routes.autoload = []
  }
  if (Number(options.ENABLE_ROUTES_EXECUTE_ENDPOINT)) {
    executeRoutesEnabled = true
    routes.autoload = routes.autoload.concat([
      join(__dirname, 'services/services.executeRoute.js'),
    ])
  }
  if (Number(options.ENABLE_AUTHENTICATION_ENDPOINT)) {
    routes.autoload = routes.autoload.concat([
      join(__dirname, 'services/services.authenticate.ticket.js'),
      join(__dirname, 'services/services.authorizer.js'),
    ])
  }

  if (Number(process.env.ENABLE_ROUTES_SOURCE) && Number(process.env.ENABLE_ROUTES_SOURCE_SYNC) && process.env.ROUTES_SOURCE_DIR) {
    console.log(`[engine] Enable sync source files`)
    routes.autoload = routes.autoload.concat([
      join(__dirname, 'services/services.syncSourceFiles.js'),
    ])
  }
  if (Number(options.ENABLE_ROUTES_UI_ENDPOINT)) {
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
      join(__dirname, 'routes/ui.routes.cells.hash.requestCellValue.js'),
      join(__dirname, 'routes/ui.routes.importRoute.onUploadSuccess.js'),
      join(__dirname, 'routes/ui.routes.importRoute.step2.js'),
      join(__dirname, 'routes/ui.routes.importRoute.step3.js'),
      join(__dirname, 'routes/ui.routes.navlistLeft.requestDataset.js'),
      join(__dirname, 'routes/ui.routes.navlistLeft.onSelect.js'),
      join(__dirname, 'routes/ui.routes.export.dialog.transfer.requestOptions.js'),
      join(__dirname, 'routes/ui.routes.export.dialog.exportPack.js'),
      join(__dirname, 'routes/ui.routes.dialogs.delete.requestDataset.js'),
      join(__dirname, 'routes/ui.routes.dialogs.delete.bulkDelete.js'),

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