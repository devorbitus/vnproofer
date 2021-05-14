import kleur from "kleur";
import fs from "fs";
import shelljs from 'shelljs';
const { exec } = shelljs;
import { handleSpellingResults, printSpellingLines, cSpellExistsChecker } from '../utils/util.mjs';

export const command = "check <file>";
export const describe = "check file for spelling errors";
export function builder(yargs) {
    yargs.positional('file', {
        describe: "file to check for spelling errors",
        type: 'string'
    });
};
export const aliases = ['c'];
export function validation(foo, bar) {
    console.log('foo', foo);
    console.log('bar', bar);
}
export async function handler(argv) {
    if (!argv.file) {
        console.log(kleur.red('Please provide a file path.'))
        process.exit(1);
    }

    if (!fs.existsSync(argv.file) || argv.file === "." || argv.file === "..") {
        // console.log('argv', JSON.stringify(argv, null, 2))
        console.log(kleur.red(`File [ ${argv.file} ] does not exist.`))
        process.exit(1)
    }
    cSpellExistsChecker(function cSpellExistsCheckerCheckCommandSuccess() {
        // should we suppress intro
        if (!argv.suppressIntro) {
            console.log(kleur.yellow(`Checking file [ ${argv.file} ] for spelling errors...`));
        }
        const spellingResults = exec(`cspell --show-context --no-progress --no-summary ${argv.file}`, { silent: true }).stdout;
        printSpellingLines(handleSpellingResults(spellingResults));
    });
}
