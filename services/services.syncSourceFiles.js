import app from 'wampark'
import shell from 'shelljs'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import chokidar from 'chokidar'

import Routes from '../db/models/routes/index.js'


const RoutesError = app.ApplicationError

// generate random WORKER ID wether no ID is specified
const ROUTES_WORKER_ID = app.config.ROUTES_WORKER_ID || process.pid

const ROUTES_PREFIX = 'services.syncSourceFiles'

const SOURCE_DIR = path.join(path.resolve(), process.env.ROUTES_SOURCE_DIR, 'routes')

const ENABLE_ROUTES_SOURCE_SYNC = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC)
const ENABLE_ROUTES_SOURCE_SYNC_DELETE = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC_DELETE)
const ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE)
const ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE_DB = Number(process.env.ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE_DB)

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

    // this.fetchSourceFiles()
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
    // console.log(this.uri, _id)
    let route = await Routes.findOne({_id}, {_id: 1, hash: 1})
    if (route) {
      // console.log(`[source] already exists: ${_id}`)
      // throw Error(`exists ${_id}`)
      return
    }

    const file = Routes.parseFileContent(fs.readFileSync(fullpath))
    try {
      if (!route || file.hash !== route.hash) {
        if (file.content !== null) {
          Object.assign(file, {
            endpoint: _id
          })
          const doc = new Routes(file)
          await doc.save()
          console.log(`[${this.uri}] [NEW] ${doc._id} -> ${doc.hash}`)
        }
        else {
          console.log(`[${this.uri}] [ERROR] ${_id} -> No content found check export default function`)
        }
      }
      
    } catch (err) {
      console.log(`[${this.uri}] [ERROR] ${err.message}`, err)
    }

  }
  async change (fullpath) {
    const _id = path.parse(fullpath).name

    // console.log(`[${this.uri}] change ${_id}`)

    try {
      let route = await Routes.findOne({_id})

      if (route) {
        // console.log(`[${this.uri}] parsing: ${_id}`)
        const file = Routes.parseFileContent(fs.readFileSync(fullpath))

        if (file.content && file.hash && route.hash !== file.hash) {
          // console.log(`[${this.uri}] updating... ${_id} -> ${file.hash}`)
          Object.assign(route, file)
          await route.save()
          console.log(`[${this.uri}] [UPDATE ROUTE] ${_id} -> ${route.hash}`)
        }
        return
      }
      else {
        this.add(fullpath)
      }
    } catch (error) {
      console.log(`[${this.uri}] [UPDATE ROUTE ERROR] ${_id} -> ${route.hash}`)
    }
    console.log(`[${this.uri}] [CHANGE] ${fullpath}`)
  }

  async unlink (fullpath) {
    const _id = path.parse(fullpath).name
    try {
      if (!ENABLE_ROUTES_SOURCE_SYNC_DELETE) {
        console.log(`[${this.uri}] [WARN] ENABLE_ROUTES_SOURCE_SYNC_DELETE is disabled! ${fullpath} not removed from data base`)
        return
      }
      // console.log(`[${this.uri}] [REMOVE] ${_id}`)
      await Routes.deleteOne({_id})
      console.log(`[${this.uri}] [DELETED] ${_id}`)
    } catch (error) {
      console.log(`[${this.uri}] [DELETE] Cant removeve ${_id}`, error)
    }
    console.log(`[${this.uri}] [UNLINK] ${fullpath}`)
  }

  async error (fullpath) {
    console.log(`[${this.uri}] [FILE ERROR] ${fullpath}`)
  }

  /**
   * Função para retornar todos os arquivos de extensão .js de uma pasta
   * @param {String} directoryPath 
   * @returns {Array}
   */
  getJsFilesFromDir (directoryPath) {
    try {
        // Ler todos os arquivos da pasta
        const files = fs.readdirSync(directoryPath);

        // Filtrar apenas os arquivos com extensão .js
        const jsFiles = files.filter(file => path.extname(file) === '.js');

        return jsFiles;
    } catch (err) {
        console.error('Erro ao ler os arquivos da pasta:', err);
        return [];
    }
  }

  async fetchSourceFilesFromSourceFolder () {
    
    // ATUALIZAR ROUTE A PARTIR DO CODIGO FONTE (arquivo .js da rota)
    if (ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE_DB) {
      // buscar os arquivos fontes e checar se existe e deve atualizar o route no db
      let sources = this.getJsFilesFromDir(SOURCE_DIR)
      // console.log('sources', sources)
      for (const filepath of sources) {
        // console.log('SOURCE_DIR, filepath', SOURCE_DIR, filepath)
        await this.change(path.resolve(SOURCE_DIR, filepath))
      }
    }
  }
  async fetchSourceFilesFromDatabase () {
    const routes = await Routes.find().lean()
    for (const route of routes) {
      const sourcePath = path.join(SOURCE_DIR, route._id + '.js')
      if (!fs.existsSync(sourcePath)) {
        console.log(`[${this.uri}] [ADD] ${route._id} -> ${route.hash}`)
        fs.writeFileSync(sourcePath, Routes.generateFileContent(route))
      }
      else {
        if (ENABLE_ROUTES_SOURCE_SYNC_FORCE_UPDATE) {
          console.log(`[${this.uri}] [UPDATE] force update ${route._id} -> ${route.hash}`)
          fs.writeFileSync(sourcePath, Routes.generateFileContent(route))
        }
      }
    }
  }

  async onAttachSuccess () {
    await this.fetchSourceFilesFromSourceFolder()
    await this.fetchSourceFilesFromDatabase()
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

