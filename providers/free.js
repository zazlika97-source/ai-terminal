import axios from 'axios';
import { BaseProvider } from './base.js';

export class FreeProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'free';
  }

  async chat(messages, options = {}) {
    try {
      const userMessage = messages[messages.length - 1]?.content || '';
      const endpoint = this.config.endpoint;
      
      // Try multiple free endpoint formats
      const endpoints = [
        `${endpoint}?text=${encodeURIComponent(userMessage)}`,
        `${endpoint}?prompt=${encodeURIComponent(userMessage)}`,
        `${endpoint}?q=${encodeURIComponent(userMessage)}`,
        `${endpoint}?message=${encodeURIComponent(userMessage)}`
      ];
      
      let lastError = null;
      
      for (const url of endpoints) {
        try {
          const response = await axios.get(url, {
            timeout: 30000,
            headers: { 'Accept': 'application/json' }
          });
          
          const result = this.extractResponse(response.data);
          if (result && result !== 'undefined') {
            return result;
          }
        } catch (error) {
          lastError = error;
          continue;
        }
      }
      
      throw lastError || new Error('All free endpoints failed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  extractResponse(data) {
    // Handle various free API response formats
    if (typeof data === 'string') return data;
    if (data.response) return data.response;
    if (data.text) return data.text;
    if (data.result) return data.result;
    if (data.message) return data.message;
    if (data.content) return data.content;
    if (data.data) return this.extractResponse(data.data);
    if (data.choices && data.choices[0]) {
      return data.choices[0].message?.content || data.choices[0].text;
    }
    
    return null;
  }
}