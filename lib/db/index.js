import mongoose from 'mongoose'
import app from 'wampark'

const log = app.logger('db')

/**
 * @requires config
 * @requires mongoose
 * @requires assert
 * @description
 * ## Adaptador de Dados para o Mongoose
 *
 * Esta interface fornece controle de conexão com o Mongo através do Mongoose e também registra um conjunto de rotas para o Wamp.
 * @author     Rafael Freitas
 * @date       Jan 31 2018
 *
 * @module lib/db
 * @example
 * import db from '/lib/db'
 */

export default {
  connect
}

// prever o erro de promise deprecated
mongoose.Promise = Promise

/**
 * connect - Abre uma conexao com o MongoDB via Mongoose
 * mongodb://localhost:27017/myapp
 *
 * @returns {Connection} mongoose.connection
 */
function connect (connectionString) {
  try {
    log.info(`Trying to connect to MongoDB on "${log.colors.yellow(connectionString)}"`)
    // mongoose.set('useCreateIndex', true)
    mongoose.connect(connectionString, { useNewUrlParser: true, useUnifiedTopology: true })
    mongoose.connection.on('open', openHandlerCalback)
    mongoose.connection.on('error', errorHandlerCallback)
  } catch (err) {
    log.error(`Fail to connect to DB "${log.colors.red(connectionString)}" Error: ${err.toString()} - ${log.fail}`)
  }

  function openHandlerCalback () {
    log.info(`DB connected via Mongoose "${log.colors.yellow(connectionString)}" - ${log.ok}`)
    app.emit('db.mongoose.connected')
  }

  function errorHandlerCallback (err) {
    log.error(`Fail to connect to DB "${log.colors.red(connectionString)}" Error: ${err.toString()} - ${log.fail}`)
    app.emit('db.mongoose.error', {
      error: err
    })
  }

  return mongoose.connection
}
