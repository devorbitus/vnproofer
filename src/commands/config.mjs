import kleur from "kleur";
import fs from "fs";
import fetch from 'node-fetch';
import prompt from 'prompts';
import shelljs from 'shelljs';
const { echo, grep, find } = shelljs;
const templateUrl = "https://raw.githubusercontent.com/devorbitus/vnproofer/main/cspell.empty.json"
const regex = /Character\("([\w|\[|\]]+)"/gm;

export const command = "config";
export const describe = "Configure vnproofer";
export const aliases = ['a'];

export async function handler (argv){
    let cSpellConfigExists = fs.existsSync('cspell.json');
    
    let setupQuestions = {
        type: 'select',
        name: 'setupMenu',
        message: 'What would you like to do?',
        initial: cSpellConfigExists ? 1 : 0,
        choices: [
            { title: 'Initial Config', description: 'Create initial cSpell.json file from template (disabled if already exists)', value: 'createConfig', disabled: cSpellConfigExists },
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
            console.log('Exiting')
            break;
        case "updateChar":
            updateCharConfig();
            break;
        default:
            break;
    }
}
function cancelHandler(){
    console.log('entered cancelHandler');
}
async function submitHandler(){
    // Do nothing
}

async function createInitialConfig(){
    let charNames = extractCharacters();
    let templateConfigJson = await getTemplateConfig();
    templateConfigJson.words.push(...charNames);
    fs.writeFileSync('cspell.json',JSON.stringify(templateConfigJson,null,2));
    if (fs.existsSync('cspell.json')) {
        let hasCharNames = charNames.length > 0;
        const charNameMsg = ' and existing character names have been added to the dictionary';
        let msg = `Success! cspell.json file was created from template${hasCharNames ? charNameMsg : ''}!`
        console.log(kleur.cyan(msg));
    } else {
        console.log(kleur.red('Unable to create cspell.json file!'))
    }
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

function extractCharacters(){
    const allFilesFiltered = [...find('.').filter(file => file.endsWith('.rpy') )];
    const charNames = [];
    allFilesFiltered.forEach( (file) => {
        let grepResults = grep('--', regex ,file).stdout;
        if(grepResults){
            let m;
            while ((m = regex.exec(grepResults)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                let charName = m[1];
                let filteredCharName = charName.replace(/[\[\]]/g,'');
                charNames.push(filteredCharName);
            }
        }
    });
    return charNames;
}

function updateCharConfig(){
    let charNames = extractCharacters();
    let configJsonString = fs.readFileSync('cspell.json');
    let configJson = JSON.parse(configJsonString);
    let existingWords = configJson.words;
    let updatedWordList = [...new Set([].concat(existingWords, charNames))].sort();
    let wordCountDiff = updatedWordList.length - existingWords.length
    configJson.words = updatedWordList;
    
    if(wordCountDiff !== 0){
        fs.writeFileSync('cspell.json',JSON.stringify(configJson,null,2));
        console.log(kleur.cyan(`Successfully added ${wordCountDiff} new character${wordCountDiff > 1 ? 's':''}!`));
    } else {
        console.log(kleur.yellow('No new characters found to add so nothing to do'));
    }
}

