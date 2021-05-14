export function getMatches(stringToSearch, regexToSearchWith, matchArray = []){
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
