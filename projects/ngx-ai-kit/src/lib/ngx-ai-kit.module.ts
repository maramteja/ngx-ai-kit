import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AI_KIT_CONFIG } from './tokens';
import { AiKitConfig } from './models';
import { AiKitService } from './services/ai-kit.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
import { AiAutocompleteComponent } from './components/ai-autocomplete/ai-autocomplete.component';
import { StreamingTextComponent } from './components/streaming-text/streaming-text.component';

export { AiKitConfig, ChatMessage, AiStreamChunk, AutocompleteConfig, ChatWidgetConfig } from './models';
export { AiKitService } from './services/ai-kit.service';
export { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
export { AiAutocompleteComponent } from './components/ai-autocomplete/ai-autocomplete.component';
export { StreamingTextComponent } from './components/streaming-text/streaming-text.component';
export { AI_KIT_CONFIG } from './tokens';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ChatWidgetComponent,
    AiAutocompleteComponent,
    StreamingTextComponent,
  ],
  exports: [
    ChatWidgetComponent,
    AiAutocompleteComponent,
    StreamingTextComponent,
  ],
})
export class NgxAiKitModule {
  /**
   * Call in your root AppModule (or bootstrapApplication providers):
   *
   * NgxAiKitModule.forRoot({
   *   apiUrl: '/api/ai/chat',
   *   model: 'claude-sonnet-4-20250514',
   * })
   */
  static forRoot(config: AiKitConfig): ModuleWithProviders<NgxAiKitModule> {
    return {
      ngModule: NgxAiKitModule,
      providers: [
        AiKitService,
        { provide: AI_KIT_CONFIG, useValue: config },
      ],
    };
  }
}
