// import * as fs from 'fs'
import axios from 'axios'
// import * as redis from 'redis'
import config from '../config/config'
import {
  DDTonken
} from './index.interface'
import { getFnName, delDir, checkDirExist, getDoubleIndex } from './tool'
const { log } = console
const mainUrl = config.mainUrl
class DDdata {
  private Key: string
  private Secret: string
  private data = {
    userIdList: [],
    employee: []
  }
  private cooldata = {
    dimissionList: [],
    employee: []
  }
  private daliyData = []
  private check = {
    userIdListLength: 1,
    dimissionListLength: 1
  }
  private AccessToken: string
  // private client = redis.createClient(config.redis.Port, config.redis.Host)
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string) {
    this.Key = key
    this.Secret = Secret
    this.refreshen()
  }
  async refreshen() {
    // await this.clearRedis()
    await this.getToken()
    await this.getStatusList()
    await this.getdimission()
    await this.getemployee()
    if (this.data.employee.length === this.data.userIdList.length) {
      log('开始请求每日数据')
      await this.gettoDayData()
    }
  }
  /**
   * 获取在职员工id信息
   * @param speed 获取速度
   * @param Substate 员工子状态
   * @param offsetis 分页值,默认从0开始
   * @param sizeis 单页数据大小
   * @param token 秘钥
   */
  async getStatusList(Substate?: string, offsetis?: string | number, sizeis?: string | number, token?: string) {
    sizeis = sizeis || 20
    offsetis = offsetis || 0
    Substate = Substate || config.apiList.getStatusList.status_list
    token = token || this.AccessToken
    const userIdList = new Array()
    // const Lclient = this.client
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
          // Lclient.sadd(config.apiList.getStatusList.keyName, el)
        })
      } else {
        log(config.apiList.getStatusList.keyName + config.functiondone)
        this.data.userIdList = userIdList
        break
      }
    }
  }
  /**
   * 获取离职员工id信息
   * @param speed 获取速度
   * @param offsetis 分页值
   * @param sizeis 单词取得数据大小
   * @param token 秘钥
   */
  async getdimission(offsetis?: string | number, sizeis?: string | number, token?: string) {
    sizeis = sizeis || 50
    offsetis = offsetis || 0
    token = token || this.AccessToken
    const dimissionList = []
    // const Lclient = this.client
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
          // Lclient.sadd(config.apiList.getdimission.keyName, el)
        })
      } else {
        log(config.apiList.getdimission.keyName + config.functiondone)
        this.cooldata.dimissionList = dimissionList
        return true
        // break
      }
    }
  }
  /**
   * 返回员工部门职位,姓名和id信息
   * @param list 员工id列表
   * @param redata 返回数据,会被修改
   * @param token 秘钥
   */
  async getemployee(list?: { [x: string]: any; }, redata?: { [x: string]: any; }, token?: string) {
    token = token || this.AccessToken
    list = list || this.data.userIdList
    redata = redata || this.data.employee
    const api = config.apiList.getemployee
    const fieldFilter = api.fieldFilter
    // const Lclient = this.client
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
        log(data.result[0].field_list[0].value + ' ' + api.keyName + config.functiondone)
      }
    }
    return
  }
  async gettoDayData(offsetis?: number, limitis?: number, list?: any[], token?: string) {
    offsetis = offsetis || 0
    limitis = limitis || 50
    list = list || this.data.userIdList
    token = token || this.AccessToken
    const time = new Date().toJSON().substring(0, 10)
    const fromtime = time + ' 00:00:00'
    const totime = time + ' 23:59:59'
    let Ltemp = []
    let start = 0
    while (true) {
      const { data } = await axios({
        method: 'post',
        url: `${config.mainUrl}${config.apiList.gettoDayData.url}${token}`,
        data: {
          workDateFrom: fromtime,
          workDateTo: totime,
          // 员工在企业内的UserID列表，企业用来唯一标识用户的字段。最多不能超过50个
          userIdList: getDoubleIndex(list, start, start + 50),    // 必填，与offset和limit配合使用 
          offset: offsetis,    // 必填，第一次传0，如果还有多余数据，下次传之前的offset加上limit的值
          limit: limitis,     // 必填，表示数据条数，最大不能超过50条
        }
      })
      offsetis = limitis + offsetis
      data.recordresult.forEach((el:any)=>{
        const Lname = this.data.employee.find(Lelement => {
          if (Lelement.userid === el.userId)
            return { name: Lelement.name, branch: Lelement.branch }
        })
        let temp = {
          name: Lname.name,
          branch: Lname.branch,
          checkType: el.checkType,
          timeResult: el.timeResult,
          locationResult: el.locationResult,
          // baseCheckTime: el.baseCheckTime,
          userCheckTime: new Date(el.userCheckTime).toJSON()
        }
        Ltemp.push(temp)
      })
      if (!data.hasMore) { start += 50; offsetis = 0 }
      if (!data.hasMore && start > list.length) break
    }
    this.daliyData = Ltemp
    log(this.daliyData.length)
    return Ltemp
  }
  async getSimpleGroups(token: any) {
    const { data } = await axios(
      `${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`)
    if (data) { log(`SimpleGroups is updata`) }
    log(data)
    return data
  }

  /**
   * 立即获取秘钥并保存在对象中
   */
  async getToken() {
    const { Key, Secret } = this
    const { data } = await axios(
      `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`)
    if (data.access_token) { log(`access_token is updata`) } else {
      throw new Error('秘钥请求失败, 请检查秘钥或网络')
    }
    this.AccessToken = data.access_token
    return data.access_token
  }
  /**
   * 每(两小时-5s)获取一次token,对象被创建时即被引用
   */
  async getAccessTonken() { // : Promise < DDTonken >
    setInterval(async () => {
      const { Key, Secret } = this
      const { data } = await axios(
        `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`)
      if (data.access_token) { log(`access_token is updata`) } else { throw new Error('秘钥请求失败, 请检查秘钥或网络') }
      this.AccessToken = data.access_token
      return data
    }, (2 * 60 * 60 * 1000) - 5000)
  }
  // async clearRedis() {
  // const temp = await this.client.del(
  //     config.apiList.getStatusList.keyName,
  //     config.apiList.getdimission.keyName,
  //     config.apiList.getemployee.keyName)
  //   log(temp)
  //   return temp
  // }
  async redisOpen() {
    // return redis.createClient(config.redis.Port, config.redis.Host)
  }
  async redisClose() {
    // return this.client.quit()
  }
  destroy() {
    return null
  }
}

const dd = new DDdata(config.appkey, config.appsecret)
// setTimeout(async () => { log(await dd.getStatusList()); }, 200);
// export default DDdata;
