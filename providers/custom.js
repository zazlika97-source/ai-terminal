import axios from 'axios';
import { BaseProvider } from './base.js';

export class CustomProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'custom';
  }

  async chat(messages, options = {}) {
    try {
      const endpoint = this.config.endpoint;
      
      if (!endpoint) {
        throw new Error('Custom endpoint not configured');
      }
      
      // Auto-detect request format based on endpoint
      const requestBody = this.buildRequestBody(messages, options);
      const headers = this.buildHeaders();
      
      const response = await axios.post(endpoint, requestBody, {
        headers: headers,
        timeout: 30000
      });
      
      return this.extractResponse(response.data);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  buildRequestBody(messages, options) {
    const endpoint = this.config.endpoint;
    
    // OpenAI compatible
    if (endpoint.includes('openai') || endpoint.includes('v1/chat/completions')) {
      return {
        model: options.model || this.config.model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 1000
      };
    }
    
    // Simple format
    if (endpoint.includes('simple') || endpoint.includes('api')) {
      const lastMessage = messages[messages.length - 1];
      return {
        prompt: lastMessage.content,
        context: messages.slice(0, -1),
        system: messages.find(m => m.role === 'system')?.content
      };
    }
    
    // Default format
    return {
      messages: messages,
      input: messages[messages.length - 1]?.content,
      parameters: {
        temperature: options.temperature || 0.7
      }
    };
  }
}