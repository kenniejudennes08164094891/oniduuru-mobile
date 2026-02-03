import { Component, OnInit, ViewChild, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-forgot-password-phone-verify-otp',
  templateUrl: './forgot-password-phone-verify-otp.component.html',
  styleUrls: ['./forgot-password-phone-verify-otp.component.scss'],
})
export class ForgotPasswordPhoneVerifyOtpComponent implements OnInit {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  form!: FormGroup;
  talentId!: string;
  phoneNumber!: string;
  maskedPhoneNumber!: string;
  error = '';
  loading = false;
  resendDisabled = true;
  countdown = 120;
  otpDigits: string[] = ['', '', '', ''];
  submitBtn: string = "Proceed";

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastsService
  ) {}

  ngOnInit() {
    const navState = history.state;
    this.talentId = navState?.talentId;
    this.phoneNumber = navState?.phoneNumber;

    if (!this.talentId || !this.phoneNumber) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.maskedPhoneNumber = this.maskPhoneNumber(this.phoneNumber);
    this.buildForm();
    this.startCountdown();
  }

  private maskPhoneNumber(phone: string): string {
    const visibleChars = 4;
    return '*'.repeat(phone.length - visibleChars) + phone.substring(phone.length - visibleChars);
  }

  private buildForm(): void {
    this.form = this.fb.group({
      otp1: ['', Validators.required],
      otp2: ['', Validators.required],
      otp3: ['', Validators.required],
      otp4: ['', Validators.required],
    });
  }

  private startCountdown(): void {
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
      }
    }, 1000);
  }

  onOtpInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && /^[0-9]$/.test(value)) {
      this.otpDigits[index] = value;
      this.form.get(`otp${index + 1}`)?.setValue(value);

      // Move to next input if available
      if (index < 3) {
        const nextInput = this.otpInputs.toArray()[index + 1];
        if (nextInput) {
          nextInput.nativeElement.focus();
        }
      }
    } else {
      input.value = '';
      this.otpDigits[index] = '';
      this.form.get(`otp${index + 1}`)?.setValue('');
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = this.otpInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
      }
    }
  }

  verifyOtp(): void {
    if (this.form.invalid) return;

    this.submitBtn = "Processing...";
    const otp = this.otpDigits.join('');
    this.loading = true;
    this.error = '';

    // Call verification API
    this.authService.verifyOTP({ otp, phoneNumber: this.phoneNumber, email: '' }).subscribe({
      next: async () => {
        this.loading = false;
        // navigate to reset password page
        this.submitBtn = "Proceed";
       await this.router.navigate(['/auth/forgot-password/reset'], { state: { talentId: this.talentId } });
      },
      error: (err) => {
        this.loading = false;
        this.submitBtn = "Proceed";
        this.error = 'Invalid OTP. Please try again.';
        this.toastr.openSnackBar('Invalid OTP. Please try again.', 'error', 'error');
      },
    });
  }

  reInitiateOtp(): void {
    if (this.resendDisabled) return;

    this.resendDisabled = true;
    this.countdown = 120;

    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.resendDisabled = false;
      }
    }, 1000);

    // Call resend OTP API
    this.authService.resendOTP({ phoneNumber: this.phoneNumber, email: '' }).subscribe({
      next: () => {
        // OTP resent successfully
      },
      error: () => {
        this.resendDisabled = false;
        this.countdown = 0;
        clearInterval(interval);
      },
    });
  }

  async goBack(): Promise<void> {
   await this.router.navigate(['/auth/forgot-password/verify-otp/phone'], {
      state: history.state,
    });
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }
}
