import * as fs from 'fs'
import axios from 'axios'
const { log } = console
export const getDoubleIndex = (arr: { [x: string]: any; }, start: number, end: number) => {
  const temp = []
  for (let index = start; index < end; index++) {
    const element = arr[index]
    if (element === undefined) { continue }
    temp.push(element)
  }
  return temp
}
// 警告 奇怪的初始值
// const checkDate = new Date(el.baseCheckTime).toJSON().substring(5, 10).split('-')
// const month = Number(checkDate[0]) < 10 ? '0' + Number(checkDate[0]) : Number(checkDate[0])
// const day = Number(checkDate[1]) < 10 ? '0' + Number(checkDate[1]) : '' + Number(checkDate[1])
// this.holidayData[month + day] === undefined ? '0' : this.holidayData[month + day],
const getHoliday = async (year: number) => {
  let holidayData = {}
  const { data } = await axios.get('http://tool.bitefu.net/jiari/?d=' + year)
  holidayData = data[year]
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
        holidayData[(month < 10 ? '0' + month : month) + (i < 10 ? '0' + i : i)] = 6
      } else if (day === 0) {
        holidayData[(month < 10 ? '0' + month : month) + (i < 10 ? '0' + i : i)] = 7
      }
    }
  }
  return holidayData
}
export const delDir = (path) => {
  let files = []
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path)
    files.forEach((file, index) => {
      const curPath = path + '/' + file
      if (fs.statSync(curPath).isDirectory()) {
        delDir(curPath) // 递归删除文件夹
      } else {
        fs.unlinkSync(curPath) // 删除文件
      }
    })
    fs.rmdirSync(path)
  }
}
/**
 * 检查路径是否存在 如果不存在则创建路径
 * @param {string} folderpath 文件路径
 */
export const checkDirExist = (folderpath) => {
  const pathArr = folderpath.split('/')
  let path = ''
  for (const ix of pathArr) {
    if (ix) {
      path += `/${ix}`
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
      }
    }
  }
}
// delPath("./image/true");  //确认路径。__ 。没有后悔药

/**
 * 如果当前函数是有名函数，则返回其名字，
 * 如果是匿名函数则返回被赋值的函数变量名，
 * 如果是闭包中匿名函数则返回“anonymous”。
 * @param callee arguments.callee
 */
export const getFnName = (callee) => {
  let LCallee = callee.toString().replace(/[\s\?]*/g, '')
  const comb = LCallee.length >= 50 ? 50 : LCallee.length
  LCallee = LCallee.substring(0, comb)
  let name = LCallee.match(/^function([^\(]+?)\(/)
  if (name && name[1]) { return name[1] }
  const caller = callee.caller
  const Lcaller = caller.toString().replace(/[\s\?]*/g, '')
  const last = Lcaller.indexOf(LCallee)
  const str = Lcaller.substring(last - 30, last)
  name = str.match(/var([^\=]+?)\=/)
  if (name && name[1]) { return name[1] }
  return 'anonymous'
}

// 提取json对象下的所有key下的不同value
const filterValue = (Json, key) => {

}

export const shallowCopy = (src) => {
  const dst = {}
  for (const prop in src) {
    if (src.hasOwnProperty(prop)) {
      dst[prop] = src[prop]
    }
  }
  return dst
}

export const deepCopy = (target) => {
  let copyed_objs = []// 此数组解决了循环引用和相同引用的问题，它存放已经递归到的目标对象
  function _deepCopy(target) {
    if ((typeof target !== 'object') || !target) { return target }
    for (let i = 0; i < copyed_objs.length; i++) {
      if (copyed_objs[i].target === target) {
        return copyed_objs[i].copyTarget
      }
    }
    let obj = {}
    if (Array.isArray(target)) {
      obj = []// 处理target是数组的情况
    }
    copyed_objs.push({ target, copyTarget: obj })
    Object.keys(target).forEach(key => {
      if (obj[key]) { return }
      obj[key] = _deepCopy(target[key])
    })
    return obj
  }
  return _deepCopy(target)
}
