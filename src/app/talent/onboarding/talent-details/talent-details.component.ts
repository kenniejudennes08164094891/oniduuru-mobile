import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-talent-details',
  templateUrl: './talent-details.component.html',
})
export class TalentDetailsComponent {
  @Output() next = new EventEmitter<void>();

  constructor(private router: Router) {}

  fullName = '';
  phone = '';
  email = '';
  location = '';

  fullNameTouched = false;
  phoneTouched = false;
  emailTouched = false;
  locationTouched = false;

  // ----------------- VALIDATIONS -----------------
  fullNameValid() {
    return this.fullName.trim().length >= 3;
  }

  phoneValid() {
    return /^[0-9]{7,}$/.test(this.phone);
  }

  emailValid() {
    if (!this.email.trim()) return true; // optional field
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  locationValid() {
    return this.location.trim().length >= 2;
  }

  formValid(): boolean {
    return (
      this.fullNameValid() &&
      this.phoneValid() &&
      this.emailValid() &&
      this.locationValid()
    );
  }

  // ----------------- SANITIZE ON BLUR -----------------
  sanitizeName() {
    this.fullName = this.fullName.replace(/[^a-zA-Z\s]/g, '');
  }

  sanitizePhone() {
    this.phone = this.phone.replace(/[^0-9]/g, '');
  }

  sanitizeLocation() {
    this.location = this.location.replace(/[^a-zA-Z0-9\s]/g, '');
  }

  // ----------------- HANDLERS -----------------
  onNext() {
    // mark all touched
    this.fullNameTouched = true;
    this.phoneTouched = true;
    this.emailTouched = true;
    this.locationTouched = true;

    // sanitize before validation
    this.sanitizeName();
    this.sanitizePhone();
    this.sanitizeLocation();

    if (this.formValid()) {
      this.next.emit();
    }
  }

  onCancel() {
    this.router.navigate(['/welcome-page']);
  }
}
