// import * as fs from 'fs'
import axios from 'axios'
// import * as redis from 'redis'
import config from '../config/config'
import {
  DDTonken
} from './index.interface'
import { getFnName, delDir, checkDirExist, getDoubleIndex } from './tool'
import { runInThisContext } from 'vm'
const { log } = console
const mainUrl = config.mainUrl
class DDdata {
  private Key: string
  private Secret: string
  public data = {
    userIdList: [],
    employee: []
  }
  public cooldata = {
    dimissionList: [],
    employee: []
  }
  public daliyData = []
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
    await this.gettoDayData()
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
        break
      }
    }
    return dimissionList
  }
  /**
   * 不传参时,函数默认调用在职(待离职也算)员工列表,并获取其id,姓名,职位,部门信息
   * @param list 员工id列表
   * @param redata 返回数据,会被修改
   * @param token 秘钥
   * @returns array 返回员工部门职位,姓名和id信息
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
        // log(data.result[0].field_list[0].value + ' ' + api.keyName + config.functiondone)
      }
    }
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
  async gettoDayData(offsetis?: number, limitis?: number, list?: any[], token?: string){
    offsetis = offsetis || 0
    limitis = limitis || 50
    list = list || this.data.userIdList
    token = token || this.AccessToken
    const time = new Date().toJSON().substring(0, 10)
    const fromtime = time + ' 00:00:00'
    const totime = time + ' 23:59:59'
    let Ltemp = []
    // while (true) {
    //   const { data } = await axios({
    //     method: 'post',
    //     url: `${config.mainUrl}${config.apiList.gettoDayData.url}${token}`,
    //     data: {
    //       workDateFrom: fromtime,
    //       workDateTo: totime,
    //       // 员工在企业内的UserID列表，企业用来唯一标识用户的字段。最多不能超过50个
    //       userIdList: getDoubleIndex(list, start, start + 50),    // 必填，与offset和limit配合使用 
    //       offset: offsetis,    // 必填，第一次传0，如果还有多余数据，下次传之前的offset加上limit的值
    //       limit: limitis,     // 必填，表示数据条数，最大不能超过50条
    //     }
    //   })
    //   offsetis = limitis + offsetis
    //   data.recordresult.forEach((el:any)=>{
    //     const Lname = this.data.employee.find(Lelement => {
    //       if (Lelement.userid === el.userId)
    //         return { name: Lelement.name, branch: Lelement.branch }
    //     })
    //     let temp = {
    //       name: Lname.name,
    //       branch: Lname.branch,
    //       checkType: el.checkType,
    //       timeResult: el.timeResult,
    //       locationResult: el.locationResult,
    //       baseCheckTime: el.baseCheckTime,
    //       sortTime:el.userCheckTime,
    //       userCheckTime: new Date(el.userCheckTime).toLocaleString()
    //     }
    //     Ltemp.push(temp)
    //   })
    //   if (!data.hasMore) { start += 50; offsetis = 0 }
    //   if (!data.hasMore && start > list.length) break
    // }
    this.daliyData = await this.getKaoqingLists(config.apiList.gettoDayData.keyName,this.data.employee,fromtime,totime)
    log(config.apiList.gettoDayData.keyName,config.functiondone)
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
   * 获取time1和time2之间的用户考勤信息,time1和time2最长间隔7天
   * @param useridList 用户id列表,查询考勤数据必填选项
   * @param employeeList 用户id与姓名,部门,职位等信息表,格式为数组对象[{name:name,branch:branch}]
   * @param time1 查询所需的开始时间
   * @param time2 查询所需的结束时间
   * @param apiUrl 请求的url这里似乎是固定的
   * @param offsetis 分页值,默认从0开始
   * @param limitis 单页数据大小,默认为50
   * @param start 用户id列表的查询起始值,默认从0开始
   * @param token 秘钥
   */
  async getKaoqingLists (useridList:any,employeeList:any[],time1:string, time2:string,apiUrl?:string,offsetis?:number,limitis?:number,start?:number,token?:string) {
    const Ltemp = []
    start = start || 0
    limitis = limitis || 50
    offsetis = offsetis || 0
    token = token || this.AccessToken
    apiUrl = apiUrl || config.apiList.getKaoqingLists.url
    while(true){
      const {data} = await axios({
        method:'post',
        url:`${mainUrl}${apiUrl}${token}`,
        data:{
          'workDateFrom': time1,
          'workDateTo': time2,
          'userIdList': getDoubleIndex(useridList, start, start + 50), // 必填，与offset和limit配合使用
          'offset': offsetis, // 必填，第一次传0，如果还有多余数据，下次传之前的offset加上limit的值
          'limit': limitis // 必填，表示数据条数，最大不能超过50条
        }
      })
      offsetis = offsetis + limitis
      data.recordresult.forEach((el:any)=>{
        const Lname = employeeList.find((Lelement:any) => {
          if (Lelement.userid === el.userId)
            return { name: Lelement.name, branch: Lelement.branch }
        })
        let temp = {
          name: Lname.name,
          branch: Lname.branch,
          checkType: el.checkType,
          timeResult: el.timeResult,
          locationResult: el.locationResult,
          baseCheckTime: el.baseCheckTime,
          sortTime:el.userCheckTime,
          userCheckTime: new Date(el.userCheckTime).toLocaleString()
        }
        Ltemp.push(temp)
      })
      if (!data.hasMore) { start += 50; offsetis = 0 }
      if (!data.hasMore && start > useridList.length) break
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
  
  destroy() {
    return null
  }
}

// const dd = new DDdata(config.appkey, config.appsecret)
// setTimeout(async () => { log(await dd.getStatusList()); }, 200);
export default DDdata;
