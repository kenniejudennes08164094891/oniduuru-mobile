import { Component, EventEmitter, Output, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-verify-credentials',
  templateUrl: './verify-credentials.component.html',
})
export class VerifyCredentialsComponent implements OnInit, OnDestroy {
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  @Input() email = '';
  @Input() phone = '';

  otp: string[] = ['', '', '', ''];
  timer = 120;
  intervalId: any;

  ngOnInit() {
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // ---------------- MASKED DISPLAY ----------------
  maskedEmail(): string {
    if (!this.email) return '';
    const [user, domain] = this.email.split('@');
    if (user.length <= 2) return '*'.repeat(user.length) + '@' + domain;
    return user[0] + '*'.repeat(user.length - 2) + user.slice(-1) + '@' + domain;
  }

  maskedPhone(): string {
    if (!this.phone) return '';
    return this.phone.slice(0, 2) + '*'.repeat(this.phone.length - 4) + this.phone.slice(-2);
  }

  // ---------------- OTP HANDLERS ----------------
  moveNext(event: any, idx: number) {
    const input = event.target;
    const val = input.value;
    if (/[^0-9]/.test(val)) {
      input.value = '';
      return;
    }
    if (val && idx < this.otp.length - 1) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  otpComplete(): boolean {
    return this.otp.every(d => d !== '');
  }

  onComplete() {
    if (this.otpComplete()) this.next.emit();
  }

  onPrevious() {
    this.previous.emit();
  }

  // ---------------- TIMER ----------------
  startTimer() {
    this.timer = 120;
    this.intervalId = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  resendOtp() {
    // TODO: call API to resend OTP to email/phone
    this.otp = ['', '', '', ''];
    this.startTimer();
  }
}
