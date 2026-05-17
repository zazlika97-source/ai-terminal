import axios from 'axios';
import { BaseProvider } from './base.js';

export class OpenRouterProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'openrouter';
    this.endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async chat(messages, options = {}) {
    try {
      if (!this.config.apiKey) {
        throw new Error('OpenRouter requires API key. Please configure your API key first.');
      }
      
      const response = await axios.post(
        this.endpoint,
        {
          model: options.model || this.config.model || 'openai/gpt-3.5-turbo',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
        },
        {
          headers: {
            ...this.buildHeaders(),
            'HTTP-Referer': 'https://github.com/miku-terminal',
            'X-Title': 'Miku AI Terminal'
          },
          timeout: 30000
        }
      );
      
      return this.extractResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}