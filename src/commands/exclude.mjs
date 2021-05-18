import kleur from "kleur";
import { cSpellExistsChecker, checkFileExists, addExclusionToFile } from '../utils/util.mjs';
export const command = "exclusion <file> <word>";
export const describe = "Handle words that are spelled wrong on purpose";
export const aliases = ['e'];
export function builder(yargs) {
  yargs.positional('file', {
    describe: "File path that has the misspelled word",
    type: 'string'
  }).positional('word', {
    describe: 'Word to exclude from misspelled words within file',
    type: 'string'
  });
};
export async function handler(argv) {
  checkFileExists(argv.file);
  cSpellExistsChecker(function cSpellExistsCheckerExcludeCommandSuccess() {
    // should we suppress intro
    if (!argv.suppressIntro) {
      console.log(kleur.yellow('Adding misspelled word to exclusion list...'));
    }
    console.log(`Do something with file [ ${argv.file} ] and word {${argv.word}}`);
    addExclusionToFile(argv.file, argv.word);
  });
}