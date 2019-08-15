import * as Koa from 'koa'
import * as Router from 'koa-router'
import DDdata from './index'
import config from '../config/config'
const app = new Koa()
const router = new Router()
const {log} = console
const dd =  new DDdata(config.appkey, config.appsecret)
router.get('/', async (ctx) => {
  ctx.body = 'hello world'
})

router.get('/data', (ctx) => {
  log('data' + ctx.ip + ctx.url)
  ctx.body = dd.daliyData
})

app.use(router.routes())

app.listen(80)

log(80)
