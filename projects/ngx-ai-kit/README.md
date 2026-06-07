# ngx-ai-kit

> Angular AI component library — drop-in chat widget, AI autocomplete & streaming text for any LLM backend.

[![npm version](https://img.shields.io/npm/v/ngx-ai-kit.svg)](https://www.npmjs.com/package/ngx-ai-kit)
[![Angular](https://img.shields.io/badge/Angular-17%2B-DD0031?logo=angular)](https://angular.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## Features

- **`<ngx-chat-widget>`** — streaming chat UI with message history, auto-scroll, clear button
- **`<ngx-ai-autocomplete>`** — AI-powered input with debounced suggestions; reactive forms compatible (CVA)
- **`<ngx-streaming-text>`** — inline streaming text with blinking cursor
- Works with **any LLM backend** — Anthropic, OpenAI, or your own proxy
- Standalone components + NgModule (forRoot config pattern)

## Installation

\`\`\`bash
npm install ngx-ai-kit
\`\`\`

## Quick Start

### Register (AppModule)

\`\`\`typescript
import { NgxAiKitModule } from 'ngx-ai-kit';

@NgModule({
  imports: [
    NgxAiKitModule.forRoot({
      apiUrl: '/api/ai/chat',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 1024,
    }),
  ],
})
export class AppModule {}
\`\`\`

### Standalone Bootstrap

\`\`\`typescript
import { AI_KIT_CONFIG } from 'ngx-ai-kit';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: AI_KIT_CONFIG, useValue: { apiUrl: '/api/ai/chat' } },
  ],
});
\`\`\`

> **Security:** Never put LLM API keys in the Angular app. Use a backend proxy.

### Chat Widget

\`\`\`html
<ngx-chat-widget
  [config]="{
    title: 'Support Assistant',
    welcomeMessage: 'Hi! How can I help?',
    height: '520px'
  }"
  systemPrompt="You are a helpful support agent."
/>
\`\`\`

### AI Autocomplete

\`\`\`html
<ngx-ai-autocomplete
  [(ngModel)]="value"
  label="Search"
  context="Enterprise SaaS platform"
  [config]="{ debounceMs: 400, minChars: 3 }"
  (suggestionSelected)="onSelected($event)"
/>
\`\`\`

Also works with reactive forms via `formControlName`.

### Streaming Text

\`\`\`html
<ngx-streaming-text
  prompt="Write a tagline for a voice AI startup"
/>
\`\`\`

## Backend Proxy (Node.js)

\`\`\`javascript
app.post('/api/ai/chat', async (req, res) => {
  const { messages, system, stream, model, max_tokens } = req.body;
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    const s = await anthropic.messages.stream({ model, max_tokens, system, messages });
    for await (const chunk of s) {
      if (chunk.type === 'content_block_delta')
        res.write(`data: ${JSON.stringify({ delta: { text: chunk.delta.text } })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    res.json(await anthropic.messages.create({ model, max_tokens, system, messages }));
  }
});
\`\`\`

## Build & Publish

\`\`\`bash
npm run build        # builds to dist/ngx-ai-kit
npm run publish:lib  # builds + npm publish
\`\`\`

## Author

**Teja Maram** — [linkedin.com/in/tejamaram](https://linkedin.com/in/tejamaram) · [github.com/maramteja](https://github.com/maramteja)

## License

MIT
