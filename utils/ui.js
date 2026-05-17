import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';
import { promisify } from 'util';

const figletAsync = promisify(figlet);

export async function showHeader() {
  console.clear();
  
  const title = await figletAsync('MIKU AI', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  });
  
  console.log(chalk.cyan(title));
  
  const subtitle = boxen(
    chalk.white('Developer Copilot Terminal Assistant') + '\n' +
    chalk.gray('AI-Powered | Safe Commands | GitHub Integration'),
    {
      padding: 1,
      margin: { top: 0, bottom: 1 },
      borderColor: 'cyan',
      borderStyle: 'round'
    }
  );
  
  console.log(subtitle);
}

export function showPanel(title, content, color = 'blue') {
  const panel = boxen(content, {
    padding: 1,
    borderColor: color,
    title: chalk[color](title),
    titleAlignment: 'left'
  });
  
  console.log(panel);
}

export function showSuccess(message) {
  console.log(boxen(chalk.green(message), {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderColor: 'green',
    borderStyle: 'round'
  }));
}

export function showError(message) {
  console.log(boxen(chalk.red(message), {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderColor: 'red',
    borderStyle: 'round'
  }));
}

export function showLoading(text) {
  const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(spinner[i])} ${text}`);
    i = (i + 1) % spinner.length;
  }, 80);
  
  return () => {
    clearInterval(interval);
    process.stdout.write('\r\x1b[K');
  };
}