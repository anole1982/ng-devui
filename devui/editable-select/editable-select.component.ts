import {
  Component,
  Input,
  TemplateRef,
  OnInit,
  OnChanges,
  ViewChild,
  ChangeDetectorRef,
  SimpleChanges,
  forwardRef,
  Output,
  EventEmitter,
  OnDestroy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';

import { AutoCompleteDirective } from 'ng-devui/auto-complete';
import { I18nService, I18nInterface } from 'ng-devui/i18n';

@Component({
  selector: 'd-editable-select',
  templateUrl: './editable-select.component.html',
  styleUrls: ['./editable-select.component.scss'],
  exportAs: 'editable-select',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditableSelectComponent),
      multi: true,
    },
  ],
})
export class EditableSelectComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  constructor(private changeDetectorRef: ChangeDetectorRef, private i18n: I18nService) {
    this.i18nCommonText = this.i18n.getI18nText().common;
  }
  @Input() appendToBody = false;
  @Input() cssClass: string;
  @Input() disabled = false;
  @Input() placeholder = '';
  @Input() source: any[] = [];
  @Input() isOpen: boolean;
  @Input() itemTemplate: TemplateRef<any>;
  @Input() noResultItemTemplate: TemplateRef<any>;
  @Input() maxHeight: number;
  @Input() disabledKey: string;
  @Input() searchFn: (term: string) => Observable<any[]>;
  @Input() enableLazyLoad = false;
  @Output() loadMore = new EventEmitter<any>();
  @ViewChild(AutoCompleteDirective, { static: true }) autoCompleteDirective: AutoCompleteDirective;
  @ViewChild('editableSelectBox', { static: true }) editableSelectBox: ElementRef;
  multiItems: any[] = [];
  inputValue: any;
  activeIndex = 0;
  subscription;
  i18nCommonText: I18nInterface['common'];
  i18nSubscription: Subscription;
  private _dropDownOpen = false;
  private onChange = (_: any) => null;
  private onTouched = () => null;

  set dropDownOpen(val) {
    this._dropDownOpen = val;
    if (this._dropDownOpen) {
      this.autoCompleteDirective.openPopup(this.activeIndex);
    } else {
      this.autoCompleteDirective.hidePopup();
    }
  }
  get dropDownOpen() {
    return this._dropDownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick($event: Event) {
    if (!this.dropDownOpen) {
      return;
    }

    const targetEl = $event.target as HTMLElement;
    // 1. elements except current instance's input box click;
    // 2. drop down item select
    if (!this.editableSelectBox.nativeElement.contains(targetEl) || targetEl.classList.contains('devui-dropdown-item')) {
      this.dropDownOpen = false;
    }
  }

  writeValue(obj: any): void {
    const value = obj || '';
    this.inputValue = value;
    this.changeDetectorRef.markForCheck();
  }

  ngOnInit() {
    this.i18nSubscription = this.i18n.langChange().subscribe((data) => {
      this.i18nCommonText = data.common;
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes && changes['searchFn'] && typeof this.searchFn === 'function') {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
      this.subscription = this.searchFn('').subscribe((source) => {
        this.source = source;
      });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onTermChange(value) {
    this.inputValue = value;
    this.onChange(this.inputValue);
  }

  toggle($event: Event) {
    const inputString = typeof this.inputValue === 'string' ? this.inputValue : this.inputValue.label;
    this.activeIndex = this.source
      .map((item) => {
        if (typeof item === 'string') {
          return item.toLowerCase();
        } else if (typeof item.label === 'string') {
          return item.label.toLowerCase();
        }
      })
      .indexOf(inputString.toLowerCase());
    this.activeIndex = this.activeIndex > -1 ? this.activeIndex : 0;

    this.dropDownOpen = !this.dropDownOpen;
  }
  loadMoreEvent($event) {
    this.loadMore.emit($event);
  }
  ngOnDestroy() {
    if (this.i18nSubscription) {
      this.i18nSubscription.unsubscribe();
    }
  }
}
