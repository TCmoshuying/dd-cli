import axios from 'axios'
import * as redis from 'redis'
import config from '../config/config'
import {
  DDTonken
} from './index.interface'
import { delDir, checkDirExist, getDoubleIndex } from './tool'
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
    employee:  []
  }
  private check = {
    userIdListLength: 1,
    dimissionListLength: 1
  }
  private AccessToken: string
  private client = redis.createClient(config.redisPort, config.redisHost)
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string) {
    this.Key = key
    this.Secret = Secret
    // this.client = this.RedisCli();
    // this.client.quit();
    // this.unlock();
    this.refreshen()
    // this.getAccessTonken();
  }
  async refreshen() {
    this.getToken()
    setTimeout(() => {
    this.getStatusList()
    this.getdimission()
    setTimeout(() => {
      this.setStatusList('statusList')
      this.setdimission('dimission')
    }, 2500)
    setTimeout(() => {
      this.getemployee(this.data.userIdList, this.data.employee)
    }, 2700)
    // const check =  setInterval(() => {
    //   this.setStatusList('statusList')
    //   this.setdimission('dimission')
    //   if (this.data.userIdList.length >= this.check.userIdListLength ) {
    //       // this.getemployee(this.data.userIdList, this.data.employee, 200);
    //       // this.getemployee(200, this.cooldata.dimissionList, this.cooldata.employee);
    //   clearInterval(check)
    //     }
    //   }, 500)
   }, 400)
  }
  /**
   * 获取在职员工id信息
   * @param speed 获取速度
   * @param Substate 员工子状态
   * @param offsetis 分页值,默认从0开始
   * @param sizeis 单页数据大小
   * @param token 秘钥
   */
  async getStatusList(speed ?: number, Substate ?: string, offsetis ?: string|number,
                      sizeis ?: string|number, token ?: string, keyName?: string) {
    speed = speed || 200
    sizeis = sizeis || 20
    offsetis = offsetis || 0
    keyName = keyName || 'statusList'
    Substate = Substate || config.apiList.status_list
    token = token || this.AccessToken
    const userIdList = new Array()
    const Lclient = this.client
    // this.data.userIdList
    this.client.smembers(keyName, (err, res) => {
      if (err) {log(err) }
      // 如果之前存过数据
      if (res.length >= 1) {
        this.client.del(keyName, (err, res) => {
          if (err) { log(err) }
          start()
        })
      } else {
        start()
      }
      function start() {
        const statusList = setInterval(async () => {
          const { data } = await axios({
            method: 'post',
            url: `${mainUrl}${config.apiList.getStatusList}${token}`,
            data: {status_list: Substate, offset: offsetis, size: sizeis}
          })
          offsetis = data.result.next_cursor
          if (data.result.next_cursor !== undefined) {
            data.result.data_list.forEach((el: any) => {
              userIdList.push(el)
              Lclient.sadd(keyName, el)
            })
          } else {
            log(keyName + config.functiondone)
            clearInterval(statusList)
            // return userIdList;
          }
        }, speed)
      }
    })
  }

  setStatusList(keyName: string) {
    this.client.smembers(keyName, (err, res) => {
      if (err) {log(err) }
      this.data.userIdList = res
    })
  }
  /**
   * 获取离职员工id信息
   * @param speed 获取速度
   * @param offsetis 分页值
   * @param sizeis 单词取得数据大小
   * @param token 秘钥
   */
  async getdimission(speed?: number, offsetis ?: string|number,
                     sizeis ?: string|number, token?: string, keyName?: string) {
    speed = speed || 200
    sizeis = sizeis || 50
    offsetis = offsetis || 0
    token = token || this.AccessToken
    keyName = keyName || 'dimission'
    const dimissionList = this.data.userIdList
    const Lclient = this.client
    this.client.smembers(keyName, (err, res) => {
      if (err) { log(err) }
      if (res.length >= 1) {
        this.client.del(keyName, (err, res) => {
          if (err) {log(err) }
          start()
        })
      } else {
        start()
      }
    })
    function start() {
      const getdimissionList = setInterval(async () => {
        const {data} = await axios({
          method: 'post',
          url: `${mainUrl}/topapi/smartwork/hrm/employee/querydimission?access_token=${token}`,
          data: {offset: offsetis, size: sizeis}
        })
        offsetis = data.result.next_cursor
        if (data.result.next_cursor !== undefined) {
          data.result.data_list.forEach((el: any) => {
            dimissionList.push(el)
            Lclient.sadd(keyName, el)
          })
        } else {
          log(keyName + config.functiondone)
          clearInterval(getdimissionList)
        }
      }, speed)
    }
  }
  setdimission(keyName: string) {
    this.client.smembers(keyName, (err, res) => {
      if (err) {log(err) }
      this.cooldata.dimissionList = res
    })
  }

  async getemployee( list ?: { [x: string]: any; }, redata ?: { [x: string]: any; },
                     speed ?: number, token ?: string, keyName ?: string) {
    speed = speed || 200
    keyName = keyName || 'employee'
    token = token || this.AccessToken
    list = list || this.data.userIdList
    const fieldFilter = config.apiList.fieldFilter
    const Lclient = this.client
    this.client.smembers(keyName, (err, res) => {
      if (err) {log(err) }
      log(list.length)
      log(res.length)
      if (res.length === list.length ) { return }
      // if (res.length >= 1 && res.length < list.length) {
      //   this.client.del(keyName, (err, res) => {
      //     if (err) {log(err) }
      //     start()
      //   })
      // } else {
      //   start()
      // }
    })
    function start() {
      let querix = 0
      const getemployeeInfo = setInterval(() => {
        axios({
          method: 'post',
          url: `${mainUrl}/topapi/smartwork/hrm/employee/list?access_token=${token}`,
          data: {
            userid_list: list[querix],
            field_filter_list : fieldFilter,
          }
        }).then((res) => {
          const data = res.data
          const pushData = {
            name: data.result[0].field_list[0].value,
            userid: data.result[0].userid,
            branch: data.result[0].field_list[3].value,
            place: data.result[0].field_list[1].value
          }
          Lclient.sadd(keyName, JSON.stringify(pushData))
          log(data.result[0].field_list[0].value + ':employeeLists is updata')
        })
        querix++
        if (querix === list.length) {
          clearInterval(getemployeeInfo)
        }
      }, speed)
    }
  }

  async getSimpleGroups(token: any) {
    const { data } = await axios(
      `${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`)
    if (data) { log(`SimpleGroups is updata`) }
    log(data)
    return data
  }

RedisCli(lock ?: boolean) {
    lock = lock || true
    return redis.createClient(config.redisPort, config.redisHost)
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
      if (data.access_token) { log(`access_token is updata`) } else {throw new Error('秘钥请求失败, 请检查秘钥或网络') }
      this.AccessToken = data.access_token
      return data
    }, (2 * 60 * 60 * 1000) - 5000)
  }
  // reRedisSmembersKey(keyName, data) {
  //   this.client.smembers(keyName, (err, res) => {
  //     if (err) {log(err); }
  //     data = res;
  //   });
  // }
  unlock() {
      delDir('./lib/lock/')
    }
  destroy() {
      return null
    }
}

const dd = new DDdata(config.appkey, config.appsecret)
// setTimeout(async () => { log(await dd.getStatusList()); }, 200);
// export default DDdata;
