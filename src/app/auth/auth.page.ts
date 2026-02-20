import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ToastsService } from '../services/toasts.service';
import { EndpointService } from '../services/endpoint.service';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {
  loginForm!: FormGroup;
  showEye = false;
  loginText = 'Login';
  isLoading = false;
  passwordFieldType: string = 'password';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastsService,
    private endpointService: EndpointService,
  ) {}

  ngOnInit() {
    this.initializeLoginForm();
    this.checkQueryParams();
    this.checkExistingAuth();
  }

  private checkExistingAuth() {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.navigateByRole(user.role || user.details?.user?.role);
      } catch (error) {
        console.error('❌ Error parsing stored user data:', error);
        this.clearStaleAuthData();
      }
    }
  }

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
        setTimeout(async () => {
          await this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true,
          });
        }, 3000);
      }
    });
  }

  fetchProfilePicture(role: string, userData: any): void {
    const uniqueId =
      role === 'scouter' ? userData.scouterId : userData.talentId;

    const fetch$ =
      role === 'scouter'
        ? this.endpointService.getScouterPicture(uniqueId)
        : this.endpointService.getTalentPicture(uniqueId);

    fetch$.subscribe({
      next: (response) => {
        if (response?.data?.base64Picture) {
          localStorage.setItem('profilePicture', response.data.base64Picture);
        }
      },
      error: (err) => {
        console.error('Error fetching profile picture:', err);
      },
    });
  }

  submitForm(): void {
    this.authService.clearAllStorage();
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.openSnackBar(
        'Please fill all required fields correctly',
        'error',
      );
      return;
    }

    this.isLoading = true;
    this.loginText = 'Signing in...';
    this.loginForm.disable();

    const loginData = this.loginForm.value;

    this.authService.loginUser(loginData).subscribe({
      next: (res) => {
        if (res?.access_token) {
          this.authService.setUserCredentialFromBackend(res);
          // ⭐️ SAVE talentId for dashboard
          const talentId = res?.details?.user?.talentId;
          if (talentId) {
            localStorage.setItem('talentId', talentId);
            sessionStorage.setItem('talentId', talentId);
            console.log(' Talent ID saved:', talentId);
          } else {
            console.warn(' No talentId found inside login response');
          }
          const onboardingRaw = res?.details?.user?.completeOnboarding;
          if (onboardingRaw) {
            try {
              const onboardingObj = JSON.parse(onboardingRaw);
              sessionStorage.setItem(
                'completeOnboarding',
                JSON.stringify(onboardingObj),
              );
              console.log(' Saved onboarding from login:', onboardingObj);
            } catch (e) {
              console.error("Failed parsing onboarding at login:", e, onboardingRaw);
              console.error(
                'Failed parsing onboarding at login:',
                e,
                onboardingRaw,
              );
            }
          } else {
            console.warn(' No completeOnboarding found inside login response');
          }

          const email = this.loginForm.get('email')?.value;
          if (email) localStorage.setItem('registration_email', email);

          const role = this.extractUserRole(res);
          this.fetchProfilePicture(role, res?.details?.user);

          if (!this.checkAccountVerificationStatus(res)) {
            this.navigateToOtpVerification(res, email);
            return;
          }

          this.toast.openSnackBar(`${res?.message}`, 'success');
          setTimeout(() => this.navigateByRole(role), 500);
        } else {
          throw new Error('Invalid response from server - no access token');
        }
      },
      error: (err) => {
        console.error('❌ Login error:', err);
        this.handleLoginError(err);
        this.isLoading = false;
        this.loginText = 'Login';
      },
      complete: () => {
        this.isLoading = false;
        this.loginText = 'Login';
        this.loginForm.enable();
      },
    });
  }

  private checkAccountVerificationStatus(loginResponse: any): boolean {
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
    return verificationSources.includes(true);
  }

  private navigateToOtpVerification(loginResponse: any, email: string): void {
    const otpData = {
      email,
      userId:
        loginResponse.details?.user?.id ||
        loginResponse.user?.id ||
        loginResponse.id,
      role: this.extractUserRole(loginResponse),
      tempUserData: loginResponse,
    };

    localStorage.setItem('pending_verification', JSON.stringify(otpData));
    this.router.navigate(['/auth/verify-otp'], {
      state: {
        email,
        userData: loginResponse,
        requiresVerification: true,
      },
    });
  }

  private extractUserRole(loginResponse: any): string {
    const roleSources = [
      loginResponse.details?.user?.role,
      loginResponse.user?.role,
      loginResponse.role,
      loginResponse.data?.user?.role,
      loginResponse.data?.role,
    ];
    return roleSources.find((r) => r && typeof r === 'string') || '';
  }

  private handleLoginError(err: any): void {
    let errorMessage = 'Login failed. Please try again.';
    let actionMessage = '';
    let showRetry = false;

    if (err?.status === 500) {
      errorMessage = 'Our servers are experiencing issues.';
      actionMessage = 'Please try again in a few moments.';
      showRetry = true;
      this.logBackendDiagnosis(err);
    } else if (err?.status === 0) {
      errorMessage = 'Cannot connect to our servers.';
      actionMessage = 'Please check your internet connection.';
      showRetry = true;
    } else if (err?.status === 401) {
      // Check for the specific payment verification message
      if (
        err?.error?.message ===
        'Account currently undergoing payment verification'
      ) {
        // Use the dedicated method from ToastsService
        this.toast.showPaymentVerificationError();

        // Optional: Store the email for future reference
        const email = this.loginForm.get('email')?.value;
        if (email) {
          localStorage.setItem('pending_payment_email', email);
        }
        // Reset form loading state and return early
        this.isLoading = false;
        this.loginText = 'Login';
        this.loginForm.enable();
        return;
      } else {
        errorMessage = 'Invalid email or password.';
        actionMessage = 'Please check your credentials and try again.';
      }
    } else if (err?.error?.message) {
      errorMessage = err.error.message;
    }

    // Show regular error toast for other cases
    this.toast.openSnackBar(errorMessage, 'error');
    if (actionMessage) {
      setTimeout(() => {
        this.toast.openSnackBar(actionMessage, 'info');
      }, 1000);
    }
    if (showRetry) this.loginText = 'Retry Login';
  }

  private logBackendDiagnosis(err: any): void {
    console.group(' Backend 500 Error Diagnosis');
    console.log(' Time:', new Date().toISOString());
    console.log(' Endpoint:', err.url);
    console.log(' HTTP Status:', err.status, err.statusText);
    console.log(' Response Body:', err.error);
    console.groupEnd();
  }

  private async navigateByRole(role: string) {
    const routes: Record<string, string> = {
      scouter: '/scouter/dashboard',
      talent: '/talent/dashboard',
      admin: '/admin/dashboard',
    };
    const route = routes[role] || '/auth/login';
    await this.router.navigateByUrl(route, { replaceUrl: true });
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

 async forgotPassword(): Promise<void> {
   await this.router.navigate(['/auth/forgot-password']);
  }
}
