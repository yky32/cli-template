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
import gradient from 'gradient-string';
import chalkAnimation from 'chalk-animation';
import figlet from 'figlet';
import { createSpinner } from 'nanospinner';
import axios from "axios";

const hostname = 'http://localhost:9000'
const basePath = '/cron-jobs'
const FEATURE_1 = 'list-active-projects';
const FEATURE_2 = 'do-raffle';
let playerName;

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

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

async function question1() {
  const answers = await inquirer.prompt({
    name: 'question_1',
    type: 'list',
    message: 'What you are going to do / check?\n',
    choices: [
      FEATURE_1,
      FEATURE_2
    ],
  });

  return handleAnswer(answers.question_1);
}


async function handleAnswer(answer) {
  const spinner = createSpinner('Checking answer...').start();
  await sleep();

  if (answer === FEATURE_1) {
    console.log(answer === FEATURE_1)
    spinner.success({ text: `Nice work ${playerName}. That's a legit answer` });
    let resp = await axios.get(hostname + basePath + '/' + FEATURE_1);
    console.log(resp.data)
  }

  else if (answer === FEATURE_2) {
    console.log(answer === FEATURE_2)
    spinner.success({ text: `Nice work ${playerName}. That's a legit answer` });
    let resp = await axios.get(hostname + basePath + '/' + FEATURE_2);
    console.log(resp.data)
  }

  else {
    console.log(answer)
    spinner.error({ text: `💀💀💀 Game over, you lose ${playerName}!` });
    process.exit(1);
  }
}

// Run it with top-level await
console.clear();
await welcome();
await question1();