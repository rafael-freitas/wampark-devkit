
import app from 'wampark'
// enable .env file
import dotenv from 'dotenv/config'
import db from './lib/db/index.js'
// configs


export default function initAppliction () {
  // ----------- DATA BASE CONNECTION ----------

  // montar connection string do mongoos
  let mongodbConnectionString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`

  // se tiver usuario e senha adicionar na string de conexão
  if (process.env.DB_USER) {
    mongodbConnectionString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
  }

  db.connect(mongodbConnectionString)

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
  // init application delay
  setTimeout(() => {app.emit('init')}, process.env.INIT_DELAY)
  return app
}

