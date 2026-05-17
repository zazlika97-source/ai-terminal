import axios from 'axios';
import { BaseProvider } from './base.js';

export class GeminiProvider extends BaseProvider {
  constructor(config) {
    super(config);
    this.name = 'gemini';
  }

  async chat(messages, options = {}) {
    try {
      if (!this.config.apiKey) {
        throw new Error('Gemini requires API key. Please configure your API key first.');
      }
      
      // Get model from config or use default
      const model = this.config.model || options.model || 'gemini-pro';
      
      // Convert messages to Gemini format
      const lastMessage = messages[messages.length - 1];
      const prompt = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');
      
      // Use correct endpoint with model
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`;
      
      const response = await axios.post(
        endpoint,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 1000
          }
        },
        { timeout: 30000 }
      );
      
      return response.data.candidates[0]?.content?.parts[0]?.text || 'No response';
    } catch (error) {
      throw this.handleError(error);
    }
  }
}