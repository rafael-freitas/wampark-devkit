import app from 'wampark'
import shell from 'shelljs'
import path from 'path'
import fs from 'fs'
import _ from 'lodash'

import RouteSandbox from '../lib/RouteSandbox.js'
import Routes from '../db/models/routes/index.js'

const RoutesError = app.ApplicationError

// generate random WORKER ID wether no ID is specified
const ROUTES_WORKER_ID = app.config.ROUTES_WORKER_ID || process.pid

const ROUTES_PREFIX = app.config.ROUTES_PREFIX || 'routes'

const SNIPPET_DIR = path.join(path.resolve(), '.snippets')

const SOURCE_DIR = path.join(path.resolve(), process.env.ROUTES_SOURCE_DIR, 'routes')

const ENABLE_ROUTES_SOURCE = Number(process.env.ENABLE_ROUTES_SOURCE)

if (process.env.ROUTES_SOURCE_DIR) {
  shell.mkdir('-p', SOURCE_DIR)
}

export default class ExecuteRoutesRoute extends app.Route {
  constructor () {
    super({
      type: app.RouteTypes.RPC,
      uri: ROUTES_PREFIX,
      options: {
        match: 'prefix'
      }
    })
    // guardar as rotas importadas e os metodos indexados por hash
    this.routes = {}
    this.cache = {}
  }

  setup (args = [], kwargs = {}, details = {}) {
    const [protocol = {}] = args
    // setar sempre o chamador inicial como protocolo
    if (protocol.targetUser) {
      this.details = {
        caller_authid: protocol.targetUser,
        caller: protocol.targetSession,
        procedure: details.procedure,
      }
    }
  }

  /**
   * @ignore
   * @param args
   * @param kwargs
   * @param details
   */
  async endpoint (args = [], kwargs = {}, details = {}) {

    const routeId = String(this.details.procedure).replace(ROUTES_PREFIX + '.', '')

    const route = await Routes.findOne({ _id: routeId }, {_id: 1, hash: 1}).lean()

    if (!route) {
      throw new RoutesError(`services.executeRoute.A001: No Route found <${routeId}> uri: [${details.procedure}]`)
    }

    return this.callRouteInstanceMethod(route, args, kwargs, details)
  }

  async callRouteInstanceMethod (..._args) {
    const [route, args = [], kwargs = {}, details = {}] = _args

    const createSandbox = () => {
      // create sandbox
      const sandbox = RouteSandbox.extend(this)
      sandbox.uri = `sandbox#${route._id}`
      sandbox.log = sandbox.getLogger()
      sandbox.beforeSetup(args, kwargs, details)
      sandbox.setup(args, kwargs, details)
      return sandbox
    }

    if (process.env.ROUTES_SOURCE_DIR && ENABLE_ROUTES_SOURCE) {
      try {
        const sourcePath = path.join(SOURCE_DIR, route._id + '.js')

        if (!fs.existsSync(sourcePath)) {
          this.log.info(`[SOURCE] Creating.... <${this.log.colors.yellow(sourcePath)}>`)
          const doc = await Routes.findOne({_id: route._id})
          fs.writeFileSync(sourcePath, doc.getFileContent())
        }

        if (this.routes[route._id] && this.routes[route._id] !== route.hash) {
          this.log.info(`[SOURCE] Updating... <${this.log.colors.yellow(sourcePath)}>`)
          const doc = await Routes.findOne({_id: route._id})
          fs.writeFileSync(sourcePath, doc.getFileContent())
        }

        this.routes[route._id] = route.hash

        const { default: sourceMethod } = await import(sourcePath + '?update=' + route.hash)

        const sandbox = createSandbox()

        this.log.info(`[SOURCE] Running [${route.hash}] <${this.log.colors.yellow(route._id)}>`)

        return sourceMethod.call(sandbox, {args, kwargs, details})

        
      } catch (err) {
        if (err instanceof app.ApplicationError) {
          throw err
        }
        throw RoutesError.parse(err)
      }
    }

    let cache = this.cache[route._id]

    if (cache) {
      // se o hash mudou importar o snippet novamente
      if (this.routes[route._id] !== route.hash) {
        this.log.info(`Removing route cache [${this.routes[route._id]}] <${this.log.colors.silly(route._id)}>`)
        delete this.cache[route._id]
        return this.callRouteInstanceMethod(..._args)
      }
      try {
        this.log.info(`Running [${route.hash}] <${this.log.colors.silly(route._id)}> by [${this.log.colors.yellow(details.caller)}/${details.caller_authid}]`)

        const sandbox = createSandbox()

        return await cache.call(sandbox, {args, kwargs, details})
      } catch (err) {
        if (err instanceof app.ApplicationError) {
          throw err
        }
        throw RoutesError.parse(err)
  
        // throw new RoutesError(`services.callRouteInstanceMethod.E001: <${route._id}> ${error.message}`, err)
      }
    } else {
      this.log.info(`Creating route sandbox [${route.hash}] <${this.log.colors.silly(route._id)}>`)
      // criar o diretorio de snippets dinamicos de cada workflow chamado
      route.snippetDir = path.join(SNIPPET_DIR, route._id)
      shell.mkdir('-p', route.snippetDir)

      // converter codigo em metodo da classe Sandbox - gravar em arquivo no diretorio .snippets/
      const filepath = path.join(route.snippetDir, `${route.hash}.js`)
      const doc = await Routes.findOne({_id: route._id})
      fs.writeFileSync(filepath, doc.getFileContent())
      const { default: contentMethod } = await import(`${filepath}?update=${doc.hash}`)

      this.routes[route._id] = doc.hash
      this.cache[route._id] = contentMethod

      return this.callRouteInstanceMethod(..._args)
    }
  }

}

