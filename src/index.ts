import axios from 'axios';
import {
  DDTonken
} from './index.interface';
const {log} = console;
const mainUrl = 'https://oapi.dingtalk.com';
// axios.get('https://pokeapi.co/api/v2/pokemon/ditto/').then((res) => {
//     log(res.data);
// });

class DDdata {
  private Key: string;
  private Secret: string;
  /**
   * 构建主要参数
   * @param {string} appKey
   * @param {string} appSecre
   */
  constructor(key: string, Secret: string) {
      this.Key = key;
      this.Secret = Secret;
  }

  async getAccessTonken(): Promise<DDTonken> {
    log(`access_token `);
    const {Key, Secret} = this;
    // const {data} = await axios(`${mainUrl}/gettoken?appkey=${Key}&appsecret=${Secret}`);
    const {data} = await axios(`https://pokeapi.co/api/v2/pokemon/ditto/`);
    log(data);
    return data;
  }
}
const dd = new DDdata('1233', '123123');
dd.getAccessTonken();
export default DDdata;
