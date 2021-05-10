import kleur from "kleur";
import fs from "fs";
import fetch from 'node-fetch';
import prompt from 'prompts';
import shelljs from 'shelljs';
import cliProgress from 'cli-progress';
const { echo, grep, find } = shelljs;
const templateUrl = "https://raw.githubusercontent.com/devorbitus/vnproofer/main/cspell.empty.json"
const charRegex = /define(?:\s+)?(?<charDef>\w+)?\s+=\s+Character(?:\(_)?(?:\s+)?\((?:\s+)?["|'](?<charName>[\w|\[|\]]+)["|']/gm;
const nickNamesRegex = /["|'].+\[(?<nickName>\w+)\].+["|']/gm;
const dialogRegex = /^(?:\s+)?(?:\w+(?:\s+)?){0,3}["|'].+["|']/gm;
const variableRegex = /^\s+\$(?:\s+)?(?<varName>\w+)(?:\s+)?=(?:\s+)?["|']\w+["|']/gm

export const command = "config";
export const describe = "Configure vnproofer";
export const aliases = ['a'];

export async function handler (argv){
    let cSpellConfigExists = fs.existsSync('cspell.json');
    console.log(kleur.green('Configuration Menu:'));
    console.log('');
    let setupQuestions = {
        type: 'select',
        name: 'setupMenu',
        message: 'What would you like to do?',
        initial: cSpellConfigExists ? 1 : 0,
        choices: [
            { title: 'Initial Config', description: 'Create initial cspell.json file from template (disabled if already exists)', value: 'createConfig', disabled: cSpellConfigExists },
            { title: 'Update character exclusions', description: 'Add any new characters to workspace dictionary list', value: 'updateChar', disabled: !cSpellConfigExists },
            { title: 'Cancel', value: 'cancel'}
        ]
    }
    const answers = await prompt(setupQuestions, {onCancel:cancelHandler, onSubmit:submitHandler});
    switch (answers.setupMenu) {
        case "createConfig":
            createInitialConfig();
            break;
        case "cancel":
            console.log('Exiting');
            break;
        case "updateChar":
            updateCharConfig();
            break;
        default:
            break;
    }
    return argv;
}
function cancelHandler(){
    console.log('User cancelled.');
}
async function submitHandler(){
    // Do nothing
}

class RenPyFileHandler {
    handle;
    resultArray;
    finalize;
    constructor(handle, resultArray, finalize) {
        this.handle = handle;
        this.resultArray = resultArray;
        this.finalize = finalize;
    }
}

async function createInitialConfig(){
    loopThroughRenpyFiles([new RenPyFileHandler(characterHandler,[],charSummaryHandler)], {initial: true});
}

function updateCharConfig(){
    loopThroughRenpyFiles([new RenPyFileHandler(characterHandler,[],charSummaryHandler)], {initial: false});
}

async function getTemplateConfig(){
    let templateJson;
    try {
        const response = await fetch(templateUrl);
        templateJson = await response.json();
    } catch (error) {
        console.error(new Error('Unable to download cSpell.json template from GitHub'))
    }
    return templateJson;
}

function loopThroughRenpyFiles(handlers, options){
    const allFilesFiltered = [...find('.').filter(file => file.endsWith('.rpy') )];
    const rpyFileBar = new cliProgress.SingleBar({stopOnComplete:true}, cliProgress.Presets.shades_classic);
    let totalCount = allFilesFiltered.length;
    rpyFileBar.start(totalCount, 0);
    allFilesFiltered.forEach( (file, ind) => {
        rpyFileBar.update(ind + 1);
        handlers.forEach( handler => handler.handle(file, handler));
    });
    handlers.forEach( handler => handler.finalize(options, handler));
    rpyFileBar.stop();
}

async function charSummaryHandler(options, charHandler){
    const charNamesRaw = charHandler.resultArray;
    const charNames = [...new Set([].concat(charNamesRaw))].sort();
    charHandler.resultArray = charNames;
    if (options.initial) {
        let templateConfigJson = await getTemplateConfig();
        templateConfigJson.words.push(...charNames);
        fs.writeFileSync('cspell.json',JSON.stringify(templateConfigJson,null,2));
        if (fs.existsSync('cspell.json')) {
            let hasCharNames = charNames.length > 0;
            const charNameMsg = ' and existing character names have been added to the dictionary';
            let msg = `Success! cspell.json file was created from template${hasCharNames ? charNameMsg : ''}!`;
            console.log(kleur.cyan(msg));
        } else {
            console.log(kleur.red('Unable to create cspell.json file!'));
        }
    } else {
        let configJsonString = fs.readFileSync('cspell.json');
        if(configJsonString){
            let configJson = JSON.parse(configJsonString);
            let existingWords = configJson.words;
            let updatedWordList = [...new Set([].concat(existingWords, charNames))].sort();
            let wordCountDiff = updatedWordList.length - existingWords.length;
            configJson.words = updatedWordList;
            console.log('');
            if(wordCountDiff !== 0){
                fs.writeFileSync('cspell.json',JSON.stringify(configJson,null,2));
                console.log(kleur.cyan(`Successfully added ${wordCountDiff} new character${wordCountDiff > 1 ? 's':''}!`));
            } else {
                console.log(kleur.yellow('No new characters found to add so nothing to do'));
            }
        } else {
            console.log(kleur.red('Unable to read cspell.json file!'));
        }
    }
}

function characterHandler(file, charHandler){
    const charNamesArray = charHandler.resultArray;
    const declaredCharNames = extractCharacters(extractInformation(file, charRegex), charNamesArray);
    const charNickNames = extractCharacters(extractInformation(file, nickNamesRegex), charNamesArray);
    const charNames = [...new Set([].concat(declaredCharNames, charNickNames))].sort();
    handler.resultArray = charNames;
}

function extractCharacters(charMatches, charNames){
    for (const m of charMatches) {
        if ('charName' in m.groups) {
            let charName = m.groups.charName;
            let filteredCharName = charName.replace(/[\[\]]/g, '').toLowerCase();
            if (filteredCharName) charNames.push(filteredCharName);
        }
        if ('charDef' in m.groups) {
            let charVar = m.groups.charDef;
            if (charVar) charNames.push(charVar.toLowerCase());
        }
        if('nickName' in m.groups) {
            let charNickName = m.groups.nickName;
            if (charNickName) charNames.push(charNickName);
        }
    }
    const cleanCharNames = [...new Set([].concat(charNames))];
    return cleanCharNames;
}

function extractInformation(file, searchRegex, confirmRegex) {
    let grepResults = grep('--', searchRegex, file).stdout;
    const matches = [];
    if (grepResults) {
        let m;
        while ((m = searchRegex.exec(grepResults)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === searchRegex.lastIndex) {
                searchRegex.lastIndex++;
            }
            matches.push(m);
        }
    }
    return matches;
}
