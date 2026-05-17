import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'settings.json');
    this.config = null;
  }

  async load() {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      
      if (await fs.pathExists(this.configPath)) {
        this.config = await fs.readJson(this.configPath);
        logger.info('Configuration loaded');
      } else {
        this.config = this.getDefaultConfig();
        await this.save();
        logger.info('Default configuration created');
      }
      
      if (!this.config.premiumConfigs) {
        this.config.premiumConfigs = [];
        await this.save();
      }
      
      return this.config;
    } catch (error) {
      logger.error(`Failed to load config: ${error.message}`);
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  getDefaultConfig() {
    return {
      ai: {
        mode: 'free',
        provider: 'free',
        endpoint: 'https://api.nexray.eu.cc/ai/gemini',
        apiKey: '',
        model: '',
        systemPrompt: 'You are Miku, an AI developer assistant. Respond in one line only, no line breaks. Be concise and helpful.'
      },
      premiumConfigs: [],
      activePremiumConfig: null,
      github: {
        token: '',
        repo: '',
        username: ''
      },
      terminal: {
        requireConfirm: true,
        maxOutputLines: 1000,
        whitelistCommands: true
      },
      ui: {
        theme: 'dark',
        animations: true,
        compactMode: false
      }
    };
  }

  async save() {
    try {
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      logger.info('Configuration saved');
    } catch (error) {
      logger.error(`Failed to save config: ${error.message}`);
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value === undefined) return undefined;
      value = value[k];
    }
    
    return value;
  }

  async set(key, value) {
    const keys = key.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    await this.save();
  }

  getAll() {
    return this.config;
  }

  async addPremiumConfig(name, endpoint, apiKey, model, systemPrompt) {
    const newConfig = {
      id: Date.now().toString(),
      name: name,
      endpoint: endpoint,
      apiKey: apiKey || '',
      model: model || '',
      systemPrompt: systemPrompt || this.getDefaultSystemPrompt(),
      createdAt: new Date().toISOString()
    };
    
    this.config.premiumConfigs.push(newConfig);
    await this.save();
    return newConfig;
  }

  async updatePremiumConfig(id, updates) {
    const index = this.config.premiumConfigs.findIndex(c => c.id === id);
    if (index !== -1) {
      this.config.premiumConfigs[index] = { ...this.config.premiumConfigs[index], ...updates };
      await this.save();
      
      // If this is active config, update current AI settings
      if (this.config.activePremiumConfig === id) {
        await this.setActivePremiumConfig(id);
      }
      return true;
    }
    return false;
  }

  async getPremiumConfigs() {
    return this.config.premiumConfigs || [];
  }

  async getPremiumConfig(id) {
    return this.config.premiumConfigs.find(c => c.id === id);
  }

  async deletePremiumConfig(id) {
    this.config.premiumConfigs = this.config.premiumConfigs.filter(c => c.id !== id);
    if (this.config.activePremiumConfig === id) {
      this.config.activePremiumConfig = null;
    }
    await this.save();
  }

  async setActivePremiumConfig(id) {
    const config = await this.getPremiumConfig(id);
    if (config) {
      this.config.activePremiumConfig = id;
      this.config.ai.mode = 'premium';
      this.config.ai.provider = config.name;
      this.config.ai.endpoint = config.endpoint;
      this.config.ai.apiKey = config.apiKey;
      this.config.ai.model = config.model;
      this.config.ai.systemPrompt = config.systemPrompt;
      await this.save();
      return true;
    }
    return false;
  }

  async getActivePremiumConfig() {
    if (!this.config.activePremiumConfig) return null;
    return this.getPremiumConfig(this.config.activePremiumConfig);
  }

  getDefaultSystemPrompt() {
    return 'You are Miku, an AI developer assistant. Respond in one line only, no line breaks. Be concise, practical, and helpful.';
  }

  async editSystemPrompt(id) {
    const config = await this.getPremiumConfig(id);
    if (!config) return false;
    
    console.log(chalk.cyan('\n  Current System Prompt:\n'));
    console.log(chalk.white(`  ${config.systemPrompt}\n`));
    
    const { newPrompt } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'newPrompt',
        message: 'Edit system prompt (editor will open):',
        default: config.systemPrompt
      }
    ]);
    
    await this.updatePremiumConfig(id, { systemPrompt: newPrompt });
    console.log(chalk.green('\n  ✓ System prompt updated!\n'));
    
    return true;
  }

  async reset() {
    this.config = this.getDefaultConfig();
    await this.save();
    logger.info('Configuration reset to default');
  }
}