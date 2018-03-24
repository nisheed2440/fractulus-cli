const chalk = require('chalk');
const logSymbols = require('log-symbols');
const CliNamespace = 'Fractulus CLI';
const LogMap = {
    error: {
        color: 'red',
        icon: logSymbols.error,
        prefix: 'ERROR',
        exit: true
    },
    warn: {
        color: 'yellow',
        icon: logSymbols.warning,
        prefix: 'WARNING'
    },
    success: {
        color: 'green',
        icon: logSymbols.success,
        prefix: 'SUCCESS'
    },
    info: {
        color: 'blueBright',
        icon: logSymbols.info,
        prefix: 'INFO'
    }
};
class Logger {
    constructor() {
        this.chalk = chalk;
    }
    colorLog(obj) {
        return this.chalk[obj.color] ? this.chalk[obj.color] : this.chalk.white;
    }
    getTxtProp(obj, prop) {
        return obj[prop] ? `${obj[prop]} ` : ``;
    }
    logger(type = 'default', msg = '') {
        const obj = LogMap[type] || {};
        const prefix = `${this.getTxtProp(obj, 'icon')}${this.getTxtProp(obj, 'prefix')}::${CliNamespace}::`;
        if (msg) {
            console.log(this.colorLog(obj)(`${this.chalk.bold(prefix)} ${msg}`));
            if (obj.exit) {
                process.exit(1);
            }
        } else {
            this.logger('error', `Logger: Needs a 'msg' parameter!`);
        }
    }
    log() {
        if(arguments.length > 1) {
            this.logger(arguments[0], arguments[1]);
        } else {
            this.logger(null, arguments[0]);
        }
    }
}

module.exports = Logger;