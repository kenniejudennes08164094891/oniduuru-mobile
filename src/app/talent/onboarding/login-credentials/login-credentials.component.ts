import { Component, EventEmitter, Output, Input } from '@angular/core';

@Component({
  selector: 'app-login-credentials',
  templateUrl: './login-credentials.component.html',
})
export class LoginCredentialsComponent {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  @Input() email = '';
  @Input() password = '';
  @Input() confirmPassword = '';

  emailTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  // ---------------- VALIDATIONS ----------------
  emailValid() {
    if (!this.email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  passwordValid() {
    if (!this.password) return false;
    // Password must contain 8+ chars, uppercase, lowercase, special char
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
    return pattern.test(this.password);
  }

  confirmPasswordValid() {
    return this.confirmPassword === this.password && !!this.confirmPassword;
  }

  formValid() {
    return this.emailValid() && this.passwordValid() && this.confirmPasswordValid();
  }

  // ---------------- HANDLERS ----------------
  onNext() {
    this.emailTouched = true;
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;

    if (this.formValid()) this.next.emit();
  }

  onPrevious() {
    this.previous.emit();
  }
}
