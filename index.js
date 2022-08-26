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
import inquirer  from 'inquirer';
import chalkAnimation from 'chalk-animation';
import {createSpinner} from 'nanospinner';
import axios from "axios";
import {readFileSync} from 'fs';


const YES = 'YES';
const NO = '--NO';
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

async function getAnswersFromList(rewrite = false, questionName, options = ['']) {
    let message = 'What is ' + questionName + '?';
    if (rewrite) message = questionName
    let answers = await inquirer.prompt({
        name: "player_input",
        type: 'list',
        message: message,
        choices: options,
    });
    return answers.player_input;
}

async function getAnswersFromInput(rewrite = false, questionName) {
    let message = 'What is ' + questionName + '?';
    if (rewrite) message = questionName
    let answers = await inquirer.prompt({
        name: "player_input",
        type: 'input',
        message: message,
        default() {
            return '--';
        },
    });
    return answers.player_input;
}

async function askQuestions(questionName) {
    let answers
    let qn = questionName.toUpperCase();

    if (qn === 'URL') {
        let protocol = await getAnswersFromList(false, 'Protocol', ['http', 'https']);
        let domain = await getAnswersFromInput(false, 'Domain');
        let portOption = await getAnswersFromList(false, 'Port', [NO, YES]);
        let port = ''
        if (YES === portOption) {
            let portInput = await getAnswersFromInput(false, 'Port Number');
            port = ':' + portInput;
        }
        let uri = await getAnswersFromInput(false, 'Uri');

        let url = protocol + '://' + domain + port + uri;
        let confirm = await getAnswersFromList(true, 'Confirm the URL ?\n' + url, [YES, NO]);
        if (YES !== confirm) {
            await askQuestions('URL');
        }
        answers = url
        return answers
    }

    if (qn === 'METHOD') {
        answers = await getAnswersFromList(false, questionName, ['GET', 'POST']);
        return answers;
    }

    if (qn === 'NUMBEROFCALL') {
        answers = await getAnswersFromInput(false, questionName);
        return answers;
    }

    if (qn === 'PAYLOAD') {
        answers = await getAnswersFromInput(false, questionName);
        return answers;
    }

    throw new Error("Error in asking Questions.")
}

async function askForFeatures() {
    const answers = await inquirer.prompt({
        name: 'choose_features',
        type: 'list',
        message: 'What you are going to do / check?\n',
        choices: Object.keys(appConfig.features),
    });
    await handleAnswer(answers.choose_features);
    return answers.choose_features;
}

async function handleAnswer(answer) {
    console.log('-- you selected: ', answer)
    const spinner = createSpinner('Checking answer...').start();
    await sleep();

    let feature = appConfig.features[answer]
    if (feature) {
        appConfig.selected.push(feature)
        spinner.success({text: `Nice work ${playerName}. That's a legit answer`});
    } else {
        spinner.error({text: `💀💀💀 Game over, thank you ${playerName}!`});
        process.exit(1);
    }

    // find question to ask
    let questions = []
    for (const key of appConfig.selected) {
        questions = appConfig.featureMapping[key]
        appConfig.actionPlan[key] = {}
    }
    for (const key of appConfig.selected) {
        for (const question of questions) {
            let answer = await askQuestions(question);
            if (answer) {
                let answerObject = appConfig.actionPlan[key]
                answerObject[question] = answer
            }
        }
    }
    // print out setting____
    console.log('-- appConfig: ', appConfig)
}

async function actionTemplate(actionItem) {
    let info = appConfig.actionPlan[actionItem];
    let response = []
    if (actionItem === 'api') {
        for (let i = 1; i <= info.numberOfCall; i++) {
            try {
                if (info.method === 'GET') {
                    response.push(await axios.get(info.url))
                }
                if (info.method === 'POST') {
                    let data = JSON.parse(info.payload);
                    console.log(i, ' call -- with ', data)
                    response.push(await axios.post(info.url, data));
                }
            } catch (e){
                console.log(e)
            }
        }
    }
    return response
}

async function takeAction(actionItem) {
    console.log('-- TakeAction____', actionItem)
    await actionTemplate(actionItem);
}


async function run() {
    await init();
    await welcome();
    let answer = await askForFeatures();
    await takeAction(appConfig.features[answer]);
}

// Run it with top-level await
console.clear();
run().then(r => {});
