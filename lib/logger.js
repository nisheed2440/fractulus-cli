const chalk = require('chalk');
const logSymbols = require('log-symbols');
/**
 * The namespace that shows up in the logger
 */
const CliNamespace = 'Fractulus CLI';
/**
 * A hash map of all the log types available
 * Any type that does not exist returns plain white text
 */
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
/** Class representing all the logging functions */
class Logger {
    /**
     * The Logger class constructor function
     */
    constructor() {
        this.chalk = chalk;
    }
    /**
     * Function to return the chalk color based on the log type object
     * @param {Object} obj The log type object
     * @returns {function} The associated chal color function
     */
    colorLog(obj) {
        return this.chalk[obj.color] ? this.chalk[obj.color] : this.chalk.white;
    }
    /**
     * Functiont to get text based properties from the log type object
     * @param {Object} obj the log type object
     * @param {String} prop the object property to be retrieved
     * @returns {string} The value of the queried property
     */
    getTxtProp(obj, prop) {
        return obj[prop] ? `${obj[prop]} ` : ``;
    }
    /**
     * Function to log out messages optionally exiting process when type is 'error'
     * @param {String} type The log type string
     * @param {String} msg The log message string 
     */
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
    /**
     * Wrapper function over "logger" for cleaner implementation
     * TBD: Usage
     */
    log() {
        if(arguments.length > 1) {
            this.logger(arguments[0], arguments[1]);
        } else {
            this.logger(null, arguments[0]);
        }
    }
}

module.exports = Logger;