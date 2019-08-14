import * as fs from 'fs';
const {log} = console;
export const getDoubleIndex = (arr: { [x: string]: any; }, start: number, end: number) => {
  const temp = [];
  for (let index = start; index < end; index++) {
    const element = arr[index];
    if (element === undefined) { continue; }
    temp.push(element);
  }
  return temp;
};
export const delDir = (path) => {
  let files = [];
  if (fs.existsSync(path)) {
      files = fs.readdirSync(path);
      files.forEach((file, index) => {
          const curPath = path + '/' + file;
          if (fs.statSync(curPath).isDirectory()) {
              delDir(curPath); // 递归删除文件夹
          } else {
              fs.unlinkSync(curPath); // 删除文件
          }
      });
      fs.rmdirSync(path);
  }
};
// delPath("./image/true");  //确认路径。__ 。没有后悔药
// export default{
//   delPath,
//   getDoubleIndex
// };
