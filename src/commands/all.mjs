import shelljs from 'shelljs';
const { exec } = shelljs;
const regex = /^(.+):(\d+):(\d+) - .+\((\w+)\)/gm;

export const command = "all";
export const describe = "perform full spell check of all rpy files";
export const aliases = ['a'];
export function handler (argv){
    var shellCheck = exec("./node_modules/.bin/cspell '**/*.rpy'", {silent:true}).stdout;
    let m;
    let i = 0;
    while ((m = regex.exec(shellCheck)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        i++;
        
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex > 0) {
                console.log(`Found match # ${i}, group ${groupIndex}: ${match}`);
            }
        });
    }
}
