const Logger = require('./logger');
const _ = require('lodash');
const nfs = require('fs');
const path = require('path');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const program = require('commander');
const inquirer = require('inquirer');
const slash = require('slash');
const pkg = require('../package.json');
const store = memFs.create();
const fs = editor.create(store);

const CliConfigFileName = '.fractulus-cli.json';
const WebpackConfigFileName = 'webpack.build.js';

class Utils extends Logger {
    constructor() {
        super();
        // Public Properties
        this._ = _;
        this.nfs = nfs;
        this.path = path;
        this.fs = fs;
        this.exec = exec;
        this.program = program;
        this.inquirer = inquirer;
        this.pkg = pkg;
        this.slash = slash;

        // Private properties
        this._cliRootFolder = null;
        this._destRootFolder = null;
        this._templatePaths = {};
    }
    setCliRootFolder(root) {
        this._cliRootFolder = root;
        return this.getCliRootFolder();
    }
    getCliRootFolder() {
        if (!this._cliRootFolder) {
            thie.logger('error', `Root path not found`);
        }
        return this._cliRootFolder;
    }
    setDestRootFolder(appName) {
        this._destRootFolder = this.path.resolve(process.cwd(), appName);
        return this.getDestRootFolder();
    }
    getDestRootFolder() {
        return this._destRootFolder;
    }
    setTemplatePaths() {
        const appTemplateFolder = this.path.resolve(this.getCliRootFolder(), 'templates/app');
        const cmpTemplateFolder = this.path.resolve(this.getCliRootFolder(), 'templates/component');
        const pageTemplateFolder = this.path.resolve(this.getCliRootFolder(), 'templates/page');
        this._templatePaths = {
            appTemplateFolder,
            cmpTemplateFolder,
            pageTemplateFolder
        };
        return this._templatePaths;
    }
    getTemplatePaths(key = '') {
        if (key && this._templatePaths.hasOwnProperty(key)) {
            return this._templatePaths[key];
        }
        thie.logger('error', `Template path ${key} not found`);
    }
    copyTpl(tplFolder) {
        return (src, dest, context, options) => {
            this.fs.copyTpl(
                this.path.resolve(tplFolder, src),
                dest,
                context,
                options, {
                    globOptions: {
                        dot: true
                    }
                }
            );
        }
    }
    copyCommit(msg = '', cb) {
        try {
            this.fs.commit(() => {
                this.logger('success', msg);
                if (typeof cb === 'function') {
                    cb();
                }
            });
        } catch (err) {
            this.logger('error', err);
        }
    }
    copyAppTpl(src = './', dest = './', context = {}, options = {}) {
        this.copyTpl(this.getTemplatePaths('appTemplateFolder'))(src, dest, context, options);
    }
    copyCmpTpl(src = './', dest = './', context = {}, options = {}) {
        this.copyTpl(this.getTemplatePaths('cmpTemplateFolder'))(src, dest, context, options);
    }
    copyPageTpl(src = './', dest = './', context = {}, options = {}) {
        this.copyTpl(this.getTemplatePaths('pageTemplateFolder'))(src, dest, context, options);
    }
    createAppFolder(appName) {
        return new Promise((resolve, reject) => {
            this.nfs.mkdir(this.getDestRootFolder(), (err) => {
                if (err) {
                    reject(err);
                }
                resolve(this.getDestRootFolder());
            })
        });
    }
    getCtrlName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.startCase(this._.camelCase(name)).split(' ').join('')}${postfix}`;
    }
    getDirName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.kebabCase(name)}${postfix}`;
    }
    async execAsync(cmd) {
        const {
            stdout,
            stderr
        } = await this.exec(`${cmd}`);
        console.log('stdout:', stdout.toString());
        console.log('stderr:', stderr.toString());
    }
    isNewApp(appName) {
        return !this.nfs.existsSync(path.resolve(process.cwd(), appName));
    }
    isNewComponent(cmpOrPagePath, cmpOrPageName) {
        const appRoot = this.path.dirname(this.getConfigPath());
        if (!this.nfs.existsSync(this.path.resolve(appRoot, cmpOrPagePath, cmpOrPageName))) {
            return true;
        }
        this.logger('error', 'Folder with a similar name already exists!');
    }
    isValidFractulusApp() {
        return !!this.getConfigPath();
    }
    hasValidWebpackFile() {
        return this.isValidFractulusApp() && !!this.getWebpackPath();
    }
    getConfigPath() {
        const configPath = this.findUp(CliConfigFileName, process.cwd());
        if (configPath) {
            return configPath;
        }
        this.logger('error', `Not within a valid fractulus application!`);
    }
    getWebpackPath() {
        const webpackPath = this.findUp(WebpackConfigFileName, process.cwd());
        if (webpackPath) {
            return webpackPath;
        }
        this.logger('error', `Not within a valid fractulus application!`);
    }
    getConfigData() {
        return this.fs.readJSON(this.getConfigPath());
    }
    // Credit to angular cli reverse search
    findUp(names = [], from = '', stopOnNodeModules = false) {
        if (!Array.isArray(names)) {
            names = [names];
        }
        const root = path.parse(from).root;

        let currentDir = from;
        while (currentDir && currentDir !== root) {
            for (const name of names) {
                const p = path.join(currentDir, name);
                if (this.nfs.existsSync(p)) {
                    return p;
                }
            }

            if (stopOnNodeModules) {
                const nodeModuleP = path.join(currentDir, 'node_modules');
                if (this.nfs.existsSync(nodeModuleP)) {
                    return null;
                }
            }

            currentDir = path.dirname(currentDir);
        }

        return null;
    }
}
module.exports = Utils;