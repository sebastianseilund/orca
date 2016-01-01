import yargs from 'yargs'

let argv = yargs
    .usage('Usage: orca [options] <config-file>')
    .default('c', 1)
    .alias('c', 'concurrency')
    .describe('c', 'How many apps to build at a time')
    .boolean('v')
    .alias('v', 'verbose')
    .describe('v', 'Streams output from Docker commands')
    .demand(1)
    .example('orca orca.yml', 'Use orca.yml as config file')
    .example('orca -v orca.yml', 'Run in verbose mode')
    .example('orca -c 3 orca.yml', 'Run 3 concurrent builds')
    .help('h')
    .alias('h', 'help')
    .argv

export default argv
