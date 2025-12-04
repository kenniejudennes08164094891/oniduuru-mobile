import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-verify-credentials',
  templateUrl: './verify-credentials.component.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  styleUrls: ['./verify-credentials.component.scss']
})
export class VerifyCredentialsComponent {
  @Input() email: string = '';
  @Input() phoneNumber: string = '';
  @Output() completed = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() previous = new EventEmitter<void>();

  otp: string[] = ['', '', '', ''];
  timer: number = 120;
  interval: any;
  isLoading: boolean = false;
  error: string = '';
  constructor(private authService: AuthService, private toastCtrl: ToastController) { }

  ngOnInit() {
    this.startTimer();
  }

  // Mask email
  maskedEmail() {
    if (!this.email) return '';
    const parts = this.email.split('@');
    return parts[0].slice(0, 2) + '***@' + parts[1];
  }

  // Mask phone number
  maskedPhone() {
    if (!this.phoneNumber) return '';
    return this.phoneNumber.slice(0, 3) + '****' + this.phoneNumber.slice(-2);
  }

  // Start 120s countdown
  startTimer() {
    this.timer = 120;

    this.interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  // Move to next input
  moveNext(event: any, index: number) {
    const value = event.target.value;

    if (value.length === 1 && index < 3) {
      const next = event.target.nextElementSibling;
      if (next) next.focus();
    }

    if (value.length === 0 && index > 0) {
      const prev = event.target.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  // Check if OTP is complete
  otpComplete() {
    return this.otp.every(v => v && v.trim().length === 1);
  }

  // SUBMIT OTP → /verifyOTP
  onComplete() {
    if (!this.otpComplete()) return;

    const payload = {
      otp: this.otp.join(''),
      phoneNumber: this.phoneNumber,
      email: this.email
    };

    this.isLoading = true;

    this.authService.verifyOTP(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.presentSuccessToast();
        this.completed.emit();  // This moves onboarding to step 4 (success page)
      },
      error: (err) => {
        this.isLoading = false;
        this.error = err?.error?.message || "Invalid OTP. Try again.";
      }
    });
  }
 async presentSuccessToast() {
  const toast = await this.toastCtrl.create({
    message: 'Your profile has been created successfully',
    duration: 3000,
    position: 'top',
    color: 'success',
    cssClass: 'success-toast'
  });
  await toast.present();
}

  // RESEND OTP → /resendOTP
  resendOtp() {
    const payload = {
      phoneNumber: this.phoneNumber,
      email: this.email
    };

    this.authService.resendOTP(payload).subscribe({
      next: (res) => {
        console.log('OTP resent:', res);
        this.startTimer();
      },
      error: (err) => {
        console.error('Resend OTP failed:', err);
      }
    });
  }


  onPrevious() {
    this.previous.emit();
  }
}
