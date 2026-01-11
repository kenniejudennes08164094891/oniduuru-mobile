import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-forgot-password-phone-otp',
  templateUrl: './forgot-password-phone-otp.component.html',
  styleUrls: ['./forgot-password-phone-otp.component.scss'],
})  


export class ForgotPasswordPhoneOtpComponent implements OnInit {
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
      phone: [
        '',
        [Validators.required, Validators.pattern(/^0[7-9][0-1]\d{8}$/)],
      ],
    });
  }

  sendOtp() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    const phoneNumber = this.form.value.phone;

    this.authService.resendOTP({ phoneNumber, email: '' }).subscribe({
      next: () => {
        this.loading = false;
        // Navigate to OTP verification page
        this.router.navigate(['/auth/forgot-password/verify-otp/phone-verify'], {
          state: { talentId: this.talentId, phoneNumber: phoneNumber },
        });
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.code === 'PHONE_MISMATCH') {
          this.error =
            'Please use the phone number registered with this account';
        }
      },
    });
  }

  goBack() {
    this.router.navigate(['/auth/forgot-password/verify-otp'], {
      state: history.state,
    });
  }
}
