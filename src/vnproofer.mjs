#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import * as path from 'path';
import appRootPath from 'app-root-path';
const version = process.env.npm_package_version || getVersionFromPackageIfExists();
import { commands } from './commands/index.mjs';

yargs(hideBin(process.argv))
    .command(commands)
    .alias("h", "help")
    .scriptName('vnproofer')
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

function getVersionFromPackageIfExists(){
    let packageVersion = '1.0.0--unknown';
    const scriptDir = appRootPath.toString();
    const packagePath = path.resolve(scriptDir, 'package.json');
    try {
        if (fs.existsSync(packagePath)) {
            const packageJsonString = fs.readFileSync(packagePath, 'utf8');
            const packageJson = JSON.parse(packageJsonString);
            packageVersion = packageJson?.version ?? packageVersion;
        } else {
            console.error('Unable to locate package.json file somehow');
        }
    } catch (error) {
        console.error(new Error('Unable to get npm package version from package.json file', error));
    }
    return packageVersion;
}
