import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-other-details',
  templateUrl: './other-details.component.html',
})
export class OtherDetailsComponent {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  skillLevel = '';
  skillSet = '';
  education = '';
  payRange = '';

  formValid() {
    return this.skillLevel && this.skillSet && this.payRange;
  }

  onNext() {
    if (this.formValid()) this.next.emit();
  }

  onPrevious() {
    this.previous.emit();
  }
}
