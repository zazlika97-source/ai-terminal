#!/usr/bin/env node

import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { AIEngine } from './core/ai-engine.js';
import { ContextManager } from './core/context.js';
import { SafeExecutor } from './core/executor.js';
import { GitManager } from './commands/git.js';
import { FileManager } from './commands/file.js';
import { ConfigManager } from './commands/config.js';
import { AICommand } from './commands/ai.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MikuTerminal {
  constructor() {
    this.aiEngine = null;
    this.aiCommand = null;
    this.contextManager = null;
    this.executor = null;
    this.gitManager = null;
    this.fileManager = null;
    this.configManager = null;
    this.running = true;
  }

  async initialize() {
    console.log(chalk.cyan('\n  ╔═══════════════════════════════════════╗'));
    console.log(chalk.cyan('  ║     🤖 MIKU AI TERMINAL ASSISTANT     ║'));
    console.log(chalk.cyan('  ╚═══════════════════════════════════════╝\n'));
    
    this.configManager = new ConfigManager();
    await this.configManager.load();
    
    this.aiEngine = new AIEngine(this.configManager);
    await this.aiEngine.initialize();
    
    this.aiCommand = new AICommand(this.aiEngine, this.configManager);
    
    this.contextManager = new ContextManager();
    await this.contextManager.load();
    
    this.executor = new SafeExecutor(this.contextManager);
    this.gitManager = new GitManager(this.executor, this.contextManager);
    await this.gitManager.init(this.configManager);
    
    this.fileManager = new FileManager(this.executor, this.contextManager);
    
    const activeConfig = await this.configManager.getActivePremiumConfig();
    if (this.configManager.get('ai.mode') === 'premium' && activeConfig) {
      console.log(chalk.green(`  ✓ Active: ${activeConfig.name}`));
      console.log(chalk.green(`  ✓ Model: ${activeConfig.model || 'default'}`));
    } else {
      console.log(chalk.green(`  ✓ Mode: ${this.configManager.get('ai.mode')}`));
      console.log(chalk.green(`  ✓ Provider: ${this.configManager.get('ai.provider')}`));
    }
    
    // Show GitHub config status
    const githubConfig = this.configManager.get('github');
    if (githubConfig.username && githubConfig.repo) {
      console.log(chalk.green(`  ✓ GitHub: ${githubConfig.username}/${githubConfig.repo}`));
    } else {
      console.log(chalk.yellow(`  ⚠ GitHub: Not configured`));
    }
    
    console.log(chalk.gray('  ─────────────────────────────────────────\n'));
    
    return this;
  }

  async showMainMenu() {
    process.stdin.setRawMode(false);
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        pageSize: 16,
        choices: [
          { name: '💬  Start AI Chat', value: 'chat' },
          { name: '🌐  Free Mode', value: 'free_mode' },
          { name: '⭐  Premium Mode', value: 'premium_mode' },
          { name: '📝  Manage Premium Configs', value: 'manage_configs' },
          { name: '🔧  Configure Free Endpoint', value: 'config_free' },
          { name: '🐙  GitHub Configuration', value: 'github_config' },
          { name: '📁  File Operations', value: 'files' },
          { name: '💻  Terminal Commands', value: 'terminal' },
          { name: '📊  Project Analysis', value: 'analyze' },
          { name: '❌  Exit', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'chat':
        await this.aiCommand.startChat();
        break;
      case 'free_mode':
        await this.setFreeMode();
        break;
      case 'premium_mode':
        await this.selectPremiumConfig();
        break;
      case 'manage_configs':
        await this.managePremiumConfigs();
        break;
      case 'config_free':
        await this.configFreeEndpoint();
        break;
      case 'github_config':
        await this.githubConfiguration();
        break;
      case 'files':
        await this.fileOperations();
        break;
      case 'terminal':
        await this.terminalCommands();
        break;
      case 'analyze':
        await this.analyzeProject();
        break;
      case 'exit':
        await this.exit();
        break;
    }
  }

  async setFreeMode() {
    await this.configManager.set('ai.mode', 'free');
    await this.configManager.set('ai.provider', 'free');
    
    if (!this.configManager.get('ai.endpoint')) {
      await this.configManager.set('ai.endpoint', 'https://api.nexray.eu.cc/ai/gemini');
    }
    
    console.log(chalk.green('\n  ✓ Switched to FREE mode\n'));
    await this.aiEngine.updateProvider();
  }

  async selectPremiumConfig() {
    const configs = await this.configManager.getPremiumConfigs();
    
    if (configs.length === 0) {
      console.log(chalk.yellow('\n  No premium configs found. Please add one first.\n'));
      await this.addPremiumConfig();
      return;
    }
    
    const choices = configs.map(c => ({
      name: `${c.name} ${c.model ? `(${c.model})` : ''} - ${c.endpoint.substring(0, 40)}...`,
      value: c.id
    }));
    
    choices.push({ name: '➕ Add new config', value: 'add' });
    choices.push({ name: '🔙 Back', value: 'back' });
    
    const { selectedId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Select premium config:',
        choices: choices
      }
    ]);
    
    if (selectedId === 'add') {
      await this.addPremiumConfig();
      await this.selectPremiumConfig();
    } else if (selectedId !== 'back') {
      await this.configManager.setActivePremiumConfig(selectedId);
      await this.aiEngine.updateProvider();
      console.log(chalk.green('\n  ✓ Premium config activated!\n'));
    }
  }

  async addPremiumConfig() {
    console.log(chalk.cyan('\n  📝 Add New Premium Configuration\n'));
    
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Config name (e.g., Gemini-Pro, GPT-4):',
        validate: (input) => input.length > 0 || 'Name is required'
      }
    ]);
    
    const { endpoint } = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'API endpoint URL:',
        validate: (input) => input.startsWith('http') || 'Must be valid URL'
      }
    ]);
    
    const { needApiKey } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'needApiKey',
        message: 'Does this endpoint require an API key?',
        default: true
      }
    ]);
    
    let apiKey = '';
    if (needApiKey) {
      const { key } = await inquirer.prompt([
        {
          type: 'password',
          name: 'key',
          message: 'Enter API key:',
          validate: (input) => input.length > 0 || 'API key is required'
        }
      ]);
      apiKey = key;
    }
    
    const { model } = await inquirer.prompt([
      {
        type: 'input',
        name: 'model',
        message: 'Model name (optional, press Enter to skip):',
        default: ''
      }
    ]);
    
    console.log(chalk.cyan('\n  📝 System Prompt Configuration\n'));
    const { useDefaultPrompt } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useDefaultPrompt',
        message: 'Use default system prompt?',
        default: true
      }
    ]);
    
    let systemPrompt = '';
    if (useDefaultPrompt) {
      systemPrompt = this.configManager.getDefaultSystemPrompt();
      console.log(chalk.gray(`\n  Using default: ${systemPrompt.substring(0, 60)}...\n`));
    } else {
      const { customPrompt } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'customPrompt',
          message: 'Enter custom system prompt (editor will open):',
          default: this.configManager.getDefaultSystemPrompt()
        }
      ]);
      systemPrompt = customPrompt;
    }
    
    await this.configManager.addPremiumConfig(name, endpoint, apiKey, model, systemPrompt);
    console.log(chalk.green(`\n  ✓ Config "${name}" added successfully!\n`));
  }

  async managePremiumConfigs() {
    const configs = await this.configManager.getPremiumConfigs();
    
    if (configs.length === 0) {
      console.log(chalk.yellow('\n  No premium configs found.\n'));
      await this.addPremiumConfig();
      return;
    }
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Manage configs:',
        choices: [
          { name: '📋 View all configs', value: 'view' },
          { name: '➕ Add new config', value: 'add' },
          { name: '✏️ Edit system prompt', value: 'edit_prompt' },
          { name: '🗑️ Delete config', value: 'delete' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);
    
    if (action === 'view') {
      for (const config of configs) {
        console.log(chalk.cyan('\n  ─────────────────────────────────────────'));
        console.log(chalk.white(`  Name: ${config.name}`));
        console.log(chalk.white(`  Model: ${config.model || 'default'}`));
        console.log(chalk.white(`  Endpoint: ${config.endpoint.substring(0, 60)}...`));
        console.log(chalk.white(`  API Key: ${config.apiKey ? '✅ Set' : '❌ Not set'}`));
        console.log(chalk.white(`  System Prompt: ${config.systemPrompt.substring(0, 80)}...`));
        console.log(chalk.gray(`  Created: ${config.createdAt}`));
      }
      console.log(chalk.cyan('\n  ─────────────────────────────────────────\n'));
      
    } else if (action === 'add') {
      await this.addPremiumConfig();
      
    } else if (action === 'edit_prompt') {
      const choices = configs.map(c => ({
        name: `${c.name} - ${c.model || 'no model'}`,
        value: c.id
      }));
      choices.push({ name: '🔙 Back', value: 'back' });
      
      const { configId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configId',
          message: 'Select config to edit system prompt:',
          choices: choices
        }
      ]);
      
      if (configId !== 'back') {
        await this.configManager.editSystemPrompt(configId);
      }
      
    } else if (action === 'delete') {
      const choices = configs.map(c => ({
        name: `${c.name} - ${c.model || 'no model'}`,
        value: c.id
      }));
      choices.push({ name: '🔙 Back', value: 'back' });
      
      const { configId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configId',
          message: 'Select config to delete:',
          choices: choices
        }
      ]);
      
      if (configId !== 'back') {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Delete this config?',
            default: false
          }
        ]);
        
        if (confirm) {
          await this.configManager.deletePremiumConfig(configId);
          console.log(chalk.green('\n  ✓ Config deleted\n'));
        }
      }
    }
  }

  async configFreeEndpoint() {
    const { endpoint } = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'Enter free endpoint URL:',
        default: 'https://api.nexray.eu.cc/ai/gemini',
        validate: (input) => input.startsWith('http') || 'URL must start with http:// or https://'
      }
    ]);
    
    await this.configManager.set('ai.endpoint', endpoint);
    await this.configManager.set('ai.mode', 'free');
    await this.configManager.set('ai.apiKey', '');
    
    console.log(chalk.green('\n  ✓ Free endpoint configured!\n'));
  }

  async githubConfiguration() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'GitHub Configuration:',
        choices: [
          { name: '📋 View current config', value: 'view' },
          { name: '⚙️  Configure GitHub', value: 'configure' },
          { name: '🔙 Back', value: 'back' }
        ]
      }
    ]);
    
    if (action === 'view') {
      const config = await this.gitManager.showConfig();
      console.log(config);
    } else if (action === 'configure') {
      await this.gitManager.configure();
    }
  }

  async fileOperations() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'File Operations:',
        choices: ['Read File', 'Write File', 'Edit File', 'Create Folder', 'Back']
      }
    ]);
    
    if (action === 'Back') return;
    
    const { filePath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filePath',
        message: `Enter path to ${action.toLowerCase()}:`
      }
    ]);
    
    switch (action) {
      case 'Read File':
        const content = await this.fileManager.readFile(filePath);
        if (content) {
          console.log(chalk.cyan('\n  Content:\n'));
          console.log(content);
          console.log(chalk.gray('\n  ─────────────────────────────────────────\n'));
        }
        break;
        
      case 'Write File':
        const { content: writeContent } = await inquirer.prompt([
          { type: 'editor', name: 'content', message: 'Enter file content:' }
        ]);
        await this.fileManager.writeFile(filePath, writeContent);
        break;
        
      case 'Edit File':
        await this.fileManager.editFile(filePath);
        break;
        
      case 'Create Folder':
        await this.fileManager.createFolder(filePath);
        break;
    }
  }

  async terminalCommands() {
    const { command } = await inquirer.prompt([
      {
        type: 'input',
        name: 'command',
        message: chalk.cyan('$')
      }
    ]);
    
    if (command === 'exit') return;
    
    const result = await this.executor.execute(command);
    
    if (result.success) {
      console.log(chalk.white(result.output));
    } else {
      console.log(chalk.red(result.error));
    }
  }

  async analyzeProject() {
    console.log(chalk.gray('\n  Analyzing project...\n'));
    
    const structure = await this.contextManager.getProjectStructureText();
    const deps = await this.contextManager.getDependencies();
    const frameworks = await this.contextManager.detectFrameworks();
    const fileCount = await this.contextManager.countFiles();
    
    console.log(chalk.cyan('  📁 Project Structure:\n'));
    console.log(structure);
    
    console.log(chalk.cyan('\n  📦 Dependencies:\n'));
    console.log(chalk.white(`  ${Object.keys(deps || {}).slice(0, 15).join(', ')}`));
    
    console.log(chalk.cyan('\n  🔧 Frameworks:\n'));
    console.log(chalk.white(`  ${frameworks.join(', ') || 'None detected'}`));
    
    console.log(chalk.cyan('\n  📄 Total Files:\n'));
    console.log(chalk.white(`  ${fileCount}\n`));
  }

  async exit() {
    this.running = false;
    await this.contextManager.save();
    console.log(chalk.yellow('\n  👋 Goodbye!\n'));
    process.exit(0);
  }

  async run() {
    await this.initialize();
    
    while (this.running) {
      await this.showMainMenu();
    }
  }
}

const app = new MikuTerminal();
app.run().catch(error => {
  console.error(chalk.red(`\n  Fatal error: ${error.message}\n`));
  process.exit(1);
});