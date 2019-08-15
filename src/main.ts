import * as Koa from 'koa'
import * as Router from 'koa-router'
import DDdata from './index'
import config from '../config/config'
const app = new Koa()
const router = new Router()
const {log} = console
const dd =  new DDdata(config.appkey, config.appsecret)
router.get('/', async (ctx) => {
  log('main' + ctx.ip + ' | ' + ctx.url)
  ctx.body = 'hello world'
})

router.get('/gettoDayData', (ctx) => {
  log('gettoDayData' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.daliyData
})

router.get('/getWeekData', (ctx) => {
  log('getWeekData' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.weekdata
})

router.get('/getMoonData', (ctx) => {
  log('getMoonData' + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.moondata
})

router.get('/getdimission', (ctx) => {
  log('getdimission'  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.cooldata.employee
})

router.get('/getStatusList', (ctx) => {
  log('getStatusList'  + ctx.ip + ' | ' + ctx.url)
  ctx.body = dd.data.employee
})

app.use(router.routes())

app.listen(80)

log(80)
