import { getProvider } from '../providers/index.js';
import { logger } from '../utils/logger.js';

export class AIEngine {
  constructor(configManager) {
    this.configManager = configManager;
    this.provider = null;
  }

  async initialize() {
    await this.updateProvider();
  }

  async updateProvider() {
    const config = this.configManager.getAll();
    const providerName = config.ai.provider;
    const providerConfig = config.ai;
    
    this.provider = getProvider(providerName, providerConfig);
    logger.info(`Using provider: ${providerName}`);
  }

  async chat(userMessage, history = []) {
    try {
      const config = this.configManager.getAll();
      let systemPrompt = config.ai.systemPrompt;
      
      // HAPUS paksaan one line - biarkan AI merespon natural
      // if (!systemPrompt.includes('one line')) {
      //   systemPrompt += ' Respond in one line only, no line breaks.';
      // }
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage }
      ];
      
      const response = await this.provider.chat(messages);
      
      // HAPUS replace newline - biarkan response asli dengan barisnya
      // return response.replace(/\n/g, ' ').replace(/\r/g, '').trim();
      return response.trim();
      
    } catch (error) {
      logger.error(`AI Error: ${error.message}`);
      
      if (error.message.includes('API key')) {
        return `API key required. Use .editapikey to configure.`;
      }
      
      if (error.message.includes('Network error')) {
        return `Network error: ${error.message}`;
      }
      
      return `Error: ${error.message}`;
    }
  }
}