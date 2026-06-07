import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgxAiKitModule,
  ChatWidgetConfig,
  AutocompleteConfig,
} from 'ngx-ai-kit';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, NgxAiKitModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  chatConfig: ChatWidgetConfig = {
    title: 'AI Assistant',
    welcomeMessage: 'Hello! 👋 I\'m your AI assistant powered by ngx-ai-kit. Ask me anything!',
    placeholder: 'Type your message…',
    height: '520px',
  };

  autocompleteConfig: AutocompleteConfig = {
    debounceMs: 400,
    minChars: 3,
    maxSuggestions: 5,
    placeholder: 'Start typing for AI suggestions…',
  };

  autocompleteValue = '';

  onSuggestionSelected(suggestion: string): void {
    console.log('Suggestion selected:', suggestion);
  }
}
