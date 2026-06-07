import { ApplicationConfig } from '@angular/core';
import { AI_KIT_CONFIG } from 'ngx-ai-kit';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: AI_KIT_CONFIG,
      useValue: {
        apiUrl: 'http://localhost:3000/api/ai/chat',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
      },
    },
  ],
};
