#!/usr/bin/env node

import yargs from 'yargs';
import { version } from './version';
import { commands } from './commands/index';
import { checkForUpdatesHandler } from './utils/util'
import * as all from './commands/all'
import * as cnt from './commands/counts'
import CommandModule from 'yargs';

checkForUpdatesHandler();

yargs(process.argv)
    .command(all)
    .command(cnt)
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
