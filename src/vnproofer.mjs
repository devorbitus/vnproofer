#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { version } from './version.mjs';
import { commands } from './commands/index.mjs';
import { checkForUpdatesHandler } from './utils/util.mjs'

checkForUpdatesHandler();

yargs(hideBin(process.argv))
    .command(commands)
    .alias("h", "help")
    .version(`v${version}`)
    .alias("version", "v")
    .option("suppress-intro", {
        alias: "s",
        type: "boolean",
        default: false,
        describe: "Suppress intro of command"
    })
    .wrap(90)
    .demandCommand()
    .help()
    .showHelpOnFail(true, 'whoops, something went wrong! run with --help')
    .argv;
