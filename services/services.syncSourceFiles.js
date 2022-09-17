import app from 'wampark'
import shell from 'shelljs'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import { v5 as uuid } from 'uuid'
import chokidar from 'chokidar'

import RouteSandbox from '../lib/RouteSandbox.js'
import Routes from '../db/models/routes/index.js'


const RoutesError = app.ApplicationError

// generate random WORKER ID wether no ID is specified
const ROUTES_WORKER_ID = app.config.ROUTES_WORKER_ID || process.pid

const ROUTES_PREFIX = 'services.syncSourceFiles'

const SOURCE_DIR = path.join(path.resolve(), process.env.ROUTES_SOURCE_DIR, 'routes')

const ENABLE_ROUTES_SOURCE = Number(process.env.ENABLE_ROUTES_SOURCE)
const ENABLE_ROUTES_SOURCE_SYNC = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC)

if (process.env.ROUTES_SOURCE_DIR) {
  shell.mkdir('-p', SOURCE_DIR)
}

let WATCHER = false

export default class SyncSourceFilesRoute extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: ROUTES_PREFIX,
    })
    // guardar as rotas importadas e os metodos indexados por hash
    this.routes = {}
    this.watchers = {}

    this.fetchSourceFiles()
  }

  installWatcher () {
    if (!ENABLE_ROUTES_SOURCE_SYNC || WATCHER) {
      return
    }
    
    if (process.env.ROUTES_SOURCE_DIR) {
      WATCHER = true

      var watcher = chokidar.watch(SOURCE_DIR, {ignored: /^\./, persistent: true});

      watcher
        .on('add', (path) => this.add(path))
        .on('change', (path) => this.change(path))
        .on('unlink', (path) => this.unlink(path))
        .on('error', (path) => this.error(path))

    }

  }

  async add (fullpath) {
    const _id = path.parse(fullpath).name
    let route = await Routes.findOne({_id}, {_id: 1})
    if (route) {
      // console.log(`[source] already exists: ${_id}`)
      return
    }

    const file = Routes.parseFileContent(fs.readFileSync(fullpath))
    const doc = new Routes(file)
    try {
      await doc.save()
      console.log(`[${this.uri}] [NEW] ${doc._id} -> ${doc.hash}`)
    } catch (err) {
      console.log(`[${this.uri}] [ERROR] ${err.message}`, err)
    }

  }
  async change (fullpath) {
    const _id = path.parse(fullpath).name

    console.log(`[${this.uri}] change ${_id}`)

    let route = await Routes.findOne({_id})

    if (route) {
      console.log(`[${this.uri}] parsing: ${_id}`)
      const file = Routes.parseFileContent(fs.readFileSync(fullpath))

      if (file.content && file.hash && route.hash !== file.hash) {
        console.log(`[${this.uri}] updating... ${_id} -> ${file.hash}`)
        Object.assign(route, file)
        await route.save()
        console.log(`[${this.uri}] [UPDATED] ${_id} -> ${route.hash}`)
      }
      return
    }
  }
  async unlink (fullpath) {
    console.log(`[${this.uri}] unlink ${fullpath}`)
  }
  async error (fullpath) {
    console.log(`[${this.uri}] error ${fullpath}`)
  }

  async fetchSourceFiles () {
    const routes = await Routes.find().lean()
    for (const route of routes) {
      const sourcePath = path.join(SOURCE_DIR, route._id + '.js')
      if (!fs.existsSync(sourcePath)) {
        console.log(`[${this.uri}] [ADD] ${_id} -> ${route.hash}`)
        fs.writeFileSync(sourcePath, Routes.generateFileContent(route))
      }
    }
  }

  onAttachSuccess () {
    this.installWatcher()
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {
    
  }
}

