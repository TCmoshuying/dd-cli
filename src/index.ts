import axios from 'axios'
// tslint:disable-next-line: no-var-requires
const CronJob = require('cron').CronJob
import config from '../config/config'
// tslint:disable-next-line: no-var-requires
const Moment = require('moment')

const { log } = console
const mainUrl = config.mainUrl

class DDdata {
  private Key: string
  public weekdata = []
  public moondata = []
  public daliyData = []
  private Secret: string
  private AccessToken: string
  public data = { userIdList: [], employee: [] }
  public cooldata = { dimissionList: [], employee: [] }
  public holidayData = {}
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string, week?: number, moon?: number) {
    this.Key = key
    this.Secret = Secret
    week = week || 1
    moon = moon || 1
    this.refreshen(week, moon)
  }
  /**
   * 启动时刷新数据
   */
  async refreshen(week?: number, moon?: number) {
    try {
      this.job(5)
      this.getAccessTonken()

      await this.getHoliday()
      await this.getToken()
      await this.getStatusList()
      await this.getemployee()

      for (let ix = 0; ix < week; ix++) {
        log(ix + config.apiList.getWeekData.keyName + 'starting')
        this.getWeekData(ix + 1, ix)
      }
      for (let ix = 0; ix < moon; ix++) {
        log(ix + config.apiList.getMoonData.keyName + 'starting')
        this.getMoonData(ix + 1, ix)
      }
      await this.getdimission()
      this.cooldata.employee = await this.getemployee(this.cooldata.dimissionList)
    } catch (e) {
      log(e)
    }
  }
  /**
   * 不传参时,默认以最高速度获取在职员工id信息
   * @param speed 获取速度
   * @param Substate 员工子状态
   * @param offsetis 分页值,默认从0开始
   * @param sizeis 单页数据大小
   * @param token 秘钥
   * @returns array 离职员工列表
   */
  async getStatusList(Substate?: string, offsetis?: string | number, sizeis?: string | number, token?: string) {
    sizeis = sizeis || 20
    offsetis = offsetis || 0
    Substate = Substate || config.apiList.getStatusList.status_list
    token = token || this.AccessToken
    const userIdList = new Array()
    while (true) {
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}${config.apiList.getStatusList.url}${token}`,
        data: { status_list: Substate, offset: offsetis, size: sizeis }
      })
      offsetis = data.result.next_cursor
      if (data.result.next_cursor !== undefined) {
        data.result.data_list.forEach((el: any) => {
          userIdList.push(el)
        })
      } else {
        log(config.apiList.getStatusList.keyName + config.functiondone)
        this.data.userIdList = userIdList
        break
      }
    }
    return userIdList
  }
  /**
   * 不传参时,默认以最高速度获取离职员工id信息
   * @param speed 获取速度
   * @param offsetis 分页值
   * @param sizeis 单词取得数据大小
   * @param token 秘钥
   * @returns array 离职员工id信息
   */
  async getdimission(offsetis?: string | number, sizeis?: string | number, token?: string) {
    sizeis = sizeis || 50
    offsetis = offsetis || 0
    token = token || this.AccessToken
    const dimissionList = []
    while (true) {
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}${config.apiList.getdimission.url}${token}`,
        data: { offset: offsetis, size: sizeis }
      })
      offsetis = data.result.next_cursor
      if (data.result.next_cursor !== undefined) {
        data.result.data_list.forEach((el: any) => {
          dimissionList.push(el)
        })
      } else {
        log(config.apiList.getdimission.keyName + config.functiondone)
        this.cooldata.dimissionList = dimissionList
        break
      }
    }
    return dimissionList
  }
  /**
   * 不传参时,函数默认调用在职(待离职也算)员工列表,并获取其id,姓名,职位,部门信息
   * @param list 员工id列表
   * @param token 秘钥
   * @returns array 返回员工部门职位,姓名和id信息
   */
  async getemployee(list?: { [x: string]: any; }, token?: string) {
    token = token || this.AccessToken
    list = list || this.data.userIdList
    const redata = []
    const api = config.apiList.getemployee
    const fieldFilter = api.fieldFilter
    for (let querix = 0; querix >= 0; querix++) {
      if (querix === list.length) {
        log(api.keyName + config.functiondone)
        break
      }
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}${api.url}${token}`,
        data: {
          userid_list: list[querix],
          field_filter_list: fieldFilter,
        }
      })
      if (data.success) {
        const pushData = {
          name: data.result[0].field_list[0].value,
          userid: data.result[0].userid,
          branch: data.result[0].field_list[3].value,
          place: data.result[0].field_list[1].value
        }
        redata.push(pushData)
      }
    }
    this.data.employee = redata
    return redata
  }
  /**
   * 不传参时,默认以最高速度获取在职员工每日打卡结果
   * @param offsetis 分页值,不传参默认以0开始
   * @param limitis 分页大小,也就是每一次查询时的返回数据条数,默认为50
   * @param list 员工列表,默认使用在职员工信息
   * @param token 秘钥
   * @returns array 返回在职员工打卡结果
   */
  async gettoDayData(offsetis?: number, limitis?: number, list?: any[], token?: string) {
    offsetis = offsetis || 0
    limitis = limitis || 50
    list = list || this.data.userIdList
    token = token || this.AccessToken
    const time = new Date().toJSON().substring(0, 10)
    const fromtime = time + ' 00:00:00'
    const totime = time + ' 23:59:59'
    let Ltemp = []
    Ltemp = await this.getKaoqingLists(list, this.data.employee, fromtime, totime, offsetis, limitis)
    this.daliyData = Ltemp.sort((item1, item2) => {
      return item1.name.localeCompare(item2.name, 'zh-CN')
    })
    log(config.apiList.gettoDayData.keyName, config.functiondone)
    return Ltemp
  }
  /**
   * 返回上num周的数据,不传数据默认获取上周在职员工的打卡数据(不会解析离职员工信息,返回'已离职')
   * @param num 获取上num周的数据默认为1,传或不传为上周数据,传2位上第二周数据
   * @param ix 暂存下标
   * @param offsetis 分页值
   * @param limitis 分页数据大小
   * @param list 员工id:名字信息表
   * @param token 秘钥
   */
  async getWeekData(num?: number, ix?: number, offsetis?: number, limitis?: number, list?: any[], token?: string) {
    num = num || 1
    limitis = limitis || 50
    offsetis = offsetis || 0
    list = list || this.data.userIdList
    token = token || this.AccessToken
    const lastWeek1 = new Moment().day(-((num * 7) - 1)).format('YYYY-MM-DD').toString()
    const lastWeek2 = new Moment().day(-((num * 7) - 7)).format('YYYY-MM-DD').toString()
    const time1 = '' + lastWeek1 + ' 00:00:00'
    const time2 = '' + lastWeek2 + ' 23:59:59'
    let Ltemp = []
    Ltemp = await this.getKaoqingLists(list, this.data.employee, time1, time2, offsetis, limitis)
    this.weekdata[ix] = Ltemp.sort((item1, item2) => {
      return item1.name.localeCompare(item2.name, 'zh-CN')
    })
    // log(JSON.stringify(this.weekdata))
    log(config.apiList.getWeekData.keyName, num, ix, config.functiondone)
    return Ltemp
  }
  /**
   * 返回上num月的数据,不传数据默认获取上月在职员工的打卡数据(不会解析离职员工信息,返回'已离职')
   * @param num 获取上num月的数据,默认为1,传或不传为上月数据,传2位上第二月数据
   * @param ix 暂存下标
   * @param offsetis 分页值
   * @param limitis 分页数据大小
   * @param list 员工id:名字信息表
   * @param token 秘钥
   */
  async getMoonData(num?: number, ix?: number, offsetis?: number, limitis?: number, list?: any[], token?: string) {
    const day = 1
    num = num || 0
    const Ltemp = []
    limitis = limitis || 50
    offsetis = offsetis || 0
    list = list || this.data.userIdList
    token = token || this.AccessToken
    const today = new Date()
    const year = today.getFullYear()
    const month =  today.getMonth() - num
    const lastMoon1 = new Moment([year, month, day]).format('YYYY-MM-DD')
    const lastMoonDay = new Moment(lastMoon1).endOf('month').format('DD')
    for (let day = 1; day < Number(lastMoonDay); day++) {
      let time1 = year + '-' + ((month + 1) < 10 ? ('0' + (month + 1)) : (month + 1)) + '-' + (day < 10 ? ('0' + day) : day) + ' 00:00:00'
      let time2 = new Moment([year, month, day]).add(1, 'days').format('YYYY-MM-DD') + ' 23:59:59'
      let temp = await this.getKaoqingLists(list, this.data.employee, time1, time2, offsetis, limitis)
      Ltemp.push.apply(Ltemp, temp)
      time2 = null
      time1 = null
      temp = null
    }
    this.moondata[ix] = Ltemp.sort((item1, item2) => {
      return item1.name.localeCompare(item2.name, 'zh-CN')
    })
    log(config.apiList.getMoonData.keyName, num, ix, config.functiondone)
    return Ltemp
  }
  /**
   * 获取time1和time2之间的用户考勤信息,time1和time2最长间隔7天
   * @param useridList 用户id列表,查询考勤数据必填选项
   * @param employeeList 用户id与姓名,部门,职位等信息表,格式为数组对象[{name:name,branch:branch}]
   * @param time1 查询所需的开始时间
   * @param time2 查询所需的结束时间
   * @param offsetis 分页值,默认从0开始
   * @param limitis 单页数据大小,默认为50
   * @param apiUrl 请求的url这里似乎是固定的
   * @param start 用户id列表的查询起始值,默认从0开始
   * @param token 秘钥
   */
  async getKaoqingLists(useridList: any, employeeList: any[], time1: string, time2: string,
                        offsetis?: number, limitis?: number, apiUrl?: string, start?: number, token?: string) {
    const Ltemp = []
    start = start || 0
    limitis = limitis || 50
    offsetis = offsetis || 0
    token = token || this.AccessToken
    apiUrl = apiUrl || config.apiList.getKaoqingLists.url
    while (true) {
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}${apiUrl}${token}`,
        data: {
          workDateFrom: time1,
          workDateTo: time2,
          userIdList: this.getDoubleIndex(useridList, start, start + 50),
          offset: offsetis,
          limit: limitis
        }
      })
      offsetis = offsetis + limitis
      for (const el of data.recordresult) {
        let Lname = employeeList.find((Lelement: any) => {
          if (Lelement.userid === el.userId) {
            return { name: Lelement.name, branch: Lelement.branch }
          }
        })
        if (Lname.name === undefined) {
          Lname.name = '未知人员或已离职人员'
          Lname.branch = '未知人员或已离职人员'
        }
        const checkDate = new Date(el.baseCheckTime).toJSON().substring(5, 10).split('-')
        const month = Number(checkDate[0]) < 10 ? '0' + Number(checkDate[0]) : Number(checkDate[0])
        const day = Number(checkDate[1]) < 10 ? '0' + Number(checkDate[1]) : '' + Number(checkDate[1])
        let temp = {
          name: Lname.name,
          userId: el.userId,
          branch: Lname.branch,
          checkType: el.checkType,
          timeResult: el.timeResult,
          workDay: this.holidayData[month + day] === undefined ? '0' : this.holidayData[month + day],
          sortTime: el.userCheckTime,
          baseCheckTime: el.baseCheckTime,
          locationResult: el.locationResult,
          userCheckTime: new Date(el.userCheckTime).toLocaleString()
        }
        Ltemp.push(temp)
        temp = null
        Lname = null
      }
      if (!data.hasMore) { start += 50; offsetis = 0 }
      if (!data.hasMore && start > useridList.length) { break }
    }
    return Ltemp
  }

  /**
   * 立即获取秘钥并保存在对象中
   */
  async getToken() {
    const { Key, Secret } = this
    const { data } = await axios(
      `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`)
    if (data.access_token) {
      log(`access_token is updata`)
    } else {
      throw new Error('秘钥请求失败, 请检查秘钥或网络')
    }
    this.AccessToken = data.access_token
    return data.access_token
  }
  /**
   * 每(两小时-5s)获取一次token,对象被创建时即被引用
   */
  async getAccessTonken() {
    setInterval(async () => {
      const { Key, Secret } = this
      const { data } = await axios(
        `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`)
      if (data.access_token) {
        log(`access_token is updata`)
      } else {
        throw new Error('秘钥请求失败, 请检查秘钥或网络')
      }
      this.AccessToken = data.access_token
      return data
    }, (2 * 60 * 60 * 1000) - 5000)
  }

  async job(num?: number) {
    num = num || 1
    // tslint:disable-next-line: no-unused-expression
    new CronJob(`*/${num} * * * *`, async () => {
      // 每分钟更新日数据
      await this.gettoDayData()
    }, null, true, 'Asia/Shanghai')
    // tslint:disable-next-line: no-unused-expression
    new CronJob('0 0 */1 * *', async () => {
      // 更新每日数据
      await this.getStatusList()
      await this.getemployee()
      await this.gettoDayData()
    }, null, true, 'Asia/Shanghai')
    // tslint:disable-next-line: no-unused-expression
    new CronJob('0 0 * * */7', async () => {
      // 更新每周数据
      await this.getWeekData()
      // 离职员工信息
      this.cooldata.employee = await this.getemployee(this.cooldata.dimissionList)
    }, null, true, 'Asia/Shanghai')
    // tslint:disable-next-line: no-unused-expression
    new CronJob('0 0 */31 * *', async () => {
      // 更新每月数据
      await this.getMoonData()
      await this.getdimission()
      this.cooldata.employee = await this.getemployee(this.cooldata.dimissionList)
    }, null, true, 'Asia/Shanghai')
  }

  getDoubleIndex = (arr: { [x: string]: any; }, start: number, end: number) => {
    const temp = []
    for (let index = start; index < end; index++) {
      const element = arr[index]
      if (element === undefined) { continue }
      temp.push(element)
    }
    return temp
  }

  async getHoliday(year?: number) {
    year = year || Number(new Moment().format('YYYY').toString())
    let Ltemp = {}
    const { data } = await axios.get('http://tool.bitefu.net/jiari/?d=' + year)
    Ltemp = data[year]
    for (let ix = 1; ix < 13; ix++) {
      time(year, ix)
    }
    function time(year: any, month: any) {
      const tempTime = new Date(year, month, 0)
      const time = new Date()
      for (let i = 1; i <= tempTime.getDate(); i++) {
        time.setFullYear(year, month - 1, i)
        const day = time.getDay()
        if (day === 6) {
          Ltemp[(month < 10 ? '0' + month : month) + (i < 10 ? '0' + i : i)] = 6
        } else if (day === 0) {
          Ltemp[(month < 10 ? '0' + month : month) + (i < 10 ? '0' + i : i)] = 7
        }
      }
    }
    log('Holiday done')
    this.holidayData = Ltemp
    return Ltemp
  }
  destroy() {
    return null
  }
}

export default DDdata
