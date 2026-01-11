import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  passwordFieldType: 'password' | 'text' = 'password';
  showEye = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  togglePasswordVisibility(): void {
    this.showEye = !this.showEye;
    this.passwordFieldType = this.showEye ? 'text' : 'password';
  }

  submitForm(): void {
    if (this.loginForm.invalid || this.isLoading) return;

    this.isLoading = true;

    this.authService.loginUser(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  forgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
