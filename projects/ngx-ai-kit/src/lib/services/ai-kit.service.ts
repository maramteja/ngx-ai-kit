import { Injectable, Inject, Optional } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { AI_KIT_CONFIG } from '../tokens';
import { AiKitConfig, AiStreamChunk, ChatMessage } from '../models';

@Injectable({ providedIn: 'root' })
export class AiKitService {
  private config: AiKitConfig = { apiUrl: '' };

  constructor(@Optional() @Inject(AI_KIT_CONFIG) config: AiKitConfig) {
    if (config) this.config = config;
  }

  configure(config: AiKitConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a chat completion request — returns full response as a promise.
   */
  async complete(messages: ChatMessage[], systemPrompt?: string): Promise<string> {
    const payload = this.buildPayload(messages, systemPrompt, false);
    const res = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`AI request failed: ${res.status} ${res.statusText}`);
    const data = await res.json();
    // Support both Anthropic and OpenAI response shapes
    return data?.content?.[0]?.text ?? data?.choices?.[0]?.message?.content ?? '';
  }

  /**
   * Send a streaming chat request via SSE — emits AiStreamChunk events.
   */
  stream(messages: ChatMessage[], systemPrompt?: string): Observable<AiStreamChunk> {
    const subject = new Subject<AiStreamChunk>();
    const payload = this.buildPayload(messages, systemPrompt, true);

    fetch(this.config.apiUrl, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          subject.next({ type: 'error', error: `Request failed: ${res.status}` });
          subject.complete();
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') {
              subject.next({ type: 'done' });
              subject.complete();
              return;
            }
            try {
              const parsed = JSON.parse(raw);
              // Anthropic shape
              const anthropicDelta = parsed?.delta?.text;
              // OpenAI shape
              const openAiDelta = parsed?.choices?.[0]?.delta?.content;
              const text = anthropicDelta ?? openAiDelta;
              if (text) subject.next({ type: 'delta', content: text });
            } catch {
              // Non-JSON SSE lines — skip
            }
          }
        }

        subject.next({ type: 'done' });
        subject.complete();
      })
      .catch((err) => {
        subject.next({ type: 'error', error: err.message });
        subject.complete();
      });

    return subject.asObservable();
  }

  /**
   * Get autocomplete suggestions for a partial input string.
   */
  async autocomplete(partial: string, context?: string): Promise<string[]> {
    const messages: ChatMessage[] = [
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: context
          ? `Context: ${context}\n\nComplete this: "${partial}"`
          : `Provide 3 concise autocomplete suggestions for: "${partial}"`,
        timestamp: new Date(),
      },
    ];
    const system =
      'You are an autocomplete engine. Respond ONLY with a JSON array of 3 short string suggestions. No explanation, no markdown.';
    const raw = await this.complete(messages, system);
    try {
      const cleaned = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [raw.trim()];
    }
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private buildPayload(
    messages: ChatMessage[],
    systemPrompt?: string,
    stream = false
  ): Record<string, unknown> {
    const mapped = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    return {
      model: this.config.model ?? 'claude-sonnet-4-20250514',
      max_tokens: this.config.maxTokens ?? 1024,
      stream,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: mapped,
    };
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.config.apiKey ? { 'x-api-key': this.config.apiKey } : {}),
      ...(this.config.headers ?? {}),
    };
  }
}
