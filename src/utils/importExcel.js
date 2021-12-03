const fse = require("fs-extra");
const glob = require("glob");
const xlsx = require("xlsx");
const {
  getFlatJsonByLang,
  getFileRelativePathForDotSplit,
} = require("./common");

/**
 * 读取excel文件，转化为json
 * @param {*} excelName
 * @returns excel转化的json
 * @example
 * const result = parseExceltoJSON('i18n');
 * => [{ "key": a.b.c, "zh-CN" : 登录，"en-US" : "login" }]
 */
function parseExceltoJSON(excelName) {
  let workbook = xlsx.readFile(`${excelName}.xlsx`);
  let first_sheet_name = workbook.SheetNames[0];
  let worksheet = workbook.Sheets[first_sheet_name];
  let result = [];
  result = xlsx.utils.sheet_to_json(worksheet);
  return result;
}
/**
 * 循环excel输出的data,得到每个语言包的缺失data，平铺json
 * @param {*} lanKey 语言的整个文件夹目录
 * @param {*} excelName 读取的excel名字
 * @returns 每个语言包的缺失数据，平铺json
 * @example
 * const lostJson = getAllLostLanguageValueJson(languageDir, excelName);
 * =>{login.login.register:"注册"}
 */
function getAllLostLanguageValueJson(lanKey, excelName) {
  let excelJsonData = parseExceltoJSON(excelName);
  let result = {};
  excelJsonData.forEach((e) => {
    result[e.key] = e[lanKey];
  });
  return result;
}

/**
 * 平铺json解析为树形结构
 * @param {*} entries 需要解析的json对象
 * @param {*} initValue 根据平铺输出树形json
 * @returns 树形json
 * @example
 * const result = parseLayJsonToTree({a.b.c:login})
 * =>{a:{b:{c:"login"}}}
 */
function parseLayJsonToTree(entries, initValue = {}) {
  Object.entries(entries).forEach(([keys, value]) => {
    let items = keys;
    let index = items.indexOf(".");
    if (index > -1) {
      let key = items.substring(0, index);
      let newKey = items.substring(index + 1);
      initValue[key] = parseLayJsonToTree({ [newKey]: value }, initValue[key]);
    } else {
      initValue[items] = value;
    }
  });
  return initValue;
}
/**
 * 根据文件路径找出该路径下的树形json,并输出
 * @param {*} allData 所有的平铺json
 * @param {*} key 搜索的关键词
 * @return 输出树形json
 * @example
 * const findRouteJsonFromExcelJson({a.b.c:login})
 * {a:{b:{c:"login"}}}
 */
function findRouteJsonFromExcelJson(allData, key) {
  let thisfilejson = {};
  Object.keys(allData).forEach((jsonkey) => {
    let keyIndex = jsonkey.indexOf(key);
    if (keyIndex !== -1) {
      let newkeys = jsonkey.slice(key.length + 1);
      thisfilejson[newkeys] = allData[jsonkey];
    }
  });
  let treejson = parseLayJsonToTree(thisfilejson);
  return treejson;
}
/**
 * 根据路径写入json
 * @param {*} languageDir 目标语言文件夹语言
 * @param {*} zhCNSchema 中文的所有平铺json
 * @param {*} filePath 一个完整的路径
 */
function writeJsonFileByPath(languageDir, zhCNSchema, filePath) {
  let jsonFileRouteAndName = getFileRelativePathForDotSplit("zh-CN", filePath);
  let jsonFileRoute = jsonFileRouteAndName.split(".");
  let routeKey = jsonFileRoute.join(".");
  let fileTreeJson = findRouteJsonFromExcelJson(zhCNSchema, routeKey);
  let formatJson = JSON.parse(JSON.stringify(fileTreeJson, null, 2));
  let jsonFileName = jsonFileRoute.join("/");
  let jsonRoute = `./src/locales/lang/${languageDir}/${jsonFileName}.json`;
  const jsonFormatOptions = {
    spaces: 2,
    EOL: "\n",
  };
  fse.outputJsonSync(jsonRoute, formatJson, jsonFormatOptions);
}
/**
 * 设置缺失语言的value,并写入json
 * @param {*} excelName 需要导入并解析的excel名字
 */
function setLostLanguageJsonValue(excelName) {
  let zhCNSchema = getFlatJsonByLang("zh-CN");
  fse.readdirSync("./src/locales/lang").forEach((languageDir) => {
    if (languageDir !== "zh-CN") {
      let languageJSON = getFlatJsonByLang(languageDir);
      let lostJson = getAllLostLanguageValueJson(languageDir, excelName);
      let allHasValObjJson = Object.assign(languageJSON, lostJson);
      Object.keys(zhCNSchema).forEach((key) => {
        zhCNSchema[key] = allHasValObjJson[key];
      });
      const filePathList = glob.sync(`./src/locales/lang/zh-CN/**/*.json`);
      filePathList.forEach((filePath) => {
        writeJsonFileByPath(languageDir, zhCNSchema, filePath);
      });
    }
  });
  console.log("导入excel成功");
}
module.exports = {
  setLostLanguageJsonValue,
};
