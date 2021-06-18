import kleur from "kleur";
import shelljs from 'shelljs';
import {ln} from 'line-number';
import {insertLine} from 'insert-line'
import fs from "fs";
import updateNotifier from 'update-notifier';
import { version } from '../version';
import parseDiff from "parse-diff";
const { which } = shelljs;
const spellingErrorRegex = /^(?<filePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+)\s+-\s+.+\((?<misspelledWord>\w+)\)(?:\s+--)?\s?(?<wordContext>.+)?/gm;
const fileExclusionRegex = /cSpell:words (?<wordList>.+)$/mg;
export type GroupRegex = RegExpExecArray & { groups: {} };
export type WordCountDiff = parseDiff.Change & { wordCount: number, dialogueWordCount:number };

export function getMatches(stringToSearch: string, regexToSearchWith: RegExp, matchArray:GroupRegex[] = []):GroupRegex[] {
  let matches:GroupRegex[] = matchArray;
  let m:GroupRegex | null;
  while ((m = regexToSearchWith.exec(stringToSearch) as GroupRegex) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regexToSearchWith.lastIndex) {
      regexToSearchWith.lastIndex++;
    }
    matches.push(m);
  }
  return matches;
}

export function colorFormattedSpellingMistakes(matches: any[]) {
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

export function handleSpellingResults(spellingResults: string) {
  if (spellingResults) {
    const matches = getMatches(spellingResults, spellingErrorRegex);
    const lines = colorFormattedSpellingMistakes(matches);
    return lines;
  } else {
    console.log(kleur.green('No misspelled words detected!'));
    return [];
  }
}

export function printSpellingLines(lines: any[]) {
  lines.forEach(line => {
    console.log(`${line}`);
  });
}

export function cSpellExistsChecker(callbackFunc: { (): void; (): void; }) {
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

export function checkFileExists(file: fs.PathLike) {
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

export function addExclusionToFile(file: fs.PathLike, word: string) {
  let fileContents = fs.readFileSync(file, 'utf8');
  let lineMatches = ln(fileContents, fileExclusionRegex);
  if (lineMatches.length) {
    const firstItem = lineMatches[0];
    const matches:GroupRegex[] = getMatches(firstItem.line, fileExclusionRegex);
    const match:GroupRegex | null = matches[0];
    if (match) {
      if ('wordList' in match.groups) {
        const wordListPerFile:string = match.groups.wordList;
        const individualWordList:string[] = wordListPerFile.split(' ');
        const passedWord:string[] = word.split(' ');
        const emptyStringArray:string[] = [];
        const lowercaseSortedCleanWordList = [...new Set(emptyStringArray.concat(individualWordList, passedWord))].map(word => word.toLowerCase());
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