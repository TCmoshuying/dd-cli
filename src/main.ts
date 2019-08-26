import * as Koa from 'koa'
import * as Router from 'koa-router'
// tslint:disable-next-line: import-spacing
import * as bodyParser  from 'koa-bodyparser'
// tslint:disable-next-line: no-var-requires
const Moment = require('moment')
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

import DDdata from 'ddinit'
import config from '../config/min'

const app = new Koa()
app.use(bodyParser())
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*')
  ctx.set('Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE')
  ctx.set('Access-Control-Allow-Headers', 'x-requested-with, accept, origin, content-type')
  ctx.set('Content-Type', 'application/json;charset=utf-8')
  ctx.set('Access-Control-Allow-Credentials', true)
  ctx.set('Access-Control-Max-Age', 300)
  ctx.set('Access-Control-Expose-Headers', 'myData')
  await next()
})
const router = new Router()
const dd =  new DDdata(config.appkey, config.appsecret, 4, 2, 500)
router.get('/', async (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'main' + ' | ' + ctx.ip + ' | ' + ctx.url)
  // 这里做了一个重定向演示,嘻嘻,暂时用了我自己的博客地址,欢迎访问
  ctx.redirect('https://me.csdn.net/qq_34846662')
})

router.get('/getemployee', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getemployee' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.data.employee
})

router.get('/getuserIdList', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getuserIdList' + ' | ' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.data.userIdList
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
  ctx.request.query.num = ctx.request.query.num || 0
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
  ctx.request.query.num = ctx.request.query.num || 0
  logger.info(ctx.method + ' | ' + 'getMoonData' + ' | ' + ctx.ip + ' | ' + ctx.url + ' | ' + ctx.request.query.num + ' | ' + dd.moondata.length)
  ctx.body = dd.moondata[Number(ctx.request.query.num)]
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

router.post('/postAnyTimeData', async (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'postAnyTimeData' + ' | '  + ctx.ip + ' | ' + ctx.url + ' | ' + JSON.stringify(ctx.request.body))
  const time1 = ctx.request.body.time1
  const time2 = ctx.request.body.time2
  const pat = /([0-9]{4})\-([0-1][0-9])\-([0-9]{2})[ \f\n\r\t\v]([0-2][0-9])\:([0-6][0-9])\:([0-6][0-9])/g
  const pat2 = /([0-9]{4})\-([0-1][0-9])\-([0-9]{2})[ \f\n\r\t\v]([0-2][0-9])\:([0-6][0-9])\:([0-6][0-9])/i
  if (time1 > time2) {
    ctx.body = '开始时间在结束时间之后'
    return
  }
  if (time1.substring(0, 10) < new Moment().subtract(6, 'month').format('YYYY-MM-DD')) {
    ctx.body = '钉钉禁止查询半年以前的数据'
    return
  }
  if (pat.test(ctx.request.body.time1) && pat2.test(ctx.request.body.time2)) {
    ctx.body = await dd.getKaoqingLists(String(ctx.request.body.time1), String(ctx.request.body.time2))
  } else {
    ctx.body = '参数错误'
  }
})

router.get('/getCooldimissionList', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getCooldimissionList' + ' | '  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.cooldata.dimissionList
})

router.get('/getCoolemployee', (ctx: any) => {
  logger.info(ctx.method + ' | ' + 'getCoolemployee' + ' | '  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.cooldata.employee
})

app.use(router.routes())

app.listen(config.listen)

logger.info(config.listen)
