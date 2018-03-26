#!/usr/bin/env node

const Utils = require('./lib/utils');
/** Class representing all the CLI prompts */
class FractulusCLI extends Utils {
    /** Constructor function for the class */
    constructor() {
        super();
        this.appPrompts = [];
        this.cmpPrompts = [];
        this.appData = {};
        this.cmpData = {};
        this.pageData = {};
    }
    /**
     * Function to set the app prompts array which will be used by the inquirer API
     * @returns {object[]} The prompts array
     */
    setAppPrompts() {
        this.appPrompts = [{
            type: 'input',
            name: 'appTitle',
            message: `${this.chalk.yellow('Application title text')} ->`,
            default: 'Fractulus'
        }, {
            type: 'input',
            name: 'appDescription',
            message: `${this.chalk.yellow('Application description')} ->`,
            default: 'This is a handlebars and stimulus based app'
        }, {
            type: 'input',
            name: 'appAuthor',
            message: `${this.chalk.yellow('Application author')} ->`,
            default: 'John Doe'
        }];
        return this.appPrompts;
    }
     /**
     * Function to set the components prompts array which will be used by the inquirer API
     * @returns {object[]} The prompts array
     */
    setComponentPrompts(cmpName) {
        this.cmpPrompts = [{
            type: 'input',
            name: 'componentDesc',
            message: `${this.chalk.yellow('Component description')} ->`,
            default: `Awesome ${cmpName} description!`
        }];
        return this.cmpPrompts;
    }
    /**
     * Function to add version to the inquirer API
     */
    _inquireVersion() {
        this.program
            .version(this.pkg.version, '-v, --version')
            .description('Fractulus CLI - Handlebars Fractal CLI Tool');
    }
    /**
     * Function to add `create page` functionality to the inquirer API
     */
    _inquireNewPage() {
        this.program
            .command('create-page <pName>')
            .alias('cp')
            .description(this.chalk.yellow('Create new fractal page'))
            .action((pName) => {
                this.pageData.pageName = pName;
                this.pageData.pageDirName = this.getDirName(pName);
               
                // Validate the existance of .fractulus-cli.json file
                if (this.isValidFractulusApp()) {
                    try {
                        // Get the appPagesPath
                        const appRoot = this.path.dirname(this.getConfigPath());
                        const configData = this.getConfigData();
                        const pageData = Object.assign({}, this.pageData, configData);
                        // Use app component path to check if page folder exists
                        if (this.isNewComponent(configData.appPagesPath, pageData.pageDirName)) {
                            const pageDirPath = this.path.join(appRoot, configData.appPagesPath, pageData.pageDirName);
                            const pageFilePath = this.path.join(pageDirPath, pageData.pageDirName);
                            this.copyPageTpl(`./page.hbs`, `${pageFilePath}.hbs`, pageData);
                            this.copyPageTpl(`./page.config.json`, `${pageFilePath}.config.json`, pageData);
                            this.copyCommit(`Page created under ${pageDirPath}`);
                        }
                    } catch (err) {
                        this.logger('error', err);
                    }
                }
            });
    }
    /**
     * Function to add `create component` functionality to the inquirer API
     */
    _inquireNewComponent() {
        this.program
            .command('create-component <cName>')
            .option('-s, --skip-test', 'Skip installing spec file')
            .alias('cc')
            .description(this.chalk.yellow('Create new fractal component'))
            .action((cName, cmd) => {
                this.cmpData.componentName = cName;
                this.cmpData.componentDirName = this.getDirName(cName);
                this.cmpData.componentCtrlName = this.getCtrlName(cName, '', 'Controller');
                // Validate the existance of .fractulus-cli.json file
                if (this.isValidFractulusApp()) {
                    try {
                        const appRoot = this.path.dirname(this.getConfigPath());
                        const configData = this.getConfigData();
                        // Use app component path to check if component folder exists
                        if (this.isNewComponent(configData.appComponentsPath, this.cmpData.componentDirName)) {
                            this.inquirer
                                .prompt(this.setComponentPrompts(this.cmpData.componentName))
                                .then(async (answers) => {

                                    const cmpData = Object.assign({}, configData, this.cmpData, { ...answers
                                    });
                                    const componentDirPath = this.path.join(appRoot, cmpData.appComponentsPath, cmpData.componentDirName);
                                    const componentFilePath = this.path.join(componentDirPath, cmpData.componentDirName);
                                    // // If not then create component
                                    this.copyCmpTpl(`./component.js`, `${componentFilePath}.js`, cmpData);
                                    this.copyCmpTpl(`./component.config.json`, `${componentFilePath}.config.json`, cmpData);
                                    this.copyCmpTpl(`./component.hbs`, `${componentFilePath}.hbs`, cmpData);
                                    this.copyCmpTpl(`./component.scss`, `${componentFilePath}.scss`, cmpData);
                                    this.copyCmpTpl(`./partials/`, `${componentDirPath}/partials`, cmpData);
                                    this.copyCmpTpl(`./package.json`, `${componentDirPath}/package.json`, cmpData);
                                    this.copyCmpTpl(`./README.md`, `${componentDirPath}/README.md`, cmpData);
                                    this.copyCommit(`Component created under ${componentDirPath}`);
                                });
                        }
                    } catch (err) {
                        this.logger('error', err);
                    }
                }
            });
    }
    /**
     * Function to add `create app` functionality to the inquirer API
     */
    _inquireNewApp() {
        this.program
            .command('new <appName>')
            .option('-s, --skip-install', 'Skip installing packages')
            .alias('n')
            .description(this.chalk.yellow('Create new fractal application'))
            .action((appName, cmd) => {

                this.appData.appName = this._.kebabCase(appName);
                this.appData.appVersion = '0.0.1';

                if (this.isNewApp(this.appData.appName)) {
                    this.logger('info', `Package Name: ${this.chalk.yellow(this.appData.appName)}`)
                    this.inquirer
                        .prompt(this.setAppPrompts())
                        .then(async (answers) => {
                            const dest = this.setDestRootFolder(this.appData.appName);
                            this.appData = Object.assign({}, this.appData, { ...answers
                            }, {
                                appComponentsPath: this.slash('./src/app/components'),
                                appPagesPath: this.slash('./src/app/pages')
                            });
                            await this.createAppFolder(this.appData.appName);
                            this.copyAppTpl('./', './', this.appData);
                            this.copyCommit(`Application created under ${dest}`, () => {
                                // Skip npm install
                                if (!cmd.skipInstall) {
                                    try {
                                        process.chdir(dest);
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
                }
            });
    }
    /**
     * Function to add `webpack build and local serve` functionality to the inquirer API
     */
    _executeServe() {
        this.program
            .command('serve')
            .option('-p, --prod', 'Create prod version')
            .option('-w, --watch', 'Watch for file changes')
            .option('-s, --source-map', 'Create source maps')
            .action((cmd) => {
                if (this.hasValidWebpackFile()) {
                    try {
                        const builder = require(this.getWebpackPath());
                        builder();
                    } catch (err) {
                        this.logger('error', err);
                    }
                }
            });
    }
    /**
     * Function to add `webpack build and fractal build` functionality to the inquirer API
     */
    _executeDeploy() {
        this.program
            .command('build')
            .option('-p, --prod', 'Create prod version')
            .option('-s, --source-map', 'Create source maps')
            .action((cmd) => {
                if (this.hasValidWebpackFile()) {
                    try {
                        const builder = require(this.getWebpackPath());
                        builder(true);
                    } catch (err) {
                        this.logger('error', err);
                    }
                }
            });
    }
    /** Function to add the build/deployments commands to the inquirer API */
    execute() {
        this._executeServe();
        this._executeDeploy();
    }
    /** Function to add the CLI input commands to the inquirer API */
    inquire() {
        this._inquireVersion();
        this._inquireNewApp();
        this._inquireNewComponent();
        this._inquireNewPage();
    }
    /** Initialization function */
    init() {
        this.setCliRootFolder(__dirname);
        this.setTemplatePaths();
        this.execute();
        this.inquire();
        this.program.parse(process.argv);
    }
}
module.exports = (new FractulusCLI()).init();