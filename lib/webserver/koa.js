import Koa from 'koa'
import route from 'koa-route'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import app from 'wampark'

const server = new Koa()
const METHODS = 'get,post,put,all,acl,delete,del,link,patch,head'.split(',')
const log = app.logger('webserver')

server.router = route

// middlewares
server.use(bodyParser({ enableTypes: ['json', 'text', 'form'] }))
server.use(cors())

// attach methods to koa instance

METHODS.map(v => v.toLowerCase()).forEach(x => {
  server[x] = (...args) => {
    const method = server.router[x]
    const middleware = method.apply(server.router, args)
    server.use(middleware)
    log.info(`use path -> ${args[0]}`)
  }
})

// logger

// middleware
server.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
})

/**
 * Default Error handling
 */
server.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    // will only respond with JSON
    ctx.status = err.statusCode || err.status || 500
    ctx.body = {
      message: err.message
    }
  }
})

// x-response-time

server.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

// server.use(async ctx => {
//   ctx.body = 'Hello World';
// });

// server.listen(3000);

export default server