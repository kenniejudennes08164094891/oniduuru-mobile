import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-login-credentials',
  templateUrl: './login-credentials.component.html',
})
export class LoginCredentialsComponent {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  email = '';
  password = '';
  confirmPassword = '';

  formValid() {
    return (
      this.email &&
      this.password &&
      this.password === this.confirmPassword &&
      this.password.length >= 8
    );
  }

  onNext() {
    if (this.formValid()) this.next.emit();
  }

  onPrevious() {
    this.previous.emit();
  }
}
