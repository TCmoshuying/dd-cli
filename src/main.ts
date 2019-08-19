import * as Koa from 'koa'
import * as Router from 'koa-router'
// tslint:disable-next-line: import-spacing
import * as bodyParser  from 'koa-bodyparser'
import log4js = require('log4js')
log4js.configure({
  appenders: {
    consoleout: { type: 'console' },
    fileout: { type: 'file', filename: 'src/log/log.log', layout: { type: 'pattern', pattern: '[%d] [%p] %c [%1]-%f{1} %m' }}
  },
  categories: {
    default: { appenders: ['consoleout', 'fileout'], level: 'debug' }
  }
})
const logger = log4js.getLogger()

import DDdata from './index'
import config from '../config/config'

const app = new Koa()
app.use(bodyParser())
app.use(async (ctx, next) => {
  // 允许来自所有域名请求
  ctx.set('Access-Control-Allow-Origin', '*')
  // 这样就能只允许 http://localhost:8080 这个域名的请求了
  // ctx.set("Access-Control-Allow-Origin", "http://localhost:8080");
  // 设置所允许的HTTP请求方法
  ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
  // 字段是必需的。它也是一个逗号分隔的字符串，表明服务器支持的所有头信息字段.
  ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')
  // 服务器收到请求以后，检查了Origin、Access-Control-Request-Method和Access-Control-Request-Headers字段以后，确认允许跨源请求，就可以做出回应。
  // Content-Type表示具体请求中的媒体类型信息
  ctx.set('Content-Type', 'application/json;charset=utf-8')
  // 该字段可选。它的值是一个布尔值，表示是否允许发送Cookie。默认情况下，Cookie不包括在CORS请求之中。
  // 当设置成允许请求携带cookie时，需要保证"Access-Control-Allow-Origin"是服务器有的域名，而不能是"*";
  ctx.set('Access-Control-Allow-Credentials', true)
  // 该字段可选，用来指定本次预检请求的有效期，单位为秒。
  // 当请求方法是PUT或DELETE等特殊方法或者Content-Type字段的类型是application/json时，服务器会提前发送一次请求进行验证
  // 下面的的设置只本次验证的有效时间，即在该时间段内服务端可以不用进行验证
  ctx.set('Access-Control-Max-Age', 300)
  /*
  CORS请求时，XMLHttpRequest对象的getResponseHeader()方法只能拿到6个基本字段：
      Cache-Control、
      Content-Language、
      Content-Type、
      Expires、
      Last-Modified、
      Pragma。
  */
  // 需要获取其他字段时，使用Access-Control-Expose-Headers，
  // getResponseHeader('myData')可以返回我们所需的值
  ctx.set('Access-Control-Expose-Headers', 'myData')
  await next()
})
const router = new Router()
const dd =  new DDdata(config.appkey, config.appsecret, 4, 2)
router.get('/', async (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'main' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.redirect('https://me.csdn.net/qq_34846662')
  // ctx.body = null
})

router.get('/getemployee', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getemployee' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.data.employee
})

router.get('/gettoDayData', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'gettoDayData' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.daliyData
})

router.post('/posttoDayData', async (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'posttoDayData' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.body = await dd.gettoDayData()
})

router.get('/getWeekData', (ctx: any) => {
  ctx.request.query.num = ctx.request.query.num || 1
  logger.info(ctx.method + ' | ' + 'getWeekData' + ' | ' + ctx.ip + ' | ' + ctx.url + ' | ' + ctx.request.query.num + ' | ' + dd.weekdata.length)
  ctx.body = dd.weekdata[Number(ctx.request.query.num)]
})

router.post('/postWeekData', async (ctx: any) => {
  // ctx.query.num = ctx.query.num || 1
  logger.info(ctx.method + ' | ' + 'postWeekData' + ' | ' + ctx.ip + ' | ' + ctx.url + ' | ' + ctx.request.body.num)
  if (ctx.request.body.num === undefined) {
    ctx.body = ''
  } else {
  ctx.body = await dd.getWeekData(ctx.request.body.num)
  }
})

router.get('/getMoonData', (ctx: any) => {
  ctx.request.query.num = ctx.request.query.num || 1
  logger.info(ctx.method + ' | ' + 'getMoonData' + ' | ' + ctx.ip + ' | ' + ctx.url + ' | ' + ctx.request.query.num + ' | ' + dd.moondata.length)
  ctx.body = dd.moondata[ctx.request.query.num]
})

router.post('/postMoonData', async (ctx: any) => {
  // ctx.query.num = ctx.query.num || 1
  logger.info(ctx.method + ' | ' + 'postMoonData' + ' | ' + ctx.ip + ' | ' + ctx.url + ' | ' + ctx.request.body.num)
  if (ctx.request.body.num === undefined) {
    ctx.body = ''
  } else {
    ctx.body = await dd.getMoonData(ctx.request.body.num)
  }
})

router.get('/getdimission', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getdimission' + ' | '  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.cooldata.employee
})

router.get('/getStatusList', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getStatusList' + ' | '  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.data.employee
})

app.use(router.routes())

app.listen(config.listen)

logger.info(config.listen)
