import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password-verify-otp',
  templateUrl: './forgot-password-verify-otp.component.html',
  styleUrls: ['./forgot-password-verify-otp.component.scss'],
})
export class ForgotPasswordVerifyOtpComponent implements OnInit {
  talentId!: string;
  otpForm!: FormGroup;

  sendingOtp = false;
  verifyingOtp = false;
  otpValues: string[] = Array(6).fill('');

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const navState = history.state;

    if (!navState?.talentId) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.talentId = navState.talentId;
    this.buildForm();
  }

  private buildForm(): void {
    this.otpForm = this.fb.group({
      otpMethod: ['', Validators.required],
      otp: ['', Validators.required],
    });
  }

  /* =========================
     OTP FLOW
  ========================= */

  selectOtpMethod(method: 'phone' | 'email') {
    this.router.navigate(
      [`/auth/forgot-password/verify-otp/${method}`],
      { state: history.state }
    );
  }

  sendOtp(method: 'email' | 'phone'): void {
    if (this.sendingOtp) return;

    const payload = {
      talentId: this.talentId,
      method,
    };

    this.sendingOtp = true;

    this.authService.resendForgotPasswordOTP(payload).subscribe({
      next: () => {
        this.sendingOtp = false;
      },
      error: () => {
        this.sendingOtp = false;
      },
    });
  }

  onOtpInput(event: any, index: number): void {
    const value = event.target.value;
    if (!/^\d*$/.test(value)) return;

    this.otpValues[index] = value;
    this.otpForm.patchValue({ otp: this.otpValues.join('') });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid || this.verifyingOtp) return;

    const payload = {
      talentId: this.talentId,
      otp: this.otpForm.value.otp,
    };

    this.verifyingOtp = true;

    this.authService.verifyForgotPasswordOTP(payload).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.router.navigate(['/auth/reset-password'], {
          state: { talentId: this.talentId },
        });
      },
      error: () => {
        this.verifyingOtp = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
