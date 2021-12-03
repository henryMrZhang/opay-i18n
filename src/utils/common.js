const fse = require("fs-extra");
const glob = require("glob");
/**
 * 拍平嵌套的JSON
 * @param {*} nestedJson 嵌套JSON
 * @returns 拍平后的数据
 * @example
 * const result = flattenJson({ a: 1, b: { c: 2 } })
 * => { a: 1, b.c : 2 }
 */
function getFlatNestedObj(nestedJson) {
  const result = {};
  function fn(obj, prefix) {
    for (key in obj) {
      let fullKey = prefix ? prefix + "." + key : key;
      if (typeof obj[key] === "object") {
        fn(obj[key], fullKey);
      } else {
        result[fullKey] = obj[key];
      }
    }
  }
  fn(nestedJson);
  return result;
}
/**
 * 根据语言码获取某语言的路径与数据的映射
 * @param {String} lang 语言码
 * @return 文件路径与JSON内容组成的Map
 * @example
 * const result = getPathJsonMapByLang('zh-CN')
 * => { './src/locales/lang/zh-CN/demo.json': { a: 1, b: { c: 2 } } }
 */
function getPathJsonMapByLang(lang) {
  const result = {};
  const filePathList = glob.sync(`./src/locales/lang/${lang}/**/*.json`);
  filePathList.forEach((filePath) => {
    const fileJson = fse.readJsonSync(filePath);
    result[filePath] = fileJson;
  });
  return result;
}
/**
 * 获取某语言的所有文件的拍平数据
 * @ param {String} lang 语言码
 * @ returns 所有文件的拍平数据
 */
function getFlatJsonByLang(lang) {
  const result = {};
  const pathJsonMap = getPathJsonMapByLang(lang);
  for (let path in pathJsonMap) {
    const fileRelativePathForDotSplit = getFileRelativePathForDotSplit(
      lang,
      path
    );
    const flatNestedObj = getFlatNestedObj(pathJsonMap[path]);
    for (let key in flatNestedObj) {
      if (flatNestedObj[key] !== "") {
        result[`${fileRelativePathForDotSplit}.${key}`] = flatNestedObj[key];
      }
    }
  }
  return result;
}
/**
 * 根据语言获取文件相对路径按点分割
 * @param {String} lang 语言码
 * @param {String} filePath 文件路径
 * @return 相对路径
 * @example
 * const result = getFileRelativePathForDotSplit('zh-CN', './src/locales/lang/zh-CN/a/b.json')
 * => a.b
 */
function getFileRelativePathForDotSplit(lang, filePath) {
  const result = filePath
    .replace(`./src/locales/lang/${lang}/`, "")
    .replace(".json", "")
    .replace(/\//g, ".");
  return result;
}
/**
 * 获取数组差集
 * @param {Array} allArray 全集数组
 * @param {Array} partArray 部分数组
 * @example
 * const result = getArrayDifference([1,2], [1])
 * => [2]
 * @returns 差集数据
 */
function getDifferenceData(allArray, partArray) {
  const result = allArray.filter((item) => !partArray.includes(item));
  return result;
}
module.exports = {
  getFlatNestedObj,
  getFlatJsonByLang,
  getFileRelativePathForDotSplit,
  getDifferenceData,
};
