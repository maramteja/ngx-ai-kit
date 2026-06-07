export interface AiKitConfig {
  apiUrl: string;
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  headers?: Record<string, string>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface AiStreamChunk {
  type: 'delta' | 'done' | 'error';
  content?: string;
  error?: string;
}

export interface AutocompleteConfig {
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
  placeholder?: string;
}

export interface ChatWidgetConfig {
  title?: string;
  placeholder?: string;
  systemPrompt?: string;
  welcomeMessage?: string;
  theme?: 'light' | 'dark' | 'auto';
  height?: string;
}
