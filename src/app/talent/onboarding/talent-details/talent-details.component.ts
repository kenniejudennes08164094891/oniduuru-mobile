import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-talent-details',
  templateUrl: './talent-details.component.html',
})
export class TalentDetailsComponent {
  @Output() next = new EventEmitter<void>();

  fullName = '';
  phone = '';
  email = '';
  location = '';

  formValid() {
    return this.fullName && this.phone && this.email && this.location;
  }

  onNext() {
    if (this.formValid()) {
      this.next.emit();
    }
  }
}
