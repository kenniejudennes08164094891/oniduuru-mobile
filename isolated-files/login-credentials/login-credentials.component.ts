import { Component, EventEmitter, Output, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-login-credentials',
  templateUrl: './login-credentials.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class LoginCredentialsComponent {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  @Input() email = '';
  @Input() password = '';
  @Input() confirmPassword = '';

  constructor(private router: Router) {}

  emailTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  emailValid() {
    if (!this.email.trim()) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  passwordValid() {
    if (!this.password) return false;
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/;
    return pattern.test(this.password);
  }

  confirmPasswordValid() {
    return this.confirmPassword === this.password && !!this.confirmPassword;
  }

  formValid() {
    return this.emailValid() && this.passwordValid() && this.confirmPasswordValid();
  }

  onNext() {
    this.emailTouched = true;
    this.passwordTouched = true;
    this.confirmPasswordTouched = true;

    if (this.formValid()) {
      // Instead of this.next.emit()
      this.router.navigate(['/auth/verify-otp'], {
        queryParams: { email: this.email }
      });
    }
  }

  onPrevious() {
    this.previous.emit();
  }
}
