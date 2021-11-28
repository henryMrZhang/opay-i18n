#! /usr/bin/env node
const { cac } = require('cac');
const { name, version } = require('../package.json');
const { exportExcel,setLostLanguageJsonValue } = require("./utils");
function exportcli() {
    const cli = cac('opay-i18n');
    cli
        .command('', 'opay国际化工具')
        .option('--export [export]', "输出语言差异化的excel")
        .option('--import [import]', "读取excel给json赋值")
        .action((options) => {
            if (options.export) {//引入的命令
                let exportParam = typeof options.export;
                let exportExcelName = exportParam !== 'boolean' ? options.export : name
                exportExcel(exportExcelName);
            } else if (options.import) {
                let importParam = typeof options.import;
                let importExcelName = importParam !== 'boolean' ? options.import : name
                setLostLanguageJsonValue(importExcelName);
            }
        })

    cli.help()
    cli.version(version)
    cli.parse()
}
exportcli();