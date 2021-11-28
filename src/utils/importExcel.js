
const fse = require('fs-extra');
const glob = require('glob');
const xlsx = require('xlsx');
const { getFlatJsonByLang, getFileRelativePathForDotSplit } = require("./common");
// 读取excel文件，转化为json
function parseExceltoJSON(excelName) {
    var workbook = xlsx.readFile(`${excelName}.xlsx`);
    var first_sheet_name = workbook.SheetNames[0];
    var worksheet = workbook.Sheets[first_sheet_name];
    let data = []
    data = xlsx.utils.sheet_to_json(worksheet);
    return data;
}
// 循环excel输出的data,得到每个语言包的缺失data，平铺json
function getAllLostLanguageValueJson(lanKey, excelName) {
    let datas = parseExceltoJSON(excelName);
    let thisjson = {};
    datas.forEach((e) => {
        thisjson[e.key] = e[lanKey]
    })
    return thisjson;
}
/*
* @entries 需要解析的json对象
* @initValue 根据平铺输出树形json  平铺转树形
*/
function parseLayJsonToTree(entries, initValue = {}) {
    Object.entries(entries).forEach(([keys, value]) => {
        let items = keys;
        let index = items.indexOf('.');
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
* @alldata 所有的平铺json
* @key  搜索的关键词
* @return 输出树形json
*/
function findRouteJsonFromExcelJson(alldata, key) {
    let thisfilejson = {};
    Object.keys(alldata).forEach(jsonkey => {
        let keyIndex = jsonkey.indexOf(key);
        if (keyIndex !== -1) {
            let newkeys = jsonkey.slice(key.length + 1);
            thisfilejson[newkeys] = alldata[jsonkey]
        }
    })
    let treejson = parseLayJsonToTree(thisfilejson);
    return treejson
}
/**
 * 根据路径写入json
 * @languageDir 目标语言文件夹语言
 * @zhCNSchema 中文的所有平铺json
 * @filePath 一个完整的路径
 */
function writeJsonFileByPath(languageDir,zhCNSchema,filePath) {
    let jsonFileRouteAndName = getFileRelativePathForDotSplit("zh-CN", filePath);
    let jsonFileRoute = jsonFileRouteAndName.split(".");
    let oj = jsonFileRoute.join(".");
    let thistreeJSON = findRouteJsonFromExcelJson(zhCNSchema, oj);
    let formattText = JSON.parse(JSON.stringify(thistreeJSON, null, 2));
    let trueRoute = jsonFileRoute.join("/");
    let jsonRoute = `./src/locales/lang/${languageDir}/${trueRoute}.json`;
    const options = { 
        spaces:2, 
        EOL:"\n", 
      }; 
    fse.outputJsonSync(jsonRoute, formattText,options);
}
/**
 * 设置缺失语言的value
 * @excelName 需要导入并解析的excel名字
 */
function setLostLanguageJsonValue(excelName) {
    let zhCNSchema = getFlatJsonByLang('zh-CN');
    fse.readdirSync('./src/locales/lang').forEach(languageDir => {
        if (languageDir !== "zh-CN") {
            let languageJSON = getFlatJsonByLang(languageDir);
            let lostJson = getAllLostLanguageValueJson(languageDir, excelName);
            let allHasValObjJson = Object.assign(languageJSON, lostJson);
            Object.keys(zhCNSchema).forEach((key) => {
                zhCNSchema[key] = allHasValObjJson[key]
            })
            const filePathList = glob.sync(`./src/locales/lang/zh-CN/**/*.json`);
            filePathList.forEach(filePath => {
                writeJsonFileByPath(languageDir,zhCNSchema,filePath)
            })
        }
    })
    console.log('导入excel成功');
}
module.exports = {
    setLostLanguageJsonValue
}
