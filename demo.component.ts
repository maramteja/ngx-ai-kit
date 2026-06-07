/**
 * Example: how to use all three ngx-ai-kit components
 * in a single Angular standalone component.
 */
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxAiKitModule,
  ChatWidgetConfig,
  AutocompleteConfig,
} from 'ngx-ai-kit';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [FormsModule, NgxAiKitModule],
  template: `
    <div style="max-width:720px; margin:0 auto; padding:2rem; display:flex; flex-direction:column; gap:2rem;">

      <h2>Chat Widget</h2>
      <ngx-chat-widget
        [config]="chatConfig"
        systemPrompt="You are a helpful assistant. Be concise."
      />

      <h2>AI Autocomplete</h2>
      <ngx-ai-autocomplete
        [(ngModel)]="autocompleteValue"
        label="Search products"
        context="We sell developer tools and SaaS software"
        [config]="autocompleteConfig"
        (suggestionSelected)="onSuggestionSelected($event)"
      />
      <p>Selected: {{ autocompleteValue }}</p>

      <h2>Streaming Text</h2>
      <p>
        <ngx-streaming-text
          prompt="Write one sentence explaining why Angular is great for enterprise apps."
        />
      </p>

    </div>
  `,
})
export class DemoComponent {
  chatConfig: ChatWidgetConfig = {
    title: 'AI Assistant',
    welcomeMessage: 'Hello! How can I help you today?',
    placeholder: 'Type your message…',
    height: '480px',
  };

  autocompleteConfig: AutocompleteConfig = {
    debounceMs: 400,
    minChars: 3,
    maxSuggestions: 5,
    placeholder: 'Start typing for AI suggestions…',
  };

  autocompleteValue = '';

  onSuggestionSelected(suggestion: string): void {
    console.log('Selected:', suggestion);
  }
}
