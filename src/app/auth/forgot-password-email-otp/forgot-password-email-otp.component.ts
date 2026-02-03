import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-forgot-password-email-otp',
  templateUrl: './forgot-password-email-otp.component.html',
  styleUrls: ['./forgot-password-email-otp.component.scss'],
})
export class ForgotPasswordEmailOtpComponent implements OnInit {
  form!: FormGroup;
  talentId!: string;
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.talentId = history.state?.talentId;

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  sendOtp() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const email = this.form.value.email;

    this.authService.resendOTP({ email, phoneNumber: '' }).subscribe({
      next: async () => {
        this.loading = false;
        // Navigate to OTP verification page
        await this.router.navigate(['/auth/forgot-password/verify-otp/email-verify'], {
          state: { talentId: this.talentId, email: email },
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.code === 'EMAIL_MISMATCH') {
          this.error =
            'Please use the email registered with this account';
        }
      },
    });
  }

 async goBack() {
   await this.router.navigate(['/auth/forgot-password/verify-otp'], {
      state: history.state,
    });
  }
}
