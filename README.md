# VNProofer
VNProofer is a Command-line Ren'Py Visual Novel proofreading tool.

<!-- TOC -->
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
    - [Via NPM](#via-npm)
        - [Global installation:](#global-installation)
        - [Local installation (as a dev tool for your project):](#local-installation-as-a-dev-tool-for-your-project)
- [Usage](#usage)
    - [Help Menu](#help-menu)
    - [Config](#config)
        - [Command](#command)
            - [Sub Commands](#sub-commands)
                - [Initial Config](#initial-config)
                - [Update character exclusions](#update-character-exclusions)
    - [Check](#check)
        - [Command](#command)
    - [All](#all)
        - [Command](#command)
- [Todo](#todo)
<!-- /TOC -->

## Features
 - Ability to generate a cSpell configuration file for the Ren'Py visual novel
    - Character names are automatically added to the local dictionary
 - Ability to automatically add newly added characters to the local dictionary

## Requirements
 - VNProofer is designed to work with a codebase of `*.rpy` files in any directory structure from the root.
    - `*.rpa` files will need to be decompressed
    - `*.rpyc` files will need to be decompressed

## Installation

### Via NPM

It would be best to have Node.js and NPM already installed (or you are willing to do it).

#### Global installation:

```
npm i vnproofer -g
```

#### Local installation (as a dev tool for your project):

```
npm i vnproofer -D
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

#### Command
```
vnproofer config
```

##### Sub Commands

###### Initial Config

Create an initial cspell.json file from a template (disabled if it already exists). VNProofer will automatically add any defined character names to the workspace dictionary list.

###### Update character exclusions

Add any new characters to the workspace dictionary list that were not previously added.

### Check

Check an individual file for spelling errors

#### Command
```
vnproofer check ./myfile.rpy
```

### All

Perform a complete spell check of all rpy files using cSpell

#### Command
```
vnproofer all
```

## Todo
- [ ] Utility to show how many words added as well as how many dialog words have been added today by pulling all changes added to a git repo
- [ ] Ability to automatically add the [cSpell GitHub action](https://github.com/marketplace/actions/cspell-action) to an existing codebase
- [ ] Ability to add words misspelled on purpose to an exclusion list at the top of the file
- [ ] Ability to add file-level excluded words to the local dictionary if the exclusion is used in more than one file and remove the local exclusion from all files
- [ ] Ability to iterate over each misspelled word and choose how to handle it (add to file level exclusion, add to the local dictionary)
- [ ] Ability to iterate over all-new dialogue (like a new pull request to review)
- [ ] Ability to view all Ren'Py lint issues
- [ ] Ability to automatically add [Ren'Py linting GitHub action](https://github.com/marketplace/actions/lint-ren-py-project) to an existing codebase
- [ ] Ability to run a line of dialogue through a command-line grammatical tool like [gramma](https://caderek.github.io/gramma/)
- [ ] Ability to install global cSpell installation through config menu if not already installed
- [ ] Ability to install global gramma installation through config menu if not already installed
