import shelljs from 'shelljs';
import kleur from 'kleur';
import fs from 'fs';
import readline from 'readline';

const { which, exec, pwd } = shelljs;
export const command = "counts";
export const describe = "Query git to find out how many words have been committed today";
export const aliases = ['n'];
const since = "1am"
const addLineRegex = /^\+[^\+]/g;
const dialogRegex = /^(?:\s+)?(?:\w+(?:\s+)?){0,3}["|'](?<dialogue>.+)["|'](?:\s+)?$/m;
const unifiedDiffRegex = /^@@ -(?<oldLineNbr>\d+),?(?<oldNumberOfLines>\d+)?\s\+(?<newLineNumber>\d+),?(?<newNumberOfLines>\d+)? @@/gm;
const diffFileRegex = /^\+\+\+\sb\/(?<filePath>.+\.rpy)/gmi;

export async function handler(argv) {
    let whichGit = which('git');
    let totalWords = 0;
    let totalDialogueWords = 0;
    if (whichGit?.code == 0) {
        let currentBranch = exec('git branch --show-current', { silent: true }).stdout;
        let gitCmd = `git rev-list --since ${since} ${currentBranch}`;
        let revList = exec(gitCmd, { silent: true }).stdout;
        const revListArray = revList.split('\n').filter(item => item !== "");
        for (const sha of revListArray) {
            // console.log(sha)
            let diffs = exec(`git diff -U0 --word-diff=porcelain ${sha}~1..${sha} 2>&1`, { silent: true }).stdout;
            // console.log(diffs);
            let diffsList = diffs.split('\n').filter(item => item !== "");
            for (let index = 0; index < diffsList.length; index++) {
                const diffLine = diffsList[index];
                if (addLineRegex.test(diffLine)) {
                    let diffLineWordCount = wordCount(diffLine);
                    totalWords += diffLineWordCount;
                    // console.log(`|${diffLine}|`)
                    let uniDiffObj = climbTheArrayIndex(diffsList, index, unifiedDiffRegex);
                    if (uniDiffObj.diffLineIndex > -1) {
                        // console.log('uniDiffObj', JSON.stringify(uniDiffObj, null, 2));
                        let fileNameObj = climbTheArrayIndex(diffsList, uniDiffObj.diffLineIndex + 1, diffFileRegex);
                        if (fileNameObj.diffLineIndex > -1) {
                            // console.log('fileNameObj', JSON.stringify(fileNameObj, null, 2))
                            // console.log('filePath', fileNameObj.matches.groups.filePath, 'lineNumber', uniDiffObj.matches.groups.newLineNumber);
                            let cwd = pwd().stdout;
                            // console.log('cwd', cwd);
                            let fullPath = `${cwd}/${fileNameObj.matches.groups.filePath}`;
                            // console.log('fullPath', fullPath);
                            let lineChanged = await readLineAt(fullPath, uniDiffObj.matches.groups.newLineNumber);
                            // console.log('lineChanged', lineChanged);
                            if (lineChanged) {
                                if (dialogRegex.test(lineChanged)) {
                                    // console.log('Dialogue found');
                                    totalDialogueWords += diffLineWordCount;
                                }
                            }
                        }
                    }
                    // console.log('ind', index);
                }
            }
        }
        console.log(kleur.cyan(` Words added to repo since ${since} today `));
        console.log(kleur.cyan(` Total Words added to repo            : ${totalWords}`));
        console.log(kleur.cyan(` Total Dialogue Words added to repo   : ${totalDialogueWords}`));
    } else {
        console.log(kleur.red('A global installation of git is required!'));
    }
    return argv;
}

async function readLineAt(filePath, lineNumber) {
    let line;
    let cursor = 0;
    let zeroBasedLineNumber = lineNumber - 1;
    if(fs.existsSync(filePath)){
        try {
            const rl = readline.createInterface({
                input: fs.createReadStream(filePath),
                crlfDelay: Infinity
            });
            for await (const theLine of rl){
                if(cursor == zeroBasedLineNumber){
                    let cleanLine = theLine.replace(/[^\x20-\x7E]+/g, ''); // remove non-visible characters
                    // console.log(`Line from file ${cursor + 1}: ${cleanLine}`);
                    rl.close();
                    line = cleanLine;
                }
                cursor++;
            }
        } catch (error) {
            console.error(new Error(`Unable to read line ${zeroBasedLineNumber} from file ${filePath}`, error))
        }
    } else {
        console.log(kleur.underline().red(`File ${filePath} does not exist.`));
    }
    return line;
}

function climbTheArrayIndex(array, startingIndex, regexPattern) {
    let proposedDiffLineIndex = startingIndex;
    let diffLineIndex = -1;
    let giveUp = false;
    let m;
    while (!giveUp) {
        let checkDiffLineIndex = --proposedDiffLineIndex;
        if (checkDiffLineIndex < 0) {
            giveUp = true;
            break;
        }
        let proposedDiffLine = array[checkDiffLineIndex];
        if (regexPattern.test(proposedDiffLine)) {
            // console.log(proposedDiffLine);
            diffLineIndex = checkDiffLineIndex;
            while ((m = regexPattern.exec(proposedDiffLine)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regexPattern.lastIndex) {
                    regexPattern.lastIndex++;
                }
                break;
            }
            m = regexPattern.exec(proposedDiffLine);
            giveUp = true;
            break;
        }
    }
    return {
        diffLineIndex: diffLineIndex,
        matches: m
    };
}

function wordCount(str) {
    return str.split(' ')
        .filter(s => s != '')
        .length
}