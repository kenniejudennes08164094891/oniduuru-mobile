import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ToastsService } from '../services/toasts.service';
import { environment } from 'src/environments/environment';
import { endpoints } from '../models/endpoint';

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

      // ✅ DEBUG: Log the exact payload being sent
      console.log('📤 Login payload:', JSON.stringify(loginData, null, 2));
      console.log(
        '🔗 API URL:',
        `${environment.baseUrl}/${endpoints.userLogin}`
      );

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

        // ✅ NEW: Check if OTP is verified and account is active
        const isVerified = this.checkAccountVerificationStatus(res);
        console.log('🔍 Account verification status:', isVerified);

        if (!isVerified) {
          console.log('⚠️ Account not verified, redirecting to OTP page');
          this.navigateToOtpVerification(res, email);
          return;
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

  // ✅ NEW: Check if account is verified and OTP is confirmed
  private checkAccountVerificationStatus(loginResponse: any): boolean {
    // Check multiple possible locations for verification status
    const verificationSources = [
      loginResponse.details?.user?.isVerified,
      loginResponse.details?.user?.verified,
      loginResponse.details?.user?.emailVerified,
      loginResponse.details?.user?.otpVerified,
      loginResponse.user?.isVerified,
      loginResponse.user?.verified,
      loginResponse.user?.emailVerified,
      loginResponse.user?.otpVerified,
      loginResponse.isVerified,
      loginResponse.verified,
      loginResponse.emailVerified,
      loginResponse.otpVerified,
      loginResponse.data?.user?.isVerified,
      loginResponse.data?.user?.verified,
    ];

    const isVerified = verificationSources.find((status) => status === true);

    console.log('🔍 Verification check sources:', verificationSources);
    console.log('✅ Account verified status:', isVerified);

    return isVerified === true;
  }

  // ✅ NEW: Navigate to OTP verification page
  private navigateToOtpVerification(loginResponse: any, email: string): void {
    // Store necessary data for OTP verification
    const otpData = {
      email: email,
      userId:
        loginResponse.details?.user?.id ||
        loginResponse.user?.id ||
        loginResponse.id,
      role: this.extractUserRole(loginResponse),
      tempUserData: loginResponse,
    };

    localStorage.setItem('pending_verification', JSON.stringify(otpData));

    // Navigate to appropriate OTP page based on role
    const role = this.extractUserRole(loginResponse);
    if (role === 'scouter') {
      this.router.navigate(['/auth/verify-otp'], {
        state: {
          email: email,
          userData: loginResponse,
          requiresVerification: true,
        },
      });
    } else if (role === 'talent') {
      this.router.navigate(['/auth/verify-otp'], {
        state: {
          email: email,
          userData: loginResponse,
          requiresVerification: true,
        },
      });
      return;
    }
    // else {
    //   // Default OTP page
    //   this.router.navigate(['/auth/verify-otp'], {
    //     state: {
    //       email: email,
    //       userData: loginResponse,
    //       requiresVerification: true,
    //     },
    //   });
    // }
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

  private handleLoginError(err: any): void {
    let errorMessage = 'Login failed. Please try again.';

    if (err?.status === 500) {
      // ✅ More specific 500 error handling
      const serverError = err?.error;

      if (serverError?.message) {
        errorMessage = `Server error: ${serverError.message}`;
      } else if (err.statusText) {
        errorMessage = `Server error: ${err.statusText}`;
      } else {
        errorMessage = 'Server is experiencing issues. Please try again later.';
      }

      console.error('🔧 Server 500 Error Details:', {
        status: err.status,
        statusText: err.statusText,
        error: err.error,
        url: err.url,
      });
    } else if (err?.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (err?.status === 401) {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (err?.error?.message) {
      errorMessage = err.error.message;
    }

    this.toast.openSnackBar(errorMessage, 'error');

    // Additional debugging for developers
    if (err?.status === 500) {
      console.warn(
        '⚠️  Server 500 Error - Check backend logs for more details'
      );
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
