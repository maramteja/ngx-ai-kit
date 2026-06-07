import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AiKitService } from '../../services/ai-kit.service';
import { ChatMessage, ChatWidgetConfig } from '../../models';

@Component({
  selector: 'ngx-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrls: ['./chat-widget.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() config: ChatWidgetConfig = {};
  @Input() systemPrompt?: string;

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  messages: ChatMessage[] = [];
  inputText = '';
  isLoading = false;

  private streamSub?: Subscription;
  private shouldScroll = false;

  constructor(
    private aiKit: AiKitService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.config.welcomeMessage) {
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: this.config.welcomeMessage,
        timestamp: new Date(),
      });
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  ngOnDestroy(): void {
    this.streamSub?.unsubscribe();
  }

  get title(): string { return this.config.title ?? 'AI Assistant'; }
  get placeholder(): string { return this.config.placeholder ?? 'Ask me anything…'; }
  get height(): string { return this.config.height ?? '480px'; }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || this.isLoading) return;

    // Add user message
    this.messages.push({
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    });

    // Placeholder assistant message for streaming
    const assistantMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    this.messages.push(assistantMsg);

    this.inputText = '';
    this.isLoading = true;
    this.shouldScroll = true;
    this.cdr.markForCheck();

    this.streamSub = this.aiKit
      .stream(this.messages.slice(0, -1), this.systemPrompt ?? this.config.systemPrompt)
      .subscribe({
        next: (chunk) => {
          if (chunk.type === 'delta' && chunk.content) {
            assistantMsg.content += chunk.content;
            this.shouldScroll = true;
            this.cdr.markForCheck();
          } else if (chunk.type === 'done' || chunk.type === 'error') {
            assistantMsg.isStreaming = false;
            if (chunk.type === 'error') {
              assistantMsg.content = `⚠️ Error: ${chunk.error}`;
            }
            this.isLoading = false;
            this.cdr.markForCheck();
          }
        },
        error: () => {
          assistantMsg.isStreaming = false;
          assistantMsg.content = '⚠️ Something went wrong. Please try again.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  clearChat(): void {
    this.messages = [];
    if (this.config.welcomeMessage) {
      this.messages.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        content: this.config.welcomeMessage,
        timestamp: new Date(),
      });
    }
    this.cdr.markForCheck();
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  trackById(_: number, msg: ChatMessage): string { return msg.id; }

  private scrollToBottom(): void {
    try {
      this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch { /* noop */ }
  }
}
