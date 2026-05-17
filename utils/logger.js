import chalk from 'chalk';

export const logger = {
  info: (message) => {
    console.log(`${chalk.blue('[INFO]')} ${message}`);
  },
  
  success: (message) => {
    console.log(`${chalk.green('[SUCCESS]')} ${message}`);
  },
  
  error: (message) => {
    console.log(`${chalk.red('[ERROR]')} ${message}`);
  },
  
  warn: (message) => {
    console.log(`${chalk.yellow('[WARN]')} ${message}`);
  },
  
  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(`${chalk.gray('[DEBUG]')} ${message}`);
    }
  }
};

export const colorful = {
  title: (text) => chalk.cyan.bold(text),
  highlight: (text) => chalk.magenta(text),
  success: (text) => chalk.green(text),
  error: (text) => chalk.red(text),
  code: (text) => chalk.gray(text)
};