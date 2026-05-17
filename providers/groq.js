import axios from 'axios';
import { BaseProvider } from './base.js';

export class GroqProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'groq';
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async chat(messages, options = {}) {
    try {
      if (!this.config.apiKey) {
        throw new Error('Groq requires API key. Please configure your API key first.');
      }
      
      const response = await axios.post(
        this.endpoint,
        {
          model: options.model || this.config.model || 'mixtral-8x7b-32768',
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 1000
        },
        {
          headers: this.buildHeaders(),
          timeout: 30000
        }
      );
      
      return this.extractResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }
}