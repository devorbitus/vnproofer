import kleur from "kleur";
const spellingErrorRegex = /^(?<filePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+)\s+-\s+.+\((?<misspelledWord>\w+)\)(?:\s+--)?\s?(?<wordContext>.+)?/gm;

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

export function printSpellingLines(lines){
  lines.forEach(line => {
    console.log(`${line}`);
  });
}