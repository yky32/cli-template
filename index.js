#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import chalkAnimation from 'chalk-animation';
import {createSpinner} from 'nanospinner';
import axios from "axios";
import {readFileSync, writeFileSync} from 'fs';
import moment from "moment";

// GLOBAL VARIABLE __
const YES = 'YES';
const NO = '--NO';
const LOCALHOST = "localhost";

// PATH
const LAST_USED_FILE = '.lastUsed/';
const RESULT_FILE = '.result/';
const LAST_USE_FILE = LAST_USED_FILE + 'lastUsed.json';

const data = readFileSync('.config/appConfig.json');
let appConfig = JSON.parse(data)
let playerName = 'WY__';

const sleep = (ms = 1000) => new Promise((r) => setTimeout(r, ms));

function load(filePath) {
    const _file = readFileSync(filePath);
    let fileData = JSON.parse(_file)
    return fileData;
}

async function init() {
    // load config
    let featureMapping = load('.config/features/featureMapping.json');
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

async function getManyAnswersFromList(rewrite = false, questionName, options = ['']) {
    let message = 'What is ' + questionName + '?';
    if (rewrite) message = questionName
    let answers = await inquirer.prompt(
        {
            type: 'checkbox',
            name: 'player_input',
            message: message,
            choices: options
        }
    );
    return answers.player_input;
}

async function getOneAnswerFromList(rewrite = false, questionName, options = ['']) {
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

async function getOneAnswerFromInput(rewrite = false, questionName, _default = "") {
    let message = 'What is ' + questionName + '?';
    if (rewrite) message = questionName
    let answers = await inquirer.prompt({
        name: "player_input",
        type: 'input',
        message: message,
        default() {
            return _default;
        },
    });
    return answers.player_input;
}

async function askQuestions(questionName, _default) {
    let answers
    let qn = questionName.toUpperCase();
    if (qn === 'URL') {
        let protocol = await getOneAnswerFromList(false, 'Protocol', ['http', 'https']);
        let domain = await getOneAnswerFromInput(false, 'Domain', (_default) ? _default : LOCALHOST);
        let portOption
        if (domain === LOCALHOST) {
            portOption = await getOneAnswerFromList(false, 'Port', [YES, NO]);
        } else {
            portOption = await getOneAnswerFromList(false, 'Port', [NO, YES]);
        }
        let port = ''
        if (YES === portOption) {
            let portInput = await getOneAnswerFromInput(false, 'Port Number', (_default) ? _default : "8080");
            port = ':' + portInput;
        }
        let uri = await getOneAnswerFromInput(false, 'Uri', (_default) ? _default : "/");

        let url = protocol + '://' + domain + port + uri;
        let confirm = await getOneAnswerFromList(true, 'Confirm the URL ?\n' + url, [YES, NO]);
        if (YES !== confirm) {
            await askQuestions('URL');
        }
        answers = url
        return answers
    }

    if (qn === 'METHOD') {
        answers = await getOneAnswerFromList(false, questionName, ['GET', 'POST']);
        return answers;
    }

    if (qn === 'NUMBEROFCALL') {
        answers = await getOneAnswerFromInput(false, questionName, (_default) ? _default : "1");
        return answers;
    }

    if (qn === 'PAYLOAD') {
        answers = await getOneAnswerFromInput(false, questionName, (_default) ? _default : {});
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
    let answer = answers.choose_features;
    if (getFeatureKeyByName(answer) !== 'last') {
        await handleAnswer(answer);
    }
    return answer;
}

function getFeatureKeyByName(answer) {
    return appConfig.features[answer];
}

async function handleAnswer(answer) {
    console.log('-- you selected: ', answer)
    const spinner = createSpinner('Checking answer...').start();
    await sleep();

    let featureKey = getFeatureKeyByName(answer)
    if (featureKey) {
        appConfig.selected.push(featureKey)
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
    // store the actionPlan in json that next time reuse
    appConfig.actionPlan.last = featureKey
    let timeslot = moment().format('YYYYMMDDHHMMSS');
    let lastUse = {}
    lastUse[timeslot] = appConfig.actionPlan
    await save(LAST_USED_FILE + '/lastUsed.json', lastUse)
}

async function actionTemplate(info, featureKey) {
    let result = {
        featureKey: featureKey,
        responses: []
    }
    if (featureKey === 'api') {
        for (let i = 1; i <= info.numberOfCall; i++) {
            try {
                if (info.method === 'GET') {
                    console.log(i, ' ', info.method, 'call --')
                    result.responses.push((await axios.get(info.url)).data)
                }
                if (info.method === 'POST') {
                    let data = JSON.parse(info.payload);
                    console.log(i, ' ', info.method, 'call -- with ', data)
                    result.responses.push((await axios.post(info.url, data)).data);
                }
            } catch (e) {
                console.log(e)
            }
        }
    }
    return result
}


async function handleLastAction() {
    let lastActionConfig = load(LAST_USE_FILE);
    console.log(lastActionConfig)
    let historyKey = await getOneAnswerFromList(true, "Which history?", Object.keys(lastActionConfig))
    let config = lastActionConfig[historyKey];
    let info = config[config.last]

    // do you need edit the config?
    let isEdit = await getOneAnswerFromList(true, "Do you need edit?", [NO, YES]);
    if (YES === isEdit) {
        let editList = await getManyAnswersFromList(true, "Which gonna edit?", Object.keys(config[config.last]));
        for (const field of editList) {
            let newFieldValue = await askQuestions(field, info[field]);
            console.log(newFieldValue)
        }
    }

    return await actionTemplate(info, config.last);
}

async function takeAction(actionItem) {
    let featureKey = getFeatureKeyByName(actionItem)
    if (featureKey === 'last') {
        return handleLastAction();
    }
    let info = appConfig.actionPlan[featureKey];
    console.log('-- TakeAction____', info)
    return await actionTemplate(info, featureKey);
}

function save(fileName, response) {
    writeFileSync(fileName, JSON.stringify(response))
}

async function printAndSaveResult(fileName = "", responses, fileType = "json") {
    const fileTypeMap = {
        json: ".json",
        txt: ".text"
    }
    fileName = fileName + moment().format('YYYYMMDDHHMMSS') + "__" + fileTypeMap[fileType];
    if (Array.isArray(responses)) {
        for (const response of responses) {
            save(fileName, responses)
        }
    } else {
        save(fileName, responses)
    }
}

async function run() {
    await init()
    await welcome()
    let answer = await askForFeatures()
    let result = await takeAction(answer)
    await printAndSaveResult(RESULT_FILE + result.featureKey + '_result_', result.responses, "json")
}

// Run it with top-level await
console.clear();
run().then(r => {
});
