import kleur from "kleur";
import { cSpellExistsChecker, checkFileExists, addExclusionToFile } from '../utils/util';
export const command = "exclude <file> <word>";
export const describe = "Handle words that are spelled wrong on purpose";
export const aliases = ['e'];
export function builder(yargs: any) {
  yargs.positional('file', {
    describe: "File path that has the misspelled word",
    type: 'string'
  });
  yargs.positional('word', {
    describe: 'Word or words to exclude from misspelled words within file',
    type: 'string'
  });
  yargs.example([
    ['$0 exclude ./myfile.rpy fixin', 'Add a single word to the file\'s word exclusion list'],
    ['$0 e ./myfile.rpy "fixin yall ain\'t"', 'Add multiple space-seperated words to the file\'s word exclusion list']
  ]);
};
export async function handler(argv: any) {
  checkFileExists(argv.file);
  cSpellExistsChecker(function cSpellExistsCheckerExcludeCommandSuccess() {
    // should we suppress intro
    if (!argv.suppressIntro) {
      console.log(kleur.yellow('Adding misspelled word to exclusion list...'));
    }
    addExclusionToFile(argv.file, argv.word);
  });
}