import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';
import { logger } from '../utils/logger.js';

export class ContextManager {
  constructor() {
    this.context = {
      projectStructure: {},
      dependencies: {},
      frameworks: [],
      recentFiles: [],
      commandHistory: [],
      conversationHistory: [],
      lastEditedFile: null
    };
  }

  async load() {
    try {
      const contextPath = path.join(process.cwd(), '.miku-context.json');
      if (await fs.pathExists(contextPath)) {
        this.context = await fs.readJson(contextPath);
        logger.info('Context loaded from .miku-context.json');
      }
    } catch (error) {
      logger.warn('Could not load context, using fresh state');
    }
  }

  async save() {
    try {
      const contextPath = path.join(process.cwd(), '.miku-context.json');
      await fs.writeJson(contextPath, this.context, { spaces: 2 });
      logger.info('Context saved');
    } catch (error) {
      logger.error('Failed to save context');
    }
  }

  async scanProject() {
    const cwd = process.cwd();
    
    // Scan package.json
    const packageJsonPath = path.join(cwd, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      this.context.dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
    }
    
    // Detect frameworks
    this.context.frameworks = await this.detectFrameworks();
    
    // Get project structure (first 3 levels)
    const structure = await this.getProjectStructure(cwd, 3);
    this.context.projectStructure = structure;
    
    logger.info('Project scan completed');
  }

  async detectFrameworks() {
    const frameworks = [];
    const deps = this.context.dependencies || {};
    
    if (deps.express) frameworks.push('express');
    if (deps.react || deps['react-dom']) frameworks.push('react');
    if (deps.vue) frameworks.push('vue');
    if (deps.next) frameworks.push('nextjs');
    if (deps['@whiskeysockets/baileys'] || deps['@ryuu-reinzz/baileys']) frameworks.push('whatsapp-bot');
    if (deps['@supabase/supabase-js']) frameworks.push('supabase');
    if (deps.electron) frameworks.push('electron');
    
    return frameworks;
  }

  async getProjectStructure(dir, depth, currentDepth = 0) {
    if (currentDepth >= depth) return null;
    
    const structure = {};
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      if (item.startsWith('.') || item === 'node_modules' || item === 'session') continue;
      
      const itemPath = path.join(dir, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        structure[item] = await this.getProjectStructure(itemPath, depth, currentDepth + 1);
      } else {
        structure[item] = 'file';
      }
    }
    
    return structure;
  }

  async countFiles() {
    const files = await glob('**/*', { 
      ignore: ['node_modules/**', 'session/**', '.git/**'],
      nodir: true 
    });
    return files.length;
  }

  getDependencies() {
    return this.context.dependencies;
  }

  getProjectStructureText() {
    const formatStructure = (obj, indent = 0) => {
      let result = '';
      const spaces = '  '.repeat(indent);
      
      for (const [key, value] of Object.entries(obj)) {
        if (value === 'file') {
          result += `${spaces}📄 ${key}\n`;
        } else if (typeof value === 'object') {
          result += `${spaces}📁 ${key}/\n`;
          result += formatStructure(value, indent + 1);
        }
      }
      
      return result;
    };
    
    return formatStructure(this.context.projectStructure);
  }

  addFileToRecent(filePath) {
    this.context.recentFiles.unshift(filePath);
    this.context.recentFiles = [...new Set(this.context.recentFiles)].slice(0, 10);
    this.context.lastEditedFile = filePath;
  }

  addCommandToHistory(command, success, error = null) {
    this.context.commandHistory.unshift({
      command,
      success,
      error,
      timestamp: Date.now()
    });
    this.context.commandHistory = this.context.commandHistory.slice(0, 50);
  }

  addToConversation(role, content) {
    this.context.conversationHistory.push({ role, content, timestamp: Date.now() });
    this.context.conversationHistory = this.context.conversationHistory.slice(-50);
  }
}