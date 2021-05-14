import shelljs from 'shelljs';
import kleur from "kleur";
import { getMatches } from '../utils/util.mjs';
const { which, exec } = shelljs;
const spellingErrorRegex = /^(?<filePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+)\s+-\s+.+\((?<misspelledWord>\w+)\)(?:\s+--)?\s?(?<wordContext>.+)?/gm;

export const command = "all";
export const describe = "perform full spell check of all rpy files";
export const aliases = ['a'];
export async function handler (argv){
    var cSpellWhich = which('cspell');
    if(cSpellWhich?.code !== 0){
        console.log(kleur.red('A global installation of cspell is required! Install using \"npm install -g cspell\"'));
    } else {
        // should we suppress intro
        if (!argv.suppressIntro) {
            console.log(kleur.yellow('Checking all files for spelling errors...'));
        }
        let spellingResults = exec(`cspell --show-context --no-progress --no-summary "**/*.rpy"`, {silent:true}).stdout;
        let matches = [];
        if (spellingResults) {
            matches = getMatches(spellingResults, spellingErrorRegex, matches);
            let yellowColon = kleur.yellow(":");
            let fileLengthList = matches.map(item => `${kleur.green(item?.groups?.filePath)}${yellowColon}${kleur.yellow(item?.groups?.lineNumber)}${yellowColon}${kleur.yellow(item?.groups?.columnNumber)}`?.length || 0);
            // console.log('fileLengthList', JSON.stringify(fileLengthList,null,2));
            let maxFileLength = Math.max(...fileLengthList);
            let paddedFilePathLength = maxFileLength;
            // console.log('paddedFilePathLength', paddedFilePathLength);
            let matchesGroups = matches.map(item => item?.groups);
            // console.log('matchesGroups', JSON.stringify(matchesGroups,null,2));
            let wordLengthList = matches.map(item => `   - Unknown word (${kleur.red(item?.groups?.misspelledWord)})`.length);
            let maxWordLength = Math.max(...wordLengthList);
            for (const match of matches) {
                let path = match?.groups?.filePath;
                let lineNumber = match?.groups?.lineNumber;
                let word = match?.groups?.misspelledWord;
                let columnNumber = match?.groups?.columnNumber;
                let wordContext = match.groups?.wordContext ?? '';
                let pathWIthLinesAndCols = `${kleur.green(path)}${yellowColon}${kleur.yellow(lineNumber)}${yellowColon}${kleur.yellow(columnNumber)}`;
                let paddedPathWIthLinesAndCols = pathWIthLinesAndCols.padEnd(paddedFilePathLength, ' ');
                let misspelledWord = `   - Unknown word (${kleur.red(word)})`;
                let paddedWord = misspelledWord.padEnd(maxWordLength, ' ');
                let highlightedWordContext = '';
                // console.log('wordContext', wordContext);
                if (wordContext) {
                    let wordContextArray = wordContext.split(word);
                    highlightedWordContext = `    -- ${kleur.gray().gray(wordContextArray.join(kleur.red(word)))}`;
                }
                console.log(`${paddedPathWIthLinesAndCols}${paddedWord}${highlightedWordContext}`);
            }
        } else {
            console.log(kleur.green('No misspelled words detected!'));
        }
    }
}
