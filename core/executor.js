import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

// Whitelist of safe commands
const SAFE_COMMANDS = [
  /^npm (install|i|add|uninstall|remove|update|outdated|ls|list|run|start|test)/,
  /^node (.+\.js)$/,
  /^git (status|add|commit|push|pull|fetch|branch|checkout|log|diff|stash|reset --soft|restore)/,
  /^ls$/,
  /^pwd$/,
  /^echo/,
  /^cat/,
  /^mkdir/,
  /^touch/,
  /^code/,
  /^vercel/
];

// Blacklist of dangerous patterns
const DANGEROUS_PATTERNS = [
  /rm -rf/,
  /sudo/,
  /chmod 777/,
  /dd if=/,
  /> \/dev\/sd/,
  /mkfs/,
  /:(){ :|:& };:/,
  /curl.*\| sh/,
  /wget.*\| sh/
];

export class SafeExecutor {
  constructor(contextManager) {
    this.contextManager = contextManager;
  }

  isCommandSafe(command) {
    // Check against dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return { safe: false, reason: `Dangerous pattern detected: ${pattern}` };
      }
    }
    
    // Check against whitelist
    const isWhitelisted = SAFE_COMMANDS.some(pattern => pattern.test(command));
    if (!isWhitelisted) {
      return { safe: false, reason: 'Command not in whitelist' };
    }
    
    return { safe: true };
  }

  async execute(command, requireConfirm = false) {
    const safety = this.isCommandSafe(command);
    
    if (!safety.safe) {
      logger.error(`Blocked: ${safety.reason}`);
      return { success: false, error: `Command blocked: ${safety.reason}` };
    }
    
    if (requireConfirm) {
      const confirm = await this.askConfirmation(command);
      if (!confirm) {
        return { success: false, error: 'Command cancelled' };
      }
    }
    
    try {
      logger.info(`Executing: ${chalk.cyan(command)}`);
      const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
      
      if (stderr) {
        logger.warn(stderr);
      }
      
      // Log to context
      this.contextManager.addCommandToHistory(command, true);
      
      return { success: true, output: stdout || 'Command executed successfully' };
    } catch (error) {
      logger.error(`Execution failed: ${error.message}`);
      this.contextManager.addCommandToHistory(command, false, error.message);
      return { success: false, error: error.message };
    }
  }

  async askConfirmation(command) {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question(chalk.yellow(`⚠️  Confirm execution: ${command}? (y/N) `), (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }
}