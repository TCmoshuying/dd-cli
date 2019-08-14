import axios from 'axios';
import config from '../config/config';
import {
  DDTonken
} from './index.interface';
const { log } = console;
const mainUrl = config.mainUrl;

class DDdata {
  private Key: string;
  private Secret: string;
  private freshen: string;
  private data = {
    userIdList: [],
  };
  private check = {
    userIdListLength: 1,
  };
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string) {
    this.Key = key;
    this.Secret = Secret;
    this.refreshen();
  }
  async refreshen() {
    this.getStatusList();
    const check =  setInterval(() => {
      if (this.data.userIdList.length >= this.check.userIdListLength ) {
        log('ok');
        clearInterval(check);
      }
    }, 200);
  }

  async getStatusList(speed ?: number, Substate ?: string, offsetis ?: number, sizeis ?: number, token ?: string) {
    sizeis = sizeis || 20;
    speed = speed || 200;
    offsetis = offsetis || 0;
    Substate = Substate || '2,3,5,-1';
    token = token || (await this.getToken());
    const userIdList = new Array();
    const statusList = setInterval(async () => {
      const { data } = await axios({
        method: 'post',
        url: `${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`,
        data: {status_list: Substate, offset: offsetis, size: sizeis}
      });
      if (data.result.next_cursor !== undefined) {
        data.result.data_list.forEach((el: any) => {
          userIdList.push(el);
        });
        offsetis = data.result.next_cursor;
        log('StatusList updataing now is ' + offsetis);
      } else {
        log('StatusList done');
        this.data.userIdList = userIdList;
        clearInterval(statusList);
        return true;
      }
    }, speed);
  }
  async getSimpleGroups(token) {
    const { data } = await axios(`${mainUrl}/topapi/smartwork/hrm/employee/queryonjob?access_token=${token}`);
    if (data) { log(`SimpleGroups is updata`); }
    log(data);
    return data;
  }
  async getToken() {
    const { Key, Secret } = this;
    const { data } = await axios(`${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`);
    if (data) { log(`access_token is updata`); }
    return data.access_token;
  }
  async getAccessTonken(): Promise < DDTonken > {
    const { Key, Secret } = this;
    const { data } = await axios(`${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`);
    if (data) { log(`access_token is updata`); }
    return data;
  }
}

const dd = new DDdata(config.appkey, config.appsecret);
// setTimeout(async () => { log(await dd.getStatusList()); }, 200);
export default DDdata;
