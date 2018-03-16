const argv = require('yargs')
    // Watch option
    .describe('w', 'Watch files')
    .alias('w', 'watch')
    // Prod option
    .describe('p', 'Create production codebase')
    .alias('p', 'prod')
    // Source map option
    .describe('s', 'Generate source map')
    .alias('s', 'source-map')
    // Help Option
    .help('h')
    .alias('h', 'help')
    .argv;

function setCliOptions() {
    global.FTL_WATCH = argv.w || false;
    global.FTL_PROD = argv.p || false;
    global.FTL_SOURCEMAP = argv.sm || false;
}
setCliOptions();