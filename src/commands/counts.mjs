import shelljs from 'shelljs';
import kleur from 'kleur';
import fs from 'fs';
import parseDiff from 'parse-diff';
import esr from 'escape-string-regexp';
import ln from 'line-number';
const { which, exec, pwd } = shelljs;
export const command = "counts";
export const describe = "Query git to find out how many words have been committed today";
export const aliases = ['n'];
const since = "'1am'";
const addLineRegex = /^\+[^\+]/g;
const dialogRegex = /^(?:\s+)?(?:\w+(?:\s+)?){0,3}["|'](?<dialogue>.+)["|'](?:\s+)?$/m;
const unifiedDiffRegex = /^@@ -(?<oldLineNbr>\d+),?(?<oldNumberOfLines>\d+)?\s\+(?<newLineNumber>\d+),?(?<newNumberOfLines>\d+)? @@/gm;
const diffFileRegex = /^\+\+\+\sb\/(?<filePath>.+\.rpy)/gmi;
const MINIMUM_WORD_COUNT = 4;

export async function handler(argv) {
    let whichGit = which('git');
    let totalWords = 0;
    let totalDialogueWords = 0;
    if (whichGit?.code == 0) {
        let currentBranch = exec('git branch --show-current', { silent: true }).stdout;
        let gitCmd = `git rev-list --since ${since} ${currentBranch}`;
        let revList = exec(gitCmd, { silent: true }).stdout;
        const revListArray = revList.split('\n').filter(item => item !== "") || [];
        // console.log('revListArray', JSON.stringify(revListArray, null, 2))
        if (revListArray.length) {
            let cwd = pwd().stdout;
            let newestCommit = revListArray[revListArray.length - 1];
            let oldestCommit = revListArray[0];
            let diffs = exec(`git diff -U0 --word-diff=porcelain ${newestCommit}~1..${oldestCommit} 2>&1`, { silent: true }).stdout;
            // console.log(diffs);
            let files = parseDiff(diffs);
            let rpyFiles = files.filter(diff => diff.to.toLowerCase().endsWith('.rpy') && diff.additions > 0);
            let filteredRpyFiles = rpyFiles.map(diff => {
                let fileContents = fs.readFileSync(diff.to, 'utf8');
                // console.log('diff', JSON.stringify(diff, null, 2));
                let chunks = diff.chunks;
                let newChunks = chunks.map(chunk => {
                    let chunkChanges = chunk.changes.filter(change => change.type == "normal" || change.type == "add");
                    chunk.changes = chunkChanges.map(chunk => {
                        let newChunk = chunk;
                        newChunk.dialogueWordCount = 0;
                        newChunk.wordCount = wordCount(newChunk.content);
                        if (newChunk.type === "add") {
                            newChunk.content = newChunk.content.substring(0,1) === "+" ? newChunk.content.substring(1) : newChunk.content;
                            newChunk.dialogueWordCount = dialogRegex.test(newChunk.content) ? newChunk.wordCount : 0;
                        }
                        if (newChunk.wordCount >= MINIMUM_WORD_COUNT && newChunk.dialogueWordCount == 0) {
                            // no dialogue words found but could maybe check the line the words are on in the file
                            let wordCount = dialogueWordCount(fileContents, newChunk.content);
                            newChunk.dialogueWordCount = wordCount;
                        }
                        return newChunk;
                    });
                    return chunk;
                });
                diff.chunks = newChunks;
                return diff;
            });
            console.log('filteredRpyFiles', JSON.stringify(filteredRpyFiles, null, 2));
            totalDialogueWords = subTotalWordCount(filteredRpyFiles, true);
            totalWords = subTotalWordCount(filteredRpyFiles, false);
        } else {
            console.log(kleur.yellow('No commits found'));
        }
        console.log(kleur.cyan(` Words added to repo since ${since} today `));
        console.log(kleur.cyan(` Total Words added to repo            : ${totalWords}`));
        console.log(kleur.cyan(` Total Dialogue Words added to repo   : ${totalDialogueWords}`));
    } else {
        console.log(kleur.red('A global installation of git is required!'));
    }
    return argv;
}

function subTotalWordCount(filteredRpyFiles,isDialog = false){
    let totalWords = 0;
    function changeReducer(innerInnerSum, changeObj){
        if (isDialog) {
            return changeObj.dialogueWordCount + innerInnerSum;
        } else {
            return changeObj.wordCount + innerInnerSum;
        }
    }
    function chunkReducer(innerSum, chunkObj) {
        let changeCount = chunkObj.changes.reduce(changeReducer, 0);
        return changeCount + innerSum;
    }
    function diffFileObjReducer(accumulator, diffFileObj) {
        let chunkCount = diffFileObj.chunks.reduce(chunkReducer, 0);
        return chunkCount + accumulator;
    }
    totalWords = filteredRpyFiles.reduce(diffFileObjReducer,0);
    return totalWords;
}

function dialogueWordCount(fileContents, stringToCheck = ""){
    let dialogueWordCount = 0;
    const trimmedStringToCheck = stringToCheck.trim();
    const searchRegexString = esr(trimmedStringToCheck);
    const searchRegex = new RegExp(searchRegexString);
    if (fileContents) {
        let lineMatches = ln(fileContents,searchRegex);
        if (lineMatches.length) {
            let isDialogue = lineMatches.some(lineMatch => dialogRegex.test(lineMatch.line));
            if (isDialogue) {
                dialogueWordCount = wordCount(trimmedStringToCheck);
            }
        }
    }
    return dialogueWordCount;
}

function wordCount(str) {
    return str.split(' ')
        .filter(s => s != '')
        .length
}
