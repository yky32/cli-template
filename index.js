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
let playerName = 'WY__';

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

async function init () {
    // load config
    const _featureMapping = readFileSync('.config/features/featureMapping.json');
    let featureMapping = JSON.parse(_featureMapping)
    appConfig.featureMapping = featureMapping
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
    return handleAnswer(answers.choose_features);
}

async function handleAnswer(answer) {
    console.log('-- you selected: ', answer)
    const spinner = createSpinner('Checking answer...').start();
    await sleep();
    for (const feature of appConfig.features) {
        if (feature.name === answer) {
            spinner.success({text: `Nice work ${playerName}. That's a legit answer`});
            appConfig.selected.push(feature.key)
        } else {
            spinner.error({text: `💀💀💀 Game over, thank you ${playerName}!`});
            process.exit(1);
        }
    }
    // find question to ask
    let questions = []
    for (const key of appConfig.selected) {
        questions = appConfig.featureMapping[key]
        appConfig.actionPlan[key] = {}
    }
    for (const key of appConfig.selected) {
        for (const question of questions) {
            let answer = await askQuestionForInput(question);
            if (answer) {
                let answerObject = appConfig.actionPlan[key]
                answerObject[question] = answer
            }
        }
    }
    // print out setting____
    console.log('-- appConfig: ', appConfig)
}

async function takeAction() {
    for (const key of appConfig.selected) {
        if (key=== 'api') {
            let config = appConfig.actionPlan[key]
            for (let i = 0; i < config.numberOfCall; i++) {
                let response = await axios.get(config.url);
                if (response) console.log(response.data)
            }
        }
    }
}


// Run it with top-level await
console.clear();
await init();
await welcome();
await askForFeatures(); // also askQuestions
await takeAction();