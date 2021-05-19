# VNProofer
VNProofer is a Command-line Ren'Py Visual Novel proofreading tool.

<!-- TOC -->
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Via NPM](#via-npm)
    - [Global installation:](#global-installation)
- [Usage](#usage)
  - [Help Menu](#help-menu)
  - [Config](#config)
    - [Config Command](#config-command)
    - [Config Help](#config-help)
      - [Sub Commands](#sub-commands)
        - [Initial Config](#initial-config)
        - [Update character exclusions](#update-character-exclusions)
  - [Check](#check)
    - [Check Command](#check-command)
  - [All](#all)
    - [All Command](#all-command)
    - [All Help](#all-help)
  - [Counts](#counts)
    - [Counts Command](#counts-command)
    - [Counts Help](#counts-help)
  - [Exclude](#exclude)
    - [Exclude Command](#exclude-command)
    - [Exclude Help](#exclude-help)
- [Todo](#todo)
<!-- /TOC -->

## Features
 - Ability to generate a cSpell configuration file for the Ren'Py visual novel
    - Character names are automatically added to the local dictionary
 - Ability to automatically add newly added characters to the local dictionary
 - Ability to count both words added and dialogue words added today by examining git commit history
 - Ability to add words misspelled on purpose to file level exclusion list

## Requirements
 - A copy of cspell must have been installed globally `npm i cspell -g` to do any spell checking
 - VNProofer is designed to work with a codebase of `*.rpy` files in any directory structure from the root.
    - `*.rpa` files will need to be decompressed
    - `*.rpyc` files will need to be decompressed

## Installation

### Via NPM

It would be best to have Node.js and NPM already installed (or you are willing to do it).

#### Global installation:

```
npm i vnproofer cspell -g
```

## Usage

### Help Menu

Use either `-h` or `--help` at any level
```
vnproofer --help
vnproofer -h
vnproofer config --help
vnproofer check --help
vnproofer all -h
```

### Config

Displays the configuration menu

#### Config Command
```
vnproofer config
```
#### Config Help
```
$ vnproofer config --help
vnproofer config

Configure vnproofer

Options:
  -v, --version         Show version number                                      [boolean]
  -s, --suppress-intro  Suppress intro of command               [boolean] [default: false]
  -h, --help            Show help                                                [boolean]
```

##### Sub Commands

###### Initial Config

Create an initial cspell.json file from a template (disabled if it already exists). VNProofer will automatically add any defined character names to the workspace dictionary list.

###### Update character exclusions

Add any new characters to the workspace dictionary list that were not previously added.

### Check

Check an individual file for spelling errors

#### Check Command
```
vnproofer check ./myfile.rpy
```
or
```
vnproofer c ./myfile.rpy
```

### All

Perform a complete spell check of all rpy files using cSpell

#### All Command
```
vnproofer all
```
or
```
vnproofer a
```

#### All Help
```
$ vnproofer all --help
vnproofer all

perform full spell check of all rpy files

Options:
  -v, --version         Show version number                                      [boolean]
  -s, --suppress-intro  Suppress intro of command               [boolean] [default: false]
  -h, --help            Show help                                                [boolean]
```

### Counts

Query git to find out how many words and how many dialogue words have been committed since 1 am today

#### Counts Command
```
vnproofer counts
```
or
```
vnproofer n
```
#### Counts Help

```
$ vnproofer counts --help
vnproofer counts

Query git to find out how many words have been committed today

Options:
  -v, --version         Show version number                                      [boolean]
  -s, --suppress-intro  Suppress intro of command               [boolean] [default: false]
  -m, --only-me         Only show my own counts                 [boolean] [default: false]
  -b, --verbose         Show detailed logs of changes with word counts for examination
                                                                [boolean] [default: false]
  -h, --help            Show help                                                [boolean]
```

### Exclude

Handle words that are spelled wrong on purpose. If there is already a word exclusion list at the top of the file, the command will add the lowercase version of the word to the existing list in alphabetical order. Otherwise, it will add a new exclusion to the top of the file.

#### Exclude Command
```
vnproofer exclude ./myfile.rpy yall
```
or
```
vnproofer e ./myfile.rpy yall
```
#### Exclude Help
```
$ vnproofer exclude --help
vnproofer exclude <file> <word>

Handle words that are spelled wrong on purpose

Positionals:
  file  File path that has the misspelled word                         [string] [required]
  word  Word to exclude from misspelled words within file              [string] [required]

Options:
  -v, --version         Show version number                                      [boolean]
  -s, --suppress-intro  Suppress intro of command               [boolean] [default: false]
  -h, --help            Show help                                                [boolean]
```

## Todo
- [x] Utility to show how many words added as well as how many dialog words have been added today by pulling all changes added to a git repo
- [ ] Ability to automatically add the [cSpell GitHub action](https://github.com/marketplace/actions/cspell-action) to an existing codebase
- [x] Ability to add words misspelled on purpose to an exclusion list at the top of the file
- [ ] Ability to add file-level excluded words to the local dictionary if the exclusion is used in more than one file and remove the local exclusion from all files
- [ ] Ability to iterate over each misspelled word and choose how to handle it (add to file level exclusion, add to the local dictionary)
- [ ] Ability to iterate over all-new dialogue (like a new pull request to review)
- [ ] Ability to view all Ren'Py lint issues
- [ ] Ability to automatically add [Ren'Py linting GitHub action](https://github.com/marketplace/actions/lint-ren-py-project) to an existing codebase
- [ ] Ability to run a line of dialogue through a command-line grammatical tool like [gramma](https://caderek.github.io/gramma/)
- [ ] Ability to install global cSpell installation through config menu if not already installed
- [ ] Ability to install global gramma installation through config menu if not already installed
- [ ] Ability to extract from `*.rpa` files
- [ ] Ability to extract from `*.rpyc` files
- [ ] Ability to automatically generate a corrections file to be sent to an author to facilitate automatically correcting issues
- [ ] Ability to automatically add recommended VSCode extensions for Ren'Py
