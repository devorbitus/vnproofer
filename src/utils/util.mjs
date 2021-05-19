import kleur from "kleur";
import shelljs from 'shelljs';
import ln from 'line-number';
import insertLine from 'insert-line';
import fs from "fs";
import { version } from '../version.mjs';
import updateNotifier from 'update-notifier';
const { which } = shelljs;
const spellingErrorRegex = /^(?<filePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+)\s+-\s+.+\((?<misspelledWord>\w+)\)(?:\s+--)?\s?(?<wordContext>.+)?/gm;
const fileExclusionRegex = /cSpell:words (?<wordList>.+)$/mg;

export function getMatches(stringToSearch, regexToSearchWith, matchArray = []) {
  let matches = matchArray;
  let m;
  while ((m = regexToSearchWith.exec(stringToSearch)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regexToSearchWith.lastIndex) {
      regexToSearchWith.lastIndex++;
    }
    matches.push(m);
  }
  return matches;
}

export function colorFormattedSpellingMistakes(matches) {
  const lines = [];
  let yellowColon = kleur.yellow(":");
  let fileLengthList = matches.map(item => `${kleur.green(item?.groups?.filePath)}${yellowColon}${kleur.yellow(item?.groups?.lineNumber)}${yellowColon}${kleur.yellow(item?.groups?.columnNumber)}`?.length || 0);
  // console.log('fileLengthList', JSON.stringify(fileLengthList,null,2));
  let maxFileLength = Math.max(...fileLengthList);
  let paddedFilePathLength = maxFileLength;
  // console.log('paddedFilePathLength', paddedFilePathLength);
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
    lines.push(`${paddedPathWIthLinesAndCols}${paddedWord}${highlightedWordContext}`);
  }
  return lines;
}

export function handleSpellingResults(spellingResults) {
  if (spellingResults) {
    const matches = getMatches(spellingResults, spellingErrorRegex);
    const lines = colorFormattedSpellingMistakes(matches);
    return lines;
  } else {
    console.log(kleur.green('No misspelled words detected!'));
    return [];
  }
}

export function printSpellingLines(lines) {
  lines.forEach(line => {
    console.log(`${line}`);
  });
}

export function cSpellExistsChecker(callbackFunc) {
  var cSpellWhich = which('cspell');
  if (cSpellWhich?.code !== 0) {
    console.log(kleur.red('A global installation of cspell is required! Install using "npm install -g cspell"'));
  } else {
    callbackFunc();
  }
}

export function checkForUpdatesHandler() {
  const notifier = updateNotifier({ pkg: { name: 'vnproofer', version: version } });
  notifier.notify({ isGlobal: true });
}

export function checkFileExists(file) {
  if (!file) {
      console.log(kleur.red('Please provide a file path.'))
      process.exit(1);
  }

  if (!fs.existsSync(file) || file === "." || file === "..") {
      // console.log('argv', JSON.stringify(argv, null, 2))
      console.log(kleur.red(`File [ ${file} ] does not exist.`))
      process.exit(1);
  }
}

export function addExclusionToFile(file, word) {
  let fileContents = fs.readFileSync(file, 'utf8');
  let lineMatches = ln(fileContents, fileExclusionRegex);
  if (lineMatches.length) {
    const firstItem = lineMatches[0];
    const matches = getMatches(firstItem.line, fileExclusionRegex);
    const match = matches.length ? matches[0] : null;
    if (match) {
      if ('wordList' in match.groups) {
        const wordListPerFile = match.groups.wordList;
        const individualWordList = wordListPerFile.split(' ');
        const passedWord = word.split(' ');
        const lowercaseSortedCleanWordList = [...new Set([].concat(individualWordList, passedWord))].map(word => word.toLowerCase());
        lowercaseSortedCleanWordList.sort();
        const newLine = `# cSpell:words ${lowercaseSortedCleanWordList.join(' ')}`;
        const newFileContents = fileContents.replace(firstItem.line, newLine);
        fs.writeFileSync(file, newFileContents);
      }
    }
  } else {
    console.log(`No existing word exclusions found for file ${file} so adding new exclusion`);
    insertLine(file).prependSync(`# cSpell:words ${word}`);
  }
}