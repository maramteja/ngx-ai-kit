import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AiKitService } from '../../services/ai-kit.service';
import { ChatMessage } from '../../models';

@Component({
  selector: 'ngx-streaming-text',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="ngx-streaming-text">
      {{ displayText }}<span
        class="ngx-streaming-cursor"
        *ngIf="isStreaming"
      ></span>
    </span>
  `,
  styles: [`
    :host { display: inline; }
    .ngx-streaming-text { white-space: pre-wrap; word-break: break-word; }
    .ngx-streaming-cursor {
      display: inline-block;
      width: 2px;
      height: 1em;
      background: currentColor;
      margin-left: 1px;
      vertical-align: text-bottom;
      animation: blink 0.8s step-end infinite;
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingTextComponent implements OnChanges, OnDestroy {
  /** Prompt to stream a response for */
  @Input() prompt?: string;
  /** System prompt */
  @Input() systemPrompt?: string;
  /** Or pass pre-built messages */
  @Input() messages?: ChatMessage[];

  displayText = '';
  isStreaming = false;

  private sub?: Subscription;

  constructor(private aiKit: AiKitService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['prompt'] || changes['messages']) &&
        (this.prompt || this.messages?.length)) {
      this.startStream();
    }
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  /** Manually trigger a stream with a custom prompt */
  stream(prompt: string, systemPrompt?: string): void {
    this.prompt = prompt;
    this.systemPrompt = systemPrompt;
    this.startStream();
  }

  private startStream(): void {
    this.sub?.unsubscribe();
    this.displayText = '';
    this.isStreaming = true;
    this.cdr.markForCheck();

    const msgs: ChatMessage[] = this.messages ?? [
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: this.prompt ?? '',
        timestamp: new Date(),
      },
    ];

    this.sub = this.aiKit.stream(msgs, this.systemPrompt).subscribe({
      next: (chunk) => {
        if (chunk.type === 'delta' && chunk.content) {
          this.displayText += chunk.content;
          this.cdr.markForCheck();
        } else if (chunk.type === 'done' || chunk.type === 'error') {
          this.isStreaming = false;
          this.cdr.markForCheck();
        }
      },
      error: () => {
        this.isStreaming = false;
        this.cdr.markForCheck();
      },
    });
  }
}
