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
/** Class represention all the CLI utility functions 
 * @extends Logger
*/
class Utils extends Logger {
    /**
     * The Utils constructor functions
     */
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
    /**
     * Function to set the CLI root directory
     * @param {string} root The root directory of the fractulus CLI
     */
    setCliRootFolder(root) {
        this._cliRootFolder = root;
        return this.getCliRootFolder();
    }
    /**
     * Function to get the CLI root directory
     */
    getCliRootFolder() {
        if (!this._cliRootFolder) {
            thie.logger('error', `Root path not found`);
        }
        return this._cliRootFolder;
    }
    /**
     * Function to set the destination root folder path of the fractulus application
     * @param {string} appName The name for fractulus application folder
     */
    setDestRootFolder(appName) {
        this._destRootFolder = this.path.resolve(process.cwd(), appName);
        return this.getDestRootFolder();
    }
    /**
     * Function to get the destination root folder path of the fractulus application
     */
    getDestRootFolder() {
        return this._destRootFolder;
    }
    /**
     * Function to set all the template paths
     * This icludes setting the paths for 'app', 'component' and 'page'
     */
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
    /**
     * Function to get the template path
     * @param {string} key The type of template to be returned 
     */
    getTemplatePaths(key = '') {
        if (key && this._templatePaths.hasOwnProperty(key)) {
            return this._templatePaths[key];
        }
        thie.logger('error', `Template path ${key} not found`);
    }/**
     * Function to create a copy template sub-function based on the template to be copied
     * This sub-function copies templates/files etc. into mem-fs.
     * @param {string} tplFolder Template folder path
     * @returns {function} The function to be invoked while copying the template
     */
    copyTpl(tplFolder) {
        return (src, dest, context, options) => {
            this.fs.copyTpl(
                this.path.join(tplFolder, src),
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
    /**
     * Function to write the files stored in mem-fs to disk
     * @param {string} msg The message to be logged on success callback
     * @param {function} cb The function to be called on success callback 
     */
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
    /**
     * Function to copy the app template to the destination fractulus application folder
     * @param {string} src The source file/folder paths of the app template
     * @param {string} dest The destination folder of the app template files/folders
     * @param {object} context The context object pased to the mem-fs-editor ejs template 
     * @param {object} options Additional mem-fs copy options
     */
    copyAppTpl(src = './', dest = './', context = {}, options = {}) {
        console.log(arguments);
        this.copyTpl(this.getTemplatePaths('appTemplateFolder'))(src, dest, context, options);
    }
     /**
     * Function to copy the component template to the destination fractulus application folder
     * @param {string} src The source file/folder paths of the component template
     * @param {string} dest The destination folder of the component template files/folders
     * @param {object} context The context object pased to the mem-fs-editor ejs template 
     * @param {object} options Additional mem-fs copy options
     */
    copyCmpTpl(src = './', dest = './', context = {}, options = {}) {
        this.copyTpl(this.getTemplatePaths('cmpTemplateFolder'))(src, dest, context, options);
    }
    /**
     * Function to copy the page template to the destination fractulus application folder
     * @param {string} src The source file/folder paths of the page template
     * @param {string} dest The destination folder of the page template files/folders
     * @param {object} context The context object pased to the mem-fs-editor ejs template 
     * @param {object} options Additional mem-fs copy options
     */
    copyPageTpl(src = './', dest = './', context = {}, options = {}) {
        this.copyTpl(this.getTemplatePaths('pageTemplateFolder'))(src, dest, context, options);
    }
    /**
     * Function to create the fractulus application
     * @param {string} appName The name for fractulus application folder
     * @returns {Promise} Promise that represents the folder path of the newly created fractulus application
     */
    createAppFolder(appFolderPath) {
        return new Promise((resolve, reject) => {
            this.nfs.mkdir(appFolderPath, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(appFolderPath);
            })
        });
    }
    /**
     * Function to get the component name in the correct format
     * @example
     * // Returns 'HelloWorldController'
     * this.getCtrlName('hello-world', '', 'Controller');
     * @param {string} name Name of the component
     * @param {string} prefix A string prefix added to the start of the returned value
     * @param {string} postfix A string postfix added to the end of the returned value
     * @returns {string} The component controller name to be used in the application
     */
    getCtrlName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.startCase(this._.camelCase(name)).split(' ').join('')}${postfix}`;
    }
    /**
     * Function to get the directory name in the correct format
     * @example
     * // Returns 'hello-world'
     * this.getDirName('helloWorld');
     * @param {string} name Name of the component/page
     * @param {string} prefix A string prefix added to the start of the returned value
     * @param {string} postfix A string postfix added to the end of the returned value
     * @returns {string} The component/page directory name to be used in the application
     */
    getDirName(name, prefix = '', postfix = '') {
        return `${prefix}${this._.kebabCase(name)}${postfix}`;
    }
    /**
     * Function to execute CLI commands programatically
     * @param {string} cmd The CLI command to be executed
     */
    async execAsync(cmd) {
        const {
            stdout,
            stderr
        } = await this.exec(`${cmd}`);
        console.log('stdout:', stdout.toString());
        console.log('stderr:', stderr.toString());
    }
    /**
     * Function to check if the fractulus app to be created already exists
     * @param {string} appName The name of the app folder to be created
     */
    isNewApp(appName) {
        return !this.nfs.existsSync(path.resolve(process.cwd(), appName));
    }
    /**
     * Function to check if the component or page to be created already exists
     * @param {string} cmpOrPagePath The component or page dirname path
     * @param {string} cmpOrPageName The component or page name
     * @returns {boolean}
     */
    isNewComponent(cmpOrPagePath, cmpOrPageName) {
        const appRoot = this.path.dirname(this.getConfigPath());
        if (!this.nfs.existsSync(this.path.resolve(appRoot, cmpOrPagePath, cmpOrPageName))) {
            return true;
        }
        this.logger('error', 'Folder with a similar name already exists!');
    }
    /**
     * Function to check if the current folder structure is a valid fractulus app
     * @returns {boolean}
     */
    isValidFractulusApp() {
        return !!this.getConfigPath();
    }
    /**
     * Function to check if the current folder structure has a valid webpack file
     * @returns {boolean}
     */
    hasValidWebpackFile() {
        return this.isValidFractulusApp() && !!this.getWebpackPath();
    }
    /**
     * Function to return the CLI config path from the current fractulus app
     * @returns {string} The CLI config path
     */
    getConfigPath() {
        const configPath = this.findUp(CliConfigFileName, process.cwd());
        if (configPath) {
            return configPath;
        }
        this.logger('error', `Not within a valid fractulus application!`);
    }
    /**
     * Function to return the webpack path from the current fractulus app
     * @returns {string} The webpack config path
     */
    getWebpackPath() {
        const webpackPath = this.findUp(WebpackConfigFileName, process.cwd());
        if (webpackPath) {
            return webpackPath;
        }
        this.logger('error', `Not within a valid fractulus application!`);
    }
    /**
     * Function to return the fractulus CLI config data from the current app
     * @returns {object} The fractulus app CLI config 
     */
    getConfigData() {
        return this.fs.readJSON(this.getConfigPath());
    }
    /**
     * 
     * @param {(string|string[])} names The name of the files to be reverse searched
     * @param {string} from The folder path to search upward from      
     * @param {boolean} [stopOnNodeModules] Optionally stop when u found node_modules folder
     */
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