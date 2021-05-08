import kleur from "kleur";
import fs from "fs";
import shelljs from 'shelljs';
const { exec } = shelljs;

export const command = "check <file>";
export const describe = "check file for spelling errors";
export function builder (yargs) {
    yargs.positional('file', {
        describe: "file to check for spelling errors",
        type: 'string'
    });
};
export const aliases = ['c'];
export function validation (foo, bar) {
    console.log('foo', foo);
    console.log('bar', bar);
}
export async function handler (argv) {
    if (!argv.file) {
        console.log(kleur.red('Please provide a file path.'))
        process.exit(1);
    }

    if (!fs.existsSync(argv.file) || argv.file === "." || argv.file ==="..") {
        console.log('argv', JSON.stringify(argv,null,2))
        console.log(kleur.red("There is no such file!"))
        process.exit(1)
    }
    var shellCheck = exec("./node_modules/.bin/cspell '**/*.rpy'").stdout;
    console.log("shellCheck", shellCheck);
}
