import { FreeProvider } from './free.js';
import { GroqProvider } from './groq.js';
import { GeminiProvider } from './gemini.js';
import { OpenRouterProvider } from './openrouter.js';
import { CustomProvider } from './custom.js';

export function getProvider(providerName, config) {
  switch (providerName) {
    case 'free':
      return new FreeProvider(config);
    case 'groq':
      return new GroqProvider(config);
    case 'gemini':
      return new GeminiProvider(config);
    case 'openrouter':
      return new OpenRouterProvider(config);
    case 'custom':
      return new CustomProvider(config);
    default:
      return new CustomProvider(config);
  }
}

export {
  FreeProvider,
  GroqProvider,
  GeminiProvider,
  OpenRouterProvider,
  CustomProvider
};