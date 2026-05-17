import simpleGit from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';
import { showPanel, showSuccess, showError } from '../utils/ui.js';

export class GitManager {
  constructor(executor, contextManager) {
    this.executor = executor;
    this.contextManager = contextManager;
    this.git = null;
  }

  async init(configManager) {
    this.configManager = configManager;
    
    // Initialize git with config
    const gitConfig = this.configManager.get('github');
    if (gitConfig.token) {
      // Use token for authentication
      this.git = simpleGit({
        config: [
          `http.extraheader=Authorization: Bearer ${gitConfig.token}`
        ]
      });
    } else {
      this.git = simpleGit();
    }
    return this;
  }

  async status() {
    try {
      const status = await this.git.status();
      
      let output = '';
      output += chalk.cyan(`\nOn branch: ${status.current}\n`);
      
      if (status.staged.length > 0) {
        output += chalk.green('\n📦 Changes to be committed:\n');
        status.staged.forEach(file => {
          output += chalk.green(`  ✓ ${file}\n`);
        });
      }
      
      if (status.modified.length > 0) {
        output += chalk.yellow('\n📝 Changes not staged:\n');
        status.modified.forEach(file => {
          output += chalk.yellow(`  ✗ ${file}\n`);
        });
      }
      
      if (status.not_added.length > 0) {
        output += chalk.red('\n❌ Untracked files:\n');
        status.not_added.forEach(file => {
          output += chalk.red(`  ? ${file}\n`);
        });
      }
      
      if (status.staged.length === 0 && status.modified.length === 0 && status.not_added.length === 0) {
        output += chalk.green('\n✓ Working tree clean\n');
      }
      
      return output;
    } catch (error) {
      logger.error(`Git status failed: ${error.message}`);
      return chalk.red('Not a git repository or git not initialized');
    }
  }

  async add(files = '.') {
    const spinner = ora(`Adding ${files}...`).start();
    
    try {
      await this.git.add(files);
      spinner.succeed(`Added: ${files}`);
      return true;
    } catch (error) {
      spinner.fail(`Failed to add: ${error.message}`);
      return false;
    }
  }

  async commit(message) {
    if (!message) {
      logger.error('Commit message required');
      return false;
    }
    
    const spinner = ora('Committing changes...').start();
    
    try {
      // Get user config for commit author
      const githubConfig = this.configManager.get('github');
      let commitOptions = {};
      
      if (githubConfig.username && githubConfig.email) {
        commitOptions = {
          '--author': `${githubConfig.username} <${githubConfig.email}>`
        };
      }
      
      await this.git.commit(message, null, commitOptions);
      spinner.succeed(`Committed: ${message}`);
      this.contextManager.addCommandToHistory(`git commit -m "${message}"`, true);
      return true;
    } catch (error) {
      spinner.fail(`Commit failed: ${error.message}`);
      return false;
    }
  }

  async push(remote = 'origin', branch = null) {
    const spinner = ora('Pushing to remote...').start();
    
    try {
      if (!branch) {
        const status = await this.git.status();
        branch = status.current;
      }
      
      // Set remote URL with token if configured
      const githubConfig = this.configManager.get('github');
      if (githubConfig.token && githubConfig.repo) {
        const remoteUrl = `https://${githubConfig.username}:${githubConfig.token}@github.com/${githubConfig.repo}.git`;
        await this.git.addRemote(remote, remoteUrl);
      }
      
      await this.git.push(remote, branch);
      spinner.succeed(`Pushed to ${remote}/${branch}`);
      return true;
    } catch (error) {
      spinner.fail(`Push failed: ${error.message}`);
      return false;
    }
  }

  async pull(remote = 'origin', branch = null) {
    const spinner = ora('Pulling from remote...').start();
    
    try {
      if (!branch) {
        const status = await this.git.status();
        branch = status.current;
      }
      
      await this.git.pull(remote, branch);
      spinner.succeed(`Pulled from ${remote}/${branch}`);
      return true;
    } catch (error) {
      spinner.fail(`Pull failed: ${error.message}`);
      return false;
    }
  }

  async branch() {
    try {
      const branches = await this.git.branch();
      let output = chalk.cyan('\n📌 Branches:\n');
      
      Object.keys(branches.branches).forEach(branch => {
        const isCurrent = branches.current === branch;
        const prefix = isCurrent ? '✓ ' : '  ';
        const color = isCurrent ? chalk.green : chalk.white;
        output += color(`  ${prefix}${branch}\n`);
      });
      
      return output;
    } catch (error) {
      return chalk.red(`Failed to get branches: ${error.message}`);
    }
  }

  async log(limit = 10) {
    try {
      const log = await this.git.log({ maxCount: limit });
      
      let output = chalk.cyan(`\n📜 Last ${log.all.length} commits:\n`);
      
      log.all.forEach(commit => {
        output += chalk.yellow(`\n  ${commit.hash.substring(0, 7)}`) + chalk.white(` - ${commit.message}`);
        output += chalk.gray(`\n    Author: ${commit.author_name} | Date: ${new Date(commit.date).toLocaleString()}\n`);
      });
      
      return output;
    } catch (error) {
      return chalk.red(`Failed to get log: ${error.message}`);
    }
  }

  async diff(file = null) {
    try {
      let diffOutput;
      if (file) {
        diffOutput = await this.git.diff(['--', file]);
      } else {
        diffOutput = await this.git.diff();
      }
      
      if (!diffOutput) {
        return chalk.gray('\nNo changes to display\n');
      }
      
      const coloredDiff = diffOutput.split('\n').map(line => {
        if (line.startsWith('+')) return chalk.green(line);
        if (line.startsWith('-')) return chalk.red(line);
        if (line.startsWith('@@')) return chalk.cyan(line);
        return chalk.gray(line);
      }).join('\n');
      
      return coloredDiff;
    } catch (error) {
      return chalk.red(`Diff failed: ${error.message}`);
    }
  }

  async stash() {
    const spinner = ora('Stashing changes...').start();
    
    try {
      await this.git.stash();
      spinner.succeed('Changes stashed');
      return true;
    } catch (error) {
      spinner.fail(`Stash failed: ${error.message}`);
      return false;
    }
  }

  async stashPop() {
    const spinner = ora('Applying stashed changes...').start();
    
    try {
      await this.git.stash(['pop']);
      spinner.succeed('Stash applied');
      return true;
    } catch (error) {
      spinner.fail(`Stash pop failed: ${error.message}`);
      return false;
    }
  }

  async showConfig() {
    const githubConfig = this.configManager.get('github');
    
    let output = chalk.cyan('\n📡 GitHub Configuration:\n');
    output += chalk.white(`\n  Username: ${githubConfig.username || '❌ Not set'}`);
    output += chalk.white(`\n  Email: ${githubConfig.email || '❌ Not set'}`);
    output += chalk.white(`\n  Repository: ${githubConfig.repo || '❌ Not set'}`);
    output += chalk.white(`\n  Token: ${githubConfig.token ? '✅ Set (hidden)' : '❌ Not set'}`);
    output += chalk.white(`\n  Remote URL: ${githubConfig.repo ? `https://github.com/${githubConfig.repo}.git` : '❌ Not set'}\n`);
    
    return output;
  }

  async configure() {
    console.log(chalk.cyan('\n  🔧 GitHub Configuration Wizard\n'));
    
    const current = this.configManager.get('github');
    
    const { username } = await inquirer.prompt([
      {
        type: 'input',
        name: 'username',
        message: 'GitHub username:',
        default: current.username || '',
        validate: (input) => input.length > 0 || 'Username is required'
      }
    ]);
    
    const { email } = await inquirer.prompt([
      {
        type: 'input',
        name: 'email',
        message: 'GitHub email (for commits):',
        default: current.email || '',
        validate: (input) => input.includes('@') || 'Valid email required'
      }
    ]);
    
    const { repo } = await inquirer.prompt([
      {
        type: 'input',
        name: 'repo',
        message: 'Repository name (format: username/repo-name):',
        default: current.repo || '',
        validate: (input) => input.includes('/') || 'Format: username/repo-name'
      }
    ]);
    
    const { useToken } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useToken',
        message: 'Use Personal Access Token? (recommended for private repos)',
        default: !!current.token
      }
    ]);
    
    let token = current.token;
    if (useToken) {
      const { newToken } = await inquirer.prompt([
        {
          type: 'password',
          name: 'newToken',
          message: 'Enter GitHub Personal Access Token:',
          default: current.token || ''
        }
      ]);
      token = newToken;
    } else {
      token = '';
    }
    
    await this.configManager.set('github.username', username);
    await this.configManager.set('github.email', email);
    await this.configManager.set('github.repo', repo);
    await this.configManager.set('github.token', token);
    
    // Reinitialize git with new config
    await this.init(this.configManager);
    
    console.log(chalk.green('\n  ✓ GitHub configuration saved!\n'));
    
    // Test connection
    const spinner = ora('Testing GitHub connection...').start();
    try {
      await this.git.listRemote(['--get-url']);
      spinner.succeed('GitHub connection successful!');
    } catch (error) {
      spinner.warn('Could not verify connection. Check your settings.');
    }
  }
}