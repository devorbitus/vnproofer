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
        choices: [
            { title: 'Init Config', description: 'Create initial cSpell.json file from template (disabled if already exists)', value: 'createConfig', disabled: cSpellConfigExists },
        ]
    }
    const answers = await prompt(setupQuestions, {onCancel:cancelHandler, onSubmit:submitHandler});
    // console.log(answers);
    switch (answers.setupMenu) {
        case "createConfig":
            createInitialConfig();
            break;
        default:
            break;
    }
}
function cancelHandler(blah){
    console.log('entered cancelHandler', console.log(JSON.stringify(blah,null,2)));
}
async function submitHandler(){
    console.log('entered submitHandler');
}

async function createInitialConfig(){
    let charNames = extractCharacters();
    let templateConfigJson = await getTemplateConfig();
    templateConfigJson.words.push(...charNames);
    fs.writeFileSync('cspell.json',JSON.stringify(templateConfigJson,null,2));
    if (fs.existsSync('cspell.json')) {
        let hasCharNames = charNames.length > 0;
        const charNameMsg = ' and existing character names have been added to the dictionary';
        let msg = `Success! cSpell.json file was created from template${hasCharNames ? charNameMsg : ''}!`
        console.log(kleur.cyan(msg));
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
    // console.log('allFilesFiltered', JSON.stringify(allFilesFiltered, null, 2));
    const charNames = [];
    allFilesFiltered.forEach( (file) => {
        let grepResults = grep('--', regex ,file).stdout;
        if(grepResults){
            // console.log('grepResults', grepResults);
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

