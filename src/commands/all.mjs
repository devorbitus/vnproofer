import shelljs from 'shelljs';
import kleur from "kleur";
import { handleSpellingResults, printSpellingLines } from '../utils/util.mjs';
const { which, exec } = shelljs;

export const command = "all";
export const describe = "perform full spell check of all rpy files";
export const aliases = ['a'];
export async function handler(argv) {
    var cSpellWhich = which('cspell');
    if (cSpellWhich?.code !== 0) {
        console.log(kleur.red('A global installation of cspell is required! Install using \"npm install -g cspell\"'));
    } else {
        // should we suppress intro
        if (!argv.suppressIntro) {
            console.log(kleur.yellow('Checking all files for spelling errors...'));
        }
        const spellingResults = exec(`cspell --show-context --no-progress --no-summary "**/*.rpy"`, { silent: true }).stdout;
        printSpellingLines(handleSpellingResults(spellingResults));
    }
}
