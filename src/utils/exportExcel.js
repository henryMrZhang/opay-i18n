const fse = require("fs-extra");
const xlsx = require("xlsx");
const { getFlatJsonByLang, getDifferenceData } = require("./common");
/**
 * 根据confi.json文件获取语言在excel的输出顺序
 * @returns 所有语言的排序数组
 * @example
 */
function findAllLanguageRankByConfig() {
  const { jsonKeys } = require("../config.json");
  let rankLanguageArr = [];
  let truefile = jsonKeys.filter((e) => e["key"] !== "key");
  truefile.forEach((route) => {
    rankLanguageArr.push(route["key"]);
    let file = `./src/locales/lang/${route["key"]}`;
    fse.ensureDirSync(file); //没有就创建文件夹，有不改变
  });
  return rankLanguageArr;
}
/**
 * 生成Excel数据
 */
function generateExcelData() {
  const LANG_LIST = findAllLanguageRankByConfig();
  const langData = {};
  const langKeyList = LANG_LIST.map((lang) => {
    const flatJsonByLang = getFlatJsonByLang(lang);
    langData[lang] = flatJsonByLang;
    return Object.keys(flatJsonByLang);
  });
  const zhKeyList = langKeyList[0];
  let missKeyList = [];
  langKeyList.slice(1).forEach((item) => {
    missKeyList = missKeyList.concat(getDifferenceData(zhKeyList, item));
  });
  missKeyList = Array.from(new Set(missKeyList)); //去重
  const excelData = missKeyList.map((key) => {
    const obj = { key };
    LANG_LIST.forEach((lang) => {
      obj[lang] = langData[lang][key] || "";
    });
    return obj;
  });
  return excelData;
}
/**
 * 根据json数组生成excel
 * @param {String} excelName excel名
 */
function exportExcel(excelName) {
  const excelJsonData = generateExcelData();
  let ss = xlsx.utils.json_to_sheet(excelJsonData);
  let workbook = {
    SheetNames: ["sheet"],
    Sheets: {
      sheet: Object.assign({}, ss),
    },
  };
  xlsx.writeFile(workbook, `${excelName}.xlsx`);
  console.log("导出excel文件成功");
}
module.exports = {
  exportExcel,
};
