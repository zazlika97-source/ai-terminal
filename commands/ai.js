import chalk from 'chalk';
import readline from 'readline';

export class AICommand {
  constructor(aiEngine, configManager) {
    this.aiEngine = aiEngine;
    this.configManager = configManager;
    this.conversationHistory = [];
    this.rl = null;
  }

  async startChat() {
    console.clear();
    
    console.log(chalk.cyan('\n  Miku AI Chat Mode'));
    console.log(chalk.gray('  ─────────────────────────────────────────'));
    console.log(chalk.gray('  Type /exit to return to menu\n'));
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('  You › ')
    });
    
    let running = true;
    
    this.rl.on('line', async (input) => {
      const message = input.trim();
      
      if (message === '/exit') {
        console.log(chalk.yellow('\n  👋 Exiting chat mode...\n'));
        this.rl.close();
        running = false;
        return;
      }
      
      if (!message) {
        this.rl.prompt();
        return;
      }
      
      process.stdout.write(chalk.gray('\r  Miku is thinking...'));
      
      try {
        const response = await this.aiEngine.chat(message, this.conversationHistory);
        
        process.stdout.write('\r\x1b[K');
        
        // ✅ Tampilkan response multi-baris, setiap baris diawali spasi 2 untuk alignment
        const lines = response.split('\n');
        for (const line of lines) {
          console.log(`  ${chalk.green(line)}`);
        }
        console.log(''); // Empty line after response
        
        this.conversationHistory.push({ role: 'user', content: message });
        this.conversationHistory.push({ role: 'assistant', content: response });
        
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
        
      } catch (error) {
        process.stdout.write('\r\x1b[K');
        console.log(`  ${chalk.red(`Error: ${error.message}`)}\n`);
      }
      
      this.rl.prompt();
    });
    
    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n  👋 Exiting chat mode...\n'));
      this.rl.close();
      running = false;
    });
    
    this.rl.on('close', () => {
      if (running) {
        running = false;
      }
    });
    
    this.rl.prompt();
    
    await new Promise((resolve) => {
      this.rl.on('close', resolve);
    });
  }
}