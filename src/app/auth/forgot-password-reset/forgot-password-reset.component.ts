import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-forgot-password-reset',
  templateUrl: './forgot-password-reset.component.html',
  styleUrls: ['./forgot-password-reset.component.scss'],
})
export class ForgotPasswordResetComponent implements OnInit {
  form!: FormGroup;
  talentId!: string;
  showGuide = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastsService
  ) {}

  ngOnInit(): void {
    const navState = history.state;
    this.talentId = navState?.talentId;
    if (!this.talentId) {
      this.router.navigate(['/auth/forgot-password']);
      return;
    }

    this.form = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern('(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\\W).+')
        ],
      ],
      confirmPassword: ['', Validators.required],
    }, { validators: this.passwordsMatchValidator });
  }

  private passwordsMatchValidator(group: FormGroup) {
    const pw = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    return pw === cpw ? null : { passwordsMismatch: true };
  }

  toggleGuide() {
    this.showGuide = !this.showGuide;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  async submit() {
    if (this.form.invalid) return;

    const password = this.form.value.password;
    // TODO: call API to reset password with talentId and password
    this.toastr.openSnackBar('Password updated successfully', 'success', 'success');
   await this.router.navigate(['/auth/forgot-password/reset-success']);
  }

  async goBack() {
   await this.router.navigate(['/auth/forgot-password/verify-otp'], { state: { talentId: this.talentId } });
  }
}
