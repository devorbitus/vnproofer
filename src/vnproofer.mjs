#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
const version = process.env.npm_package_version;
import { commands } from './commands/index.mjs';

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
    .option("suppress-cspell-summary", {
        alias: "u",
        type: "boolean",
        default: false,
        describe: "Suppress cSpell Summary"
    })
    .wrap(90)
    .demandCommand()
    .help()
    .showHelpOnFail(true, 'whoops, something went wrong! run with --help')
    .argv;
