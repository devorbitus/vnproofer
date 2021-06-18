import shelljs, { ShellString } from 'shelljs';
import kleur from 'kleur';
import fs from 'fs';
import parseDiff, { Change, Chunk, File } from 'parse-diff';
import esr from 'escape-string-regexp';
import { ln } from 'line-number';
import { WordCountDiff } from '../utils/util';
import { demandOption } from 'yargs';
const { which, exec } = shelljs;
export const command = "counts";
export const describe = "Query git to find out how many words have been committed today";
export const aliases = ['n'];
export function builder(yargs:any) {
    yargs.option('only-me', {
        alias: "m",
        type: "boolean",
        default: false,
        describe: "Only show my own counts"
    });
    yargs.option('verbose', {
        alias: "b",
        type: "boolean",
        default: false,
        describe: "Show detailed logs of changes with word counts for examination"
    });
}
const since: string = "1am";
const addLineRegex: RegExp = /^\+[^\+]/g;
const dialogRegex: RegExp = /^(?:\s+)?(?:\w+(?:\s+)?){0,3}["|'](?<dialogue>.+)["|'](?:\s+)?$/m;
const unifiedDiffRegex: RegExp = /^@@ -(?<oldLineNbr>\d+),?(?<oldNumberOfLines>\d+)?\s\+(?<newLineNumber>\d+),?(?<newNumberOfLines>\d+)? @@/gm;
const diffFileRegex: RegExp = /^\+\+\+\sb\/(?<filePath>.+\.rpy)/gmi;
const MINIMUM_WORD_COUNT: number = 4;

export async function handler(argv: any) {
    let whichGit: ShellString = which('git');
    let totalWords: number = 0;
    let totalDialogueWords: number = 0;
    if (whichGit?.code == 0) {
        if (!argv.suppressIntro) {
            console.log(kleur.yellow('Looking up git commit history...'));
        }
        let currentBranch: string = exec('git branch --show-current', { silent: true }).stdout;
        // console.log('argv', JSON.stringify(argv,null,2))
        let authorRestriction: string = "";
        if (argv.onlyMe) {
            let currentAuthor = exec(`git config user.name`, { silent: true }).stdout;
            if (currentAuthor) {
                console.log(kleur.magenta(`Filtering only commits by author ${currentAuthor}`))
                authorRestriction = `--author '${currentAuthor}'`
            }
        }
        let gitCmd: string = `git rev-list ${authorRestriction} --since '${since}' ${currentBranch}`;
        let revList: string = exec(gitCmd, { silent: true }).stdout;
        const revListArray: string[] = revList.split('\n').filter(item => item !== "") || [];
        // console.log('revListArray', JSON.stringify(revListArray, null, 2))
        if (revListArray.length) {
            let newestCommit: string = revListArray[revListArray.length - 1];
            let oldestCommit: string = revListArray[0];
            let diffs: string = exec(`git diff -U0 --word-diff=porcelain ${newestCommit}~1..${oldestCommit} 2>&1`, { silent: true }).stdout;
            // console.log(diffs);
            let files = parseDiff(diffs);
            let rpyFiles: File[] = files.filter(diff => diff?.to?.toLowerCase().endsWith('.rpy') && diff.additions > 0);
            let filteredRpyFiles: File[] = rpyFiles.map(diff => {
                let fileContents: string = fs.readFileSync(diff?.to as string, 'utf8');
                // console.log('diff', JSON.stringify(diff, null, 2));
                let chunks: Chunk[] = diff.chunks;
                let newChunks = chunks.map(chunk => {
                    let chunkChanges: Change[] = chunk.changes.filter(change => change.type == "normal" || change.type == "add");
                    chunk.changes = chunkChanges.map(chunk => {
                        let newChunk: WordCountDiff = chunk as WordCountDiff;
                        newChunk.dialogueWordCount = 0;
                        newChunk.wordCount = wordCount(newChunk.content);
                        if (newChunk.type === "add") {
                            newChunk.content = newChunk.content.substring(0, 1) === "+" ? newChunk.content.substring(1) : newChunk.content;
                            newChunk.dialogueWordCount = dialogRegex.test(newChunk.content) ? newChunk.wordCount : 0;
                        }
                        if (newChunk.wordCount >= MINIMUM_WORD_COUNT && newChunk.dialogueWordCount == 0) {
                            // no dialogue words found but could maybe check the line the words are on in the file
                            let wordCount: number = dialogueWordCount(fileContents, newChunk.content);
                            newChunk.dialogueWordCount = wordCount;
                        }
                        return newChunk;
                    });
                    return chunk;
                });
                diff.chunks = newChunks;
                return diff;
            });
            if (argv.verbose) {
                console.log('All files changed', JSON.stringify(filteredRpyFiles, null, 2));
            }
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

function subTotalWordCount(filteredRpyFiles: File[], isDialog: boolean = false) {
    let totalWords = 0;
    function changeReducer(innerInnerSum: any, changeObj: WordCountDiff): number {
        if (isDialog) {
            return changeObj.dialogueWordCount + innerInnerSum;
        } else {
            return changeObj.wordCount + innerInnerSum;
        }
    }
    function chunkReducer(innerSum: number, chunkObj: Chunk): number {
        let changeCount: number = (chunkObj.changes as WordCountDiff[]).reduce(changeReducer, 0);
        return changeCount + innerSum;
    }
    function diffFileObjReducer(accumulator: number, diffFileObj: File): number {
        let chunkCount = diffFileObj.chunks.reduce(chunkReducer, 0);
        return chunkCount + accumulator;
    }
    totalWords = filteredRpyFiles.reduce(diffFileObjReducer, 0);
    return totalWords;
}

function dialogueWordCount(fileContents: string, stringToCheck = "") {
    let dialogueWordCount = 0;
    const trimmedStringToCheck = stringToCheck.trim();
    const searchRegexString = esr(trimmedStringToCheck);
    const searchRegex = new RegExp(searchRegexString);
    if (fileContents) {
        let lineMatches: LineNumberReturnObject[] = ln(fileContents, searchRegex);
        if (lineMatches.length) {
            let isDialogue: boolean = lineMatches.some(lineMatch => dialogRegex.test(lineMatch.line));
            if (isDialogue) {
                dialogueWordCount = wordCount(trimmedStringToCheck);
            }
        }
    }
    return dialogueWordCount;
}

function wordCount(str: string) {
    return str.split(' ')
        .filter(s => s != '')
        .length
}
