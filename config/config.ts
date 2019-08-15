import min from './min'
export  default {
  appkey: min.appkey, // 钉钉h5的apopkey
  appsecret: min.appsecret, // 钉钉h5的appsecret
  mainUrl: min.mainUrl, // 钉钉的后台api链接
  // listen: 80, // 开启服务器时的监听地址,建议80
  updateAccessTokenTime: (2 * 3600 * 1000) - 2000, // AccessTonken更新时间,最好小于2小时
  updateUserListTime: (24 * 3600 * 1000), // 员工数据更新时间,固定设置为24小时,每日零点更新
  redis:{
    Port: 6379,
    Host: '127.0.0.1',
  },
  functiondone:' done',
  apiList:{
    getStatusList:{
      url:'topapi/smartwork/hrm/employee/queryonjob?access_token=',
      status_list:'2,3,5,-1',
      keyName:'StatusList'
    },
    getemployee:{
      url:'topapi/smartwork/hrm/employee/list?access_token=',
      keyName:'employee',
      fieldFilter:'sys00-name,sys00-dept,sys00-position'
    },
    getdimission:{
      url:'topapi/smartwork/hrm/employee/querydimission?access_token=',
      keyName:'dimission'
    },
    gettoDayData:{
      url:'attendance/list?access_token='
    }
  },
  loggerConfig1: {
    'appenders': {
      'consoleout': { 'type': 'console' },
      'fileout': { 'type': 'file', 'filename': 'src/log/log.log', 'layout': { 'type': 'pattern', 'pattern': '[%d] [%p] %c [%1]-%f{1} %m' }}
    },
    'categories': {
      'default': { 'appenders': ['consoleout', 'fileout'], 'level': 'debug' }
    }
  }
}
