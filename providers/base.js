export class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = 'base';
  }

  async chat(messages, options = {}) {
    throw new Error('Method not implemented');
  }

  buildHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    
    // Only add auth if API key exists
    if (this.config.apiKey && this.config.apiKey.trim() !== '') {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }

  extractResponse(data) {
    // Try common response formats
    if (data.choices && data.choices[0]) {
      return data.choices[0].message?.content || data.choices[0].text;
    }
    if (data.response) return data.response;
    if (data.text) return data.text;
    if (data.content) return data.content;
    if (data.message) return data.message;
    if (data.candidates && data.candidates[0]) {
      return data.candidates[0].content?.parts?.[0]?.text;
    }
    
    return JSON.stringify(data);
  }

  handleError(error) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return new Error('Provider requires API key - please configure your API key');
      }
      if (status === 429) {
        return new Error('Rate limit exceeded - please wait');
      }
      if (status === 500) {
        return new Error('Provider server error - try again later');
      }
      
      return new Error(`API Error (${status}): ${JSON.stringify(data)}`);
    }
    
    if (error.request) {
      return new Error('Network error - check your connection');
    }
    
    return error;
  }
}