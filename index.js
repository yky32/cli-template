#!/usr/bin/env node


// /*
// /$$$$$$$$ /$$$$$$ / $$$$$$$ / $$$$$$$$ / $$$$$$ / $$ / $$ / $$$$$$ / $$$$$$$ / $$
// | $$_____/|_  $$_/| $$__  $$| $$_____/ /$$__  $$| $$  | $$|_  $$_/| $$__  $$|__/
// | $$        | $$  | $$  \ $$| $$      | $$  \__/| $$  | $$  | $$  | $$  \ $$ /$$  /$$$$$$
// | $$$$$     | $$  | $$$$$$$/| $$$$$   |  $$$$$$ | $$$$$$$$  | $$  | $$$$$$$/| $$ /$$__  $$
// | $$__/     | $$  | $$__  $$| $$__/    \____  $$| $$__  $$  | $$  | $$____/ | $$| $$  \ $$
// | $$        | $$  | $$  \ $$| $$       /$$  \ $$| $$  | $$  | $$  | $$      | $$| $$  | $$
// | $$       /$$$$$$| $$  | $$| $$$$$$$$|  $$$$$$/| $$  | $$ /$$$$$$| $$ /$$  | $$|  $$$$$$/
// |__/      |______/|__/  |__/|________/ \______/ |__/  |__/|______/|__/|__/  |__/ \______/
// */

import chalk from 'chalk';
import inquirer from 'inquirer';
import chalkAnimation from 'chalk-animation';
import {createSpinner} from 'nanospinner';
import axios from "axios";
import {readFileSync} from 'fs';

const data = readFileSync('.config/appConfig.json');
let appConfig = JSON.parse(data)
let hostname;
let basePath;
let playerName = 'WY__';

const FEATURE_1 = 'list-active-projects';

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function init () {
    // load config
    const _featureOptions = readFileSync('.config/features/featureOptions.json');
    let featureOptions = JSON.parse(_featureOptions)

    for (const feature of appConfig.features) {
        featureOptions.name = feature.name
        featureOptions.type = feature.type
        appConfig.featureOptions.push(featureOptions)
    }
}

async function welcome() {
    const rainbowTitle = chalkAnimation.rainbow(
        'Welcome to Wayne Yu cli ?'
    );
    await sleep();
    rainbowTitle.stop();

    console.log(`
    ${chalk.bgBlue('HOW TO PLAY - Please select below')} 
    I am a process on your computer.
  `);
}

async function askQuestionForInput(questionName) {
    const answers = await inquirer.prompt({
        name: "player_input",
        type: 'input',
        message: 'What is ' + questionName + '?',
        default() {
            return '--';
        },
    });
    return answers.player_input;
}

async function askForFeatures() {
    const answers = await inquirer.prompt({
        name: 'choose_features',
        type: 'list',
        message: 'What you are going to do / check?\n',
        choices: appConfig.features,
    });
    appConfig.actions.push(123)
    return handleAnswer(answers.choose_features);
}


async function loopAndAskJsonObject(jsonObject) {
    for (let fieldName in jsonObject) {
        // Ask input
        let answer = await askQuestionForInput(fieldName)
        if (answer) {
            jsonObject[fieldName] = answer
        }
        if (typeof jsonObject[fieldName] === 'object') {
            await loopAndAskJsonObject(jsonObject[fieldName])
        }
    }
}

async function handleAnswer(answer) {
    const spinner = createSpinner('Checking answer...').start();
    await sleep();

    for (const featureOption of appConfig.featureOptions) {
        if (featureOption.name === answer) {
            spinner.success({text: `Nice work ${playerName}. That's a legit answer`});
            // take out the questions to ask ppl
            for (let questionObject of featureOption.questions) {
                await loopAndAskJsonObject(questionObject)
            }
            // end of asking, review the answer
            console.log("=> featureOption.questions ->", featureOption.questions);
        } else {
            spinner.error({text: `💀💀💀 Game over, thank you ${playerName}!`});
            process.exit(1);
        }
    }
}

async function takeAction() {
    console.log(appConfig.actions)
}



// Run it with top-level await
console.clear();
await init();
await welcome();
await askForFeatures();
await takeAction()