import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ToastsService } from '../services/toasts.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  loginForm!: FormGroup;
  showEye: boolean = false;
  loginText: string = 'Login';
  isLoading: boolean = false;
  passwordFieldType: string = 'password';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastsService
  ) {}

  ngOnInit() {
    this.initializeLoginForm();
    this.checkQueryParams();

    // ✅ Check if user is already logged in
    this.checkExistingAuth();
  }

  // ✅ NEW: Check for existing authentication
  private checkExistingAuth() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔄 User already logged in, navigating to dashboard...');
        this.navigateByRole(user.role || user.details?.user?.role);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        this.clearStaleAuthData();
      }
    }
  }

  // ✅ NEW: Clear stale authentication data
  private clearStaleAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('eniyan');
  }

  initializeLoginForm() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required]),
    });
  }

  checkQueryParams() {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.loginForm.patchValue({ email: params['email'] });
      }

      if (params['message']) {
        this.toast.openSnackBar(params['message'], 'success');

        // ✅ Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          // Clear the query params without reloading
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }, 3000);
      }
    });
  }

  async submitForm(): Promise<void> {
    // console.log('🚀 Form submitted:', this.loginForm.value);

    console.log('🔄 Login process started...');

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.openSnackBar(
        'Please fill all required fields correctly',
        'error'
      );
      return;
    }

    this.isLoading = true;
    this.loginText = 'Signing in...';
    this.loginForm.disable();

    try {
      const loginData = this.loginForm.value;
      console.log('📤 Sending login request for:', loginData.email);

      const res = await firstValueFrom(this.authService.loginUser(loginData));
      // console.log('🛰️ Login request triggered:', loginData);

      console.log('✅ Login response received:', res);

      if (res?.access_token) {
        // ✅ Store credentials properly
        this.authService.setUserCredentialFromBackend(res);

        // ✅ Store email for profile completion
        const email = this.loginForm.get('email')?.value;
        if (email) {
          localStorage.setItem('registration_email', email);
          console.log('✅ Email stored:', email);
        }

        // ✅ Extract role with better error handling
        const role = this.extractUserRole(res);
        console.log('🎯 User role detected:', role);

        if (!role) {
          throw new Error('Unable to determine user role');
        }

        // this.toast.openSnackBar('Login successful!', 'success');
        this.toast.openSnackBar(`${res?.message}`, 'success');

        // ✅ Add small delay for better UX
        setTimeout(() => {
          this.navigateByRole(role);
        }, 500);
      } else {
        throw new Error('Invalid response from server - no access token');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      this.handleLoginError(err);
    } finally {
      this.isLoading = false;
      this.loginText = 'Login';
      this.loginForm.enable();
    }
  }

  // ✅ NEW: Extract user role with multiple fallbacks
  private extractUserRole(loginResponse: any): string {
    const roleSources = [
      loginResponse.details?.user?.role,
      loginResponse.user?.role,
      loginResponse.role,
      loginResponse.data?.user?.role,
      loginResponse.data?.role,
    ];

    const role = roleSources.find((r) => r && typeof r === 'string');

    if (!role) {
      console.warn(
        '⚠️ No role found in login response. Full response:',
        loginResponse
      );
    }

    return role || '';
  }

  // ✅ NEW: Improved error handling
  private handleLoginError(err: any): void {
    let errorMessage = 'Login failed. Please try again.';

    if (err?.name === 'TimeoutError') {
      errorMessage = 'Request timeout. Please check your connection.';
    } else if (err?.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (err?.status === 401) {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (err?.status === 403) {
      errorMessage = 'Account not verified. Please check your email.';
    } else if (err?.status === 404) {
      errorMessage = 'Account not found. Please check your credentials.';
    } else if (err?.status === 422) {
      errorMessage = 'Invalid input data. Please check your form.';
    } else if (err?.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (err?.error?.message) {
      errorMessage = err.error.message;
    } else if (err?.message) {
      errorMessage = err.message;
    }

    this.toast.openSnackBar(errorMessage, 'error');

    // ✅ Clear form on certain errors
    if (err?.status === 401 || err?.status === 404) {
      this.loginForm.get('password')?.setValue('');
      this.loginForm.get('password')?.markAsUntouched();
    }
  }

  private navigateByRole(role: string) {
    const routes: { [key: string]: string } = {
      scouter: '/scouter/dashboard',
      talent: '/talent/dashboard',
      admin: '/admin/dashboard',
    };

    const route = routes[role] || '/auth/login';
    console.log('🧭 Navigating to:', route);

    this.router.navigateByUrl(route, { replaceUrl: true });
  }

  togglePasswordVisibility() {
    this.showEye = !this.showEye;
    this.passwordFieldType = this.showEye ? 'text' : 'password';
  }

  async signupSelect(): Promise<void> {
    await this.router.navigate(['/auth/signup-select'], {
      relativeTo: this.route,
    });
  }

  async routeToLoginScreen(): Promise<void> {
    await this.router.navigate(['/auth/login'], {
      relativeTo: this.route,
    });
  }

  // ✅ NEW: Forgot password handler
  async forgotPassword(): Promise<void> {
    this.toast.openSnackBar('Password reset feature coming soon!', 'info');
  }
}
