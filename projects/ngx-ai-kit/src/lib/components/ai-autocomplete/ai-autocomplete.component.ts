import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, Subscription, from, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { AiKitService } from '../../services/ai-kit.service';
import { AutocompleteConfig } from '../../models';

@Component({
  selector: 'ngx-ai-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-autocomplete.component.html',
  styleUrls: ['./ai-autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AiAutocompleteComponent),
      multi: true,
    },
  ],
})
export class AiAutocompleteComponent implements OnDestroy, ControlValueAccessor {
  @Input() config: AutocompleteConfig = {};
  @Input() context?: string;
  @Input() label?: string;

  @Output() suggestionSelected = new EventEmitter<string>();

  value = '';
  suggestions: string[] = [];
  isLoading = false;
  showDropdown = false;
  activeIndex = -1;

  private inputSubject = new Subject<string>();
  private sub: Subscription;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private aiKit: AiKitService, private cdr: ChangeDetectorRef) {
    const debounce = this.config.debounceMs ?? 400;
    const minChars = this.config.minChars ?? 3;

    this.sub = this.inputSubject.pipe(
      debounceTime(debounce),
      distinctUntilChanged(),
      switchMap((text) => {
        if (text.length < minChars) {
          this.suggestions = [];
          this.showDropdown = false;
          this.isLoading = false;
          this.cdr.markForCheck();
          return of([]);
        }
        this.isLoading = true;
        this.cdr.markForCheck();
        return from(this.aiKit.autocomplete(text, this.context));
      })
    ).subscribe({
      next: (results: string[]) => {
        this.suggestions = results.slice(0, this.config.maxSuggestions ?? 5);
        this.showDropdown = this.suggestions.length > 0;
        this.isLoading = false;
        this.activeIndex = -1;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  get placeholder(): string { return this.config.placeholder ?? 'Start typing for AI suggestions…'; }

  onInput(text: string): void {
    this.value = text;
    this.onChange(text);
    this.inputSubject.next(text);
  }

  selectSuggestion(suggestion: string): void {
    this.value = suggestion;
    this.onChange(suggestion);
    this.suggestions = [];
    this.showDropdown = false;
    this.suggestionSelected.emit(suggestion);
    this.cdr.markForCheck();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.showDropdown) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, -1);
    } else if (event.key === 'Enter' && this.activeIndex >= 0) {
      event.preventDefault();
      this.selectSuggestion(this.suggestions[this.activeIndex]);
    } else if (event.key === 'Escape') {
      this.showDropdown = false;
    }
    this.cdr.markForCheck();
  }

  onBlur(): void {
    this.onTouched();
    // slight delay so click on suggestion registers
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.markForCheck();
    }, 150);
  }

  // ControlValueAccessor
  writeValue(val: string): void { this.value = val ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
}
