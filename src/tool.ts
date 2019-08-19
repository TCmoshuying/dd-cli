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
