import kleur from "kleur";
import shelljs from 'shelljs';
const { exec } = shelljs;
import { handleSpellingResults, printSpellingLines, cSpellExistsChecker, checkFileExists } from '../utils/util.mjs';

export const command = "check <file>";
export const describe = "check file for spelling errors";
export function builder(yargs) {
    yargs.positional('file', {
        describe: "file to check for spelling errors",
        type: 'string'
    });
};
export const aliases = ['c'];
export async function handler(argv) {
    checkFileExists(argv.file);
    cSpellExistsChecker(function cSpellExistsCheckerCheckCommandSuccess() {
        // should we suppress intro
        if (!argv.suppressIntro) {
            console.log(kleur.yellow(`Checking file [ ${argv.file} ] for spelling errors...`));
        }
        const spellingResults = exec(`cspell --show-context --no-progress --no-summary ${argv.file}`, { silent: true }).stdout;
        printSpellingLines(handleSpellingResults(spellingResults));
    });
}
