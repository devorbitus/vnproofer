import shelljs from 'shelljs';
import kleur from "kleur";
import { handleSpellingResults, printSpellingLines, cSpellExistsChecker } from '../utils/util';
import { Argv, CommandBuilder } from 'yargs';
const { exec } = shelljs;

export const command = "all";
export const describe = "perform full spell check of all rpy files";
export const aliases = ['a'];
export async function handler(argv: Argv<{suppressIntro:boolean}>) {
    cSpellExistsChecker(function cSpellExistsCheckerAllCommandSuccess() {
        // should we suppress intro
        if (!argv.suppressIntro) {
            console.log(kleur.yellow('Checking all files for spelling errors...'));
        }
        const spellingResults:string = exec(`cspell --show-context --no-progress --no-summary "**/*.rpy"`, { silent: true }).stdout;
        printSpellingLines(handleSpellingResults(spellingResults));
    });
}
