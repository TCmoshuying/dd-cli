import axios from 'axios';
import * as redis from 'redis';
import * as fs from 'fs';
import config from '../config/config';
import {
  DDTonken
} from './index.interface';
import { delDir } from './tool';
const { log } = console;
const mainUrl = config.mainUrl;
class DDdata {
  private Key: string;
  private Secret: string;
  private data = {
    userIdList: [],
    employee: []
  };
  private cooldata = {
    dimissionList: [],
    employee:  []
  };
  private check = {
    userIdListLength: 1,
    dimissionListLength: 1
  };
  private AccessToken: string;
  private client ;
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string) {
    this.Key = key;
    this.Secret = Secret;
    this.unlock();

    // this.refreshen();
    // this.getAccessTonken();
  }
  async refreshen() {
    this.getToken();
    setTimeout(() => {
    this.getStatusList();
    // this.getdimission();
    const check =  setInterval(() => {
        // if (this.data.userIdList.length >= this.check.userIdListLength ) {
          this.getemployee(this.data.userIdList, this.data.employee, 200);
          // this.getemployee(200, this.cooldata.dimissionList, this.cooldata.employee);
          clearInterval(check);
        // }
      }, 200);
   }, 1600);
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
    const filePath = './lib/lock/StatusList.lock';
    // if (fs.existsSync(filePath)) {
    //   log('已缓存用户列表');
    //   return true;
    // }
    speed = speed || 200;
    sizeis = sizeis || 20;
    offsetis = offsetis || 0;
    Substate = Substate || '2,3,5,-1';
    token = token || this.AccessToken;
    keyName = keyName || 'statusList';
    const userIdList = new Array();
    const statusList = setInterval(async () => {
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`,
        data: {status_list: Substate, offset: offsetis, size: sizeis}
      });
      offsetis = data.result.next_cursor;
      if (data.result.next_cursor !== undefined) {
        this.RedisCli();
        data.result.data_list.forEach((el: any) => {
          userIdList.push(el);
          this.client.sadd(keyName, el);
        });
        this.RedisCli(true);
        // log('StatusList updataing now is ' + offsetis);
      } else {
        fs.writeFile(filePath, '123', (err) => {if (err) {log(err); }});
        this.data.userIdList = userIdList;
        log('StatusList done');
        clearInterval(statusList);
      }
    }, speed);
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
    const filePath = './lib/lock/dimission.lock';
    // if (fs.existsSync(filePath)) {
    //   log('已缓存用户信息');
    //   return;
    // }
    speed = speed || 200;
    sizeis = sizeis || 50;
    offsetis = offsetis || 0;
    token = token || this.AccessToken;
    keyName = keyName || 'dimission';
    const dimissionList = this.data.userIdList;
    const getdimissionList = setInterval(async () => {
      const {data} = await axios({
        method: 'post',
        url: `${mainUrl}/topapi/smartwork/hrm/employee/querydimission?access_token=${token}`,
        data: {offset: offsetis, size: sizeis}
      });
      offsetis = data.result.next_cursor;
      if (data.result.next_cursor !== undefined) {
        data.result.data_list.forEach((el: any) => {
          dimissionList.push(el);
        });
        // log('dimissionList updataing now is ' + offsetis);
      } else {
        fs.writeFile(filePath, '123', (err) => {if (err) {log(err); }});
        this.cooldata.dimissionList = dimissionList;
        log('dimissionList done');
        clearInterval(getdimissionList);
      }
    }, speed);
  }

  async getemployee( list?: { [x: string]: any; }, redata?: { [x: string]: any; }, speed?: number, token?: string, keyName?: string) {
    const filePath = './lib/lock/employee.lock';
    const client = redis.createClient(config.redisPort, config.redisHost);
    client.smembers('statusList', (err, res) => {
      if (err) {log(err); }
      log(res);
    });
    // speed = speed || 200;
    // token = token || this.AccessToken;
    // // list = list || this.data.userIdList;
    // list = list || await this.client.smembers('statusList');
    // redata = redata || this.data.employee;
    // const fieldFilter = 'sys00-name,sys00-dept,sys00-position';
    // const employeeList = [];
    // let querix = 0;
    // const getemployeeInfo = setInterval(() => {
    //   axios({
    //     method: 'post',
    //     url: `${mainUrl}/topapi/smartwork/hrm/employee/list?access_token=${token}`,
    //     data: {
    //       userid_list: list[querix],
    //       field_filter_list : fieldFilter,
    //     }
    //   }).then((res) => {
    //     const data = res.data;
    //     redata.push({
    //       name: data.result[0].field_list[0].value,
    //       userid: data.result[0].userid,
    //       branch: data.result[0].field_list[3].value,
    //       place: data.result[0].field_list[1].value
    //       });
    //     log(data.result[0].field_list[0].value + ':employeeLists is updata');
    //   });
    //   querix++;
    //   if (querix === list.length) {
    //     clearInterval(getemployeeInfo);
    //   }
    // }, speed);
  }

  async getSimpleGroups(token: any) {
    const { data } = await axios(
      `${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`);
    if (data) { log(`SimpleGroups is updata`); }
    log(data);
    return data;
  }

  RedisCli(lock?: boolean) {
    lock = lock || false;
    if (lock) {
      return this.client.quit();
    } else {
      return this.client = redis.createClient(config.redisPort, config.redisHost);
    }
  }
  /**
   * 立即获取秘钥并保存在对象中
   */
  async getToken() {
    const { Key, Secret } = this;
    const { data } = await axios(
    `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`);
    if (data.access_token) { log(`access_token is updata`); } else {
      throw new Error('秘钥请求失败, 请检查秘钥或网络');
    }
    this.AccessToken = data.access_token;
    return data.access_token;
  }
  /**
   * 每(两小时-5s)获取一次token,对象被创建时即被引用
   */
  async getAccessTonken() { // : Promise < DDTonken >
    setInterval(async () => {
      const { Key, Secret } = this;
      const { data } = await axios(
        `${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`);
      if (data.access_token) { log(`access_token is updata`); } else {throw new Error('秘钥请求失败, 请检查秘钥或网络'); }
      this.AccessToken = data.access_token;
      return data;
    }, (2 * 60 * 60 * 1000) - 5000);
  }
  unlock() {
    delDir('./lib/lock/');
  }
  destroy() {
    return null;
  }
}

const dd = new DDdata(config.appkey, config.appsecret);
// setTimeout(async () => { log(await dd.getStatusList()); }, 200);
// export default DDdata;
