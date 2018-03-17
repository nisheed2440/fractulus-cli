#!/usr/bin/env node

const program = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const pkg = require('./package.json');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');
const _ = require('lodash');
const fs_1 = require('fs');
const store = memFs.create();
const fs = editor.create(store);
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const slash = require('slash');

class FractulusCLI {
    constructor() {
        /** Private Variables */
        this._root = __dirname;
        this._appTemplateFolder = path.resolve(this._root, 'templates/app');
        this._cmpTemplateFolder = path.resolve(this._root, 'templates/component');
        this._pageTemplateFolder = path.resolve(this._root, 'templates/page');
        this._destRootFolder = '';
        this._appPrompts = [];
        this._cmpPrompts = [];
        this._appData = {};
        this._cmpData = {};
        this._pageData = {};
        /** Public Variables */
        this.fs = fs;
        this.nfs = fs_1;
        this.path = path;
        this.slash = slash;
        this.chalk = chalk;
        this.inquirer = inquirer;
        this.program = program;
        this.pkg = pkg;
        this._ = _;
    }
    _setAppPrompts() {
        this._appPrompts = [{
            type: 'input',
            name: 'appTitle',
            message: `${chalk.yellow('Application title text')} ->`,
            default: 'Fractulus'
        }, {
            type: 'input',
            name: 'appDescription',
            message: `${chalk.yellow('Application description')} ->`,
            default: 'This is a handlebars and stimulus based app'
        }, {
            type: 'input',
            name: 'appAuthor',
            message: `${chalk.yellow('Application author')} ->`,
            default: 'John Doe'
        }];
        return this._appPrompts;
    }
    _setComponentPrompts(cmpName) {
        this._cmpPrompts = [{
            type: 'input',
            name: 'componentDesc',
            message: `${chalk.yellow('Component description')} ->`,
            default: `Awesome ${cmpName} description!`
        }];
        return this._cmpPrompts;
    }
    _setDestRootFolder(appName) {
        this._destRootFolder = this.path.resolve(process.cwd(), appName);
        return this._destRootFolder;
    }
    _createAppFolder() {
        this._setDestRootFolder(this._appData.appName);
        return new Promise((resolve, reject) => {
            this.nfs.mkdir(this._destRootFolder, (err) => {
                if (err) {
                    reject(err);
                    process.exit(1);
                }
                resolve(this._destRootFolder);
            })
        });
    }
    _copyTpl(tplFolder) {
        return (src, dest, context, options) => {
            this.fs.copyTpl(
                this.path.resolve(tplFolder, src),
                this.path.resolve(this._destRootFolder, dest),
                context,
                options, {
                    globOptions: {
                        dot: true
                    }
                }
            );
        }
    }
    _copyAppTpl(src = './', dest = './', context = {}, options = {}) {
        this._copyTpl(this._appTemplateFolder)(src, dest, context, options);
    }
    _copyCmpTpl(src = './', dest = './', context = {}, options = {}) {
        this._copyTpl(this._cmpTemplateFolder)(src, dest, context, options);
    }
    _copyPageTpl(src = './', dest = './', context = {}, options = {}) {
        this._copyTpl(this._pageTemplateFolder)(src, dest, context, options);
    }
    _inquireVersion() {
        this.program
            .version(this.pkg.version, '-v, --version')
            .description('FractulusCLI - Handlebars Fractal CLI Tool');
    }
    _inquireNewPage() {
        this.program
            .command('create-page <pName>')
            .alias('cp')
            .description(chalk.yellow('Create new fractal page'))
            .action((pName) => {
                this._pageData.pageName = pName;
                this._pageData.pageDirName = this.getDirName(pName);
                // Validate the existance of .fractulus-cli.json file
                if (this.isValidFractulusApp()) {
                    try {
                        // Get the appPagesPath
                        const configData = this.fs.readJSON(this.getConfigPath());
                        const pageData = Object.assign({}, this._pageData, configData);
                        // Use app component path to check if page folder exists
                        if (this.isNewComponent(configData.appPagesPath, pageData.pageDirName)) {
                            const pageDirPath = `./${configData.appPagesPath}/${pageData.pageDirName}`;
                            const pageFilePath = `${pageDirPath}/${pageData.pageDirName}`;
                            this._copyPageTpl(`./page.hbs`, `${pageFilePath}.hbs`, pageData);
                            this._copyPageTpl(`./page.config.json`, `${pageFilePath}.config.json`, pageData);
                            this.fs.commit(() => {
                                this.logger('success', `Page created under ${pageDirPath}`);
                            });
                        }
                    } catch (err) {
                        this.logger('error', err);
                        process.exit(1);
                    }
                }
            });
    }
    _inquireNewComponent() {
        this.program
            .command('create-component <cName>')
            .option('-s, --skip-test', 'Skip installing spec file')
            .alias('cc')
            .description(chalk.yellow('Create new fractal component'))
            .action((cName, cmd) => {
                this._cmpData.componentName = cName;
                this._cmpData.componentDirName = this.getDirName(cName);
                this._cmpData.componentCtrlName = this.getCtrlName(cName, '', 'Controller');
                // Validate the existance of .fractulus-cli.json file
                if (this.isValidFractulusApp()) {
                    try {
                        // Get the appComponentsPath
                        const configData = this.fs.readJSON(this.getConfigPath());
                        // Use app component path to check if component folder exists
                        if (this.isNewComponent(configData.appComponentsPath, this._cmpData.componentDirName)) {
                            this.inquirer
                                .prompt(this._setComponentPrompts(this._cmpData.componentName))
                                .then(async (answers) => {
                                    const cmpData = Object.assign({}, configData, this._cmpData, { ...answers
                                    });
                                    const componentDirPath = `./${cmpData.appComponentsPath}/${cmpData.componentDirName}`;
                                    const componentFilePath = `${componentDirPath}/${cmpData.componentDirName}`;
                                    // If not then create component
                                    this._copyCmpTpl(`./component.js`, `${componentFilePath}.js`, cmpData);
                                    this._copyCmpTpl(`./component.config.json`, `${componentFilePath}.config.json`, cmpData);
                                    this._copyCmpTpl(`./component.hbs`, `${componentFilePath}.hbs`, cmpData);
                                    this._copyCmpTpl(`./component.scss`, `${componentFilePath}.scss`, cmpData);
                                    this._copyCmpTpl(`./partials/`, `${componentDirPath}/partials`, cmpData);
                                    this._copyCmpTpl(`./package.json`, `${componentDirPath}/package.json`, cmpData);
                                    this._copyCmpTpl(`./README.md`, `${componentDirPath}/README.md`, cmpData);
                                    this.fs.commit(() => {
                                        this.logger('success', `Component created under ${componentDirPath}`);
                                    });
                                });
                        }
                    } catch (err) {
                        this.logger('error', err);
                        process.exit(1);
                    }
                }
            });
    }
    _inquireNewApp() {
        this.program
            .command('new <appName>')
            .option('-s, --skip-install', 'Skip installing packages')
            .alias('n')
            .description(chalk.yellow('Create new fractal application'))
            .action((appName, cmd) => {

                this._appData.appName = this._.kebabCase(appName);
                this._appData.appVersion = this.pkg.version;

                if (!this.nfs.existsSync(path.resolve(process.cwd(), this._appData.appName))) {
                    this.logger('info', `Package Name: ${chalk.yellow(appName)}`)
                    this.inquirer
                        .prompt(this._setAppPrompts())
                        .then(async (answers) => {
                            this._appData = Object.assign({}, this._appData, { ...answers
                            }, {
                                appComponentsPath: this.slash(this.path.relative(this._destRootFolder, './src/app/components')),
                                appPagesPath: this.slash(this.path.relative(this._destRootFolder, './src/app/pages'))
                            });
                            await this._createAppFolder();
                            this._copyAppTpl('./', './', this._appData);
                            this.fs.commit(() => {
                                this.logger('success', `Application created under ${this._destRootFolder}`);
                                // Skip npm install
                                if (!cmd.skipInstall) {
                                    try {
                                        process.chdir(this._destRootFolder);
                                        this.logger('warn', 'Running NPM install');
                                        this.logger(null, 'This might take a while...');
                                        this.execAsync('npm install');
                                    } catch (err) {
                                        this.logger('error', 'chdir: ' + err);
                                    }
                                }
                            });
                        });
                } else {
                    this.logger('error', 'Application/Folder with a similar name already exists in the current working directory!');
                    process.exit(1);
                }
            });
    }
    _executeServe() {
        this.program
            .command('serve')
            .option('-p, --prod', 'Create prod version')
            .option('-w, --watch', 'Watch for file changes')
            .option('-s, --source-map', 'Create source maps')
            .action((cmd) => {
                if (this.isValidFractulusApp() && this.fs.exists(this.getWebpackPath())) {
                    try {
                        const builder = require(this.getWebpackPath());
                        builder();
                    } catch (err) {
                        this.logger('error', err);
                    }
                }
            });
    }
    _executeDeploy() {
        this.program
            .command('build')
            .option('-p, --prod', 'Create prod version')
            .option('-s, --source-map', 'Create source maps')
            .action((cmd) => {
                if (this.isValidFractulusApp() && this.fs.exists(this.getWebpackPath())) {
                    try {
                        const builder = require(this.getWebpackPath());
                        builder(true);
                    } catch (err) {
                        this.logger('error', err);                        
                    }
                }
            });
    }
    getCtrlName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.startCase(this._.camelCase(name)).split(' ').join('')}${postfix}`;
    }
    getDirName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.kebabCase(name)}${postfix}`;
    }
    execute() {
        this._executeServe();
        this._executeDeploy();
    }
    inquire() {
        this._inquireVersion();
        this._inquireNewApp();
        this._inquireNewComponent();
        this._inquireNewPage();
    }
    init() {
        this.execute();
        this.inquire();
        this.program.parse(process.argv);
    }
    async execAsync(cmd) {
        const {
            stdout,
            stderr
        } = await exec(`${cmd}`);
        console.log('stdout:', stdout.toString());
        console.log('stderr:', stderr.toString());
    }
    isNewComponent(cmpOrPagePath, cmpOrPageName) {
        if (!this.nfs.existsSync(path.resolve(process.cwd(), cmpOrPagePath, cmpOrPageName))) {
            return true;
        }
        this.logger('error', 'Folder with a similar name already exists in the current working directory!'); 
        process.exit(1);

    }
    isValidFractulusApp() {
        if (this.fs.exists(this.getConfigPath())) {
            return true;
        }
        this.logger('error', 'Not a valid fractal application!');
        process.exit(1);
    }
    getConfigPath() {
        return path.resolve(process.cwd(), './.fractulus-cli.json');
    }
    getWebpackPath() {
        return path.resolve(process.cwd(), './webpack.build.js');
    }
    logger(type, msg) {
        let chalkColor;
        let icon = '';
        let prefix = '';
        switch (type) {
            case 'error':
                chalkColor = chalk.red;
                icon = '\u2718';
                prefix = 'ERROR ->';
                break;
            case 'success':
                chalkColor = chalk.green;
                icon = '\u2714';
                prefix = 'SUCCESS ->';
                break;
            case 'info':
                chalkColor = chalk.blueBright;
                icon = '\u2794';
                prefix = 'INFO ->';
                break;
            case 'warn':
                chalkColor = chalk.yellow;
                icon = '\u2757';
                prefix = 'WARNING ->';
                break;
            default:
                chalkColor = chalk.grey;
                break;
        }
        console.log(chalkColor(`${icon} ${prefix} ${msg}`));
    }
}
module.exports = (new FractulusCLI()).init();