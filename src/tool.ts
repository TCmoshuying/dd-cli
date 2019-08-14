import * as fs from 'fs'
const {log} = console
export const getDoubleIndex = (arr: { [x: string]: any; }, start: number, end: number) => {
  const temp = []
  for (let index = start; index < end; index++) {
    const element = arr[index]
    if (element === undefined) { continue }
    temp.push(element)
  }
  return temp
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
// export default{
//   delPath,
//   getDoubleIndex
// };
