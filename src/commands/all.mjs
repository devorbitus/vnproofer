import shelljs from 'shelljs';
const { which, exec } = shelljs;
const regex = /^(?<filePath>.+):(?<lineNumber>\d+):(?<columnNumber>\d+) - .+\((?<misspelledWord>\w+)\)/gm;

export const command = "all";
export const describe = "perform full spell check of all rpy files";
export const aliases = ['a'];
export async function handler (argv){
    var cSpellWhich = which('cspell');
    if(cSpellWhich.code !== 0){
        console.log(kleur.red('A global installation of cspell is required! Install using \"npm install -g cspell\"'));
    } else {
        exec("cspell '**/*.rpy'", {silent:false}).stdout;
    }
}
