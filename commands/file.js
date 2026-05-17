import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class FileManager {
  constructor(executor, contextManager) {
    this.executor = executor;
    this.contextManager = contextManager;
  }

  async readFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!await fs.pathExists(fullPath)) {
        logger.error(`File not found: ${filePath}`);
        return null;
      }
      
      const stats = await fs.stat(fullPath);
      if (stats.isDirectory()) {
        return this.listDirectory(fullPath);
      }
      
      const content = await fs.readFile(fullPath, 'utf-8');
      this.contextManager.addFileToRecent(fullPath);
      
      // Add line numbers
      const lines = content.split('\n');
      const numberedContent = lines.map((line, index) => {
        const lineNum = (index + 1).toString().padStart(4, ' ');
        return chalk.gray(`${lineNum} │ ${line}`);
      }).join('\n');
      
      return numberedContent;
    } catch (error) {
      logger.error(`Read failed: ${error.message}`);
      return null;
    }
  }

  async listDirectory(dirPath) {
    try {
      const fullPath = path.resolve(dirPath);
      const items = await fs.readdir(fullPath);
      
      let output = chalk.cyan(`\n📁 Contents of ${fullPath}:\n`);
      
      for (const item of items) {
        if (item.startsWith('.')) continue;
        
        const itemPath = path.join(fullPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          output += chalk.blue(`  📁 ${item}/\n`);
        } else {
          const size = (stats.size / 1024).toFixed(1);
          output += chalk.white(`  📄 ${item} `) + chalk.gray(`(${size} KB)\n`);
        }
      }
      
      return output;
    } catch (error) {
      return chalk.red(`Failed to list directory: ${error.message}`);
    }
  }

  async writeFile(filePath, content) {
    try {
      const fullPath = path.resolve(filePath);
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, 'utf-8');
      
      logger.success(`File written: ${fullPath}`);
      this.contextManager.addFileToRecent(fullPath);
      return true;
    } catch (error) {
      logger.error(`Write failed: ${error.message}`);
      return false;
    }
  }

  async editFile(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!await fs.pathExists(fullPath)) {
        logger.error(`File not found: ${filePath}`);
        return false;
      }
      
      const currentContent = await fs.readFile(fullPath, 'utf-8');
      
      const { newContent } = await inquirer.prompt([
        {
          type: 'editor',
          name: 'newContent',
          message: 'Edit file content:',
          default: currentContent
        }
      ]);
      
      if (newContent !== currentContent) {
        await fs.writeFile(fullPath, newContent, 'utf-8');
        logger.success(`File updated: ${fullPath}`);
        this.contextManager.addFileToRecent(fullPath);
        return true;
      } else {
        logger.info('No changes made');
        return true;
      }
    } catch (error) {
      logger.error(`Edit failed: ${error.message}`);
      return false;
    }
  }

  async createFolder(folderPath) {
    try {
      const fullPath = path.resolve(folderPath);
      await fs.ensureDir(fullPath);
      logger.success(`Folder created: ${fullPath}`);
      return true;
    } catch (error) {
      logger.error(`Create folder failed: ${error.message}`);
      return false;
    }
  }

  async deleteFile(filePath, requireConfirm = true) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (requireConfirm) {
        const { confirm } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Delete ${fullPath}?`,
            default: false
          }
        ]);
        
        if (!confirm) return false;
      }
      
      await fs.remove(fullPath);
      logger.success(`Deleted: ${fullPath}`);
      return true;
    } catch (error) {
      logger.error(`Delete failed: ${error.message}`);
      return false;
    }
  }

  async renameFile(oldPath, newPath) {
    try {
      const fullOldPath = path.resolve(oldPath);
      const fullNewPath = path.resolve(newPath);
      
      await fs.move(fullOldPath, fullNewPath);
      logger.success(`Renamed: ${oldPath} → ${newPath}`);
      return true;
    } catch (error) {
      logger.error(`Rename failed: ${error.message}`);
      return false;
    }
  }

  async searchFiles(pattern, directory = '.') {
    const spinner = ora(`Searching for ${pattern}...`).start();
    
    try {
      const { stdout } = await execAsync(`find ${directory} -name "${pattern}" -type f 2>/dev/null | head -20`);
      const files = stdout.trim().split('\n').filter(f => f);
      
      spinner.stop();
      
      if (files.length === 0) {
        return chalk.yellow(`\nNo files found matching: ${pattern}\n`);
      }
      
      let output = chalk.cyan(`\n🔍 Found ${files.length} file(s):\n`);
      files.forEach(file => {
        output += chalk.white(`  📄 ${file}\n`);
      });
      
      return output;
    } catch (error) {
      spinner.stop();
      return chalk.red(`Search failed: ${error.message}`);
    }
  }

  async getFileInfo(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const stats = await fs.stat(fullPath);
      const ext = path.extname(fullPath);
      const size = (stats.size / 1024).toFixed(2);
      
      const info = chalk.cyan(`\n📄 File Info: ${fullPath}\n`) +
        chalk.white(`  Size: ${size} KB\n`) +
        chalk.white(`  Type: ${ext || 'unknown'}\n`) +
        chalk.white(`  Created: ${stats.birthtime.toLocaleString()}\n`) +
        chalk.white(`  Modified: ${stats.mtime.toLocaleString()}\n`) +
        chalk.white(`  Permissions: ${stats.mode.toString(8)}\n`);
      
      return info;
    } catch (error) {
      return chalk.red(`File info failed: ${error.message}`);
    }
  }

  async createBackup(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      
      if (!await fs.pathExists(fullPath)) {
        logger.error(`File not found: ${filePath}`);
        return false;
      }
      
      const backupPath = `${fullPath}.backup`;
      await fs.copy(fullPath, backupPath);
      
      logger.success(`Backup created: ${backupPath}`);
      return true;
    } catch (error) {
      logger.error(`Backup failed: ${error.message}`);
      return false;
    }
  }

  async restoreBackup(filePath) {
    try {
      const fullPath = path.resolve(filePath);
      const backupPath = `${fullPath}.backup`;
      
      if (!await fs.pathExists(backupPath)) {
        logger.error(`Backup not found: ${backupPath}`);
        return false;
      }
      
      await fs.copy(backupPath, fullPath);
      logger.success(`Restored from backup: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Restore failed: ${error.message}`);
      return false;
    }
  }
}