import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-verify-credentials',
  templateUrl: './verify-credentials.component.html',
})
export class VerifyCredentialsComponent {
  @Output() completed = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  email = 'baba.saala@gmail.com';
  otp: string[] = ['', '', '', ''];

  otpComplete() {
    return this.otp.every(o => o.length === 1);
  }

  moveNext(event: any, index: number) {
    if (event.target.value && index < 3) {
      const nextInput = event.target.parentElement.children[index + 1];
      nextInput.focus();
    }
  }

  onComplete() {
    if (this.otpComplete()) this.completed.emit();
  }

  onPrevious() {
    this.previous.emit();
  }
}
