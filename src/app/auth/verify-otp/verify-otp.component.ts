import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ScouterEndpointsService } from '../../services/scouter-endpoints.service';
import { ToastsService } from '../../services/toasts.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  otpForm!: FormGroup | any;
  otpControls: FormControl[] = [];
  otpLength = 4;
  countdown = 0;
  timer: any;
  isProcessing = false;
  errorMessage = '';
  email: string | null = null;
  userData: any = null;
  requiresVerification = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private scouterService: ScouterEndpointsService,
    private toast: ToastsService,
  ) {}

  ngOnInit() {
    this.initializeOtpForm();

    // First try to get email from query params
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.email = emailFromQuery;
      localStorage.setItem('registration_email', emailFromQuery);
      console.log('📧 Email from query params:', emailFromQuery);
    }

    this.loadUserData();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private initializeOtpForm() {
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    );

    this.otpForm = this.fb.group({
      otp: this.fb.array(this.otpControls),
    });
  }

  // Add this method to verify email exists before proceeding
  private ensureEmailExists(): boolean {
    const email = this.getEmailForVerification();
    if (!email) {
      this.toast.openSnackBar('Session expired. Please login again.', 'error');
      this.router.navigate(['/auth/login']);
      return false;
    }
    return true;
  }

  private loadUserData() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;

    if (state) {
      this.email = state.email || this.email;
      this.userData = state.userData;
      this.requiresVerification = state.requiresVerification || false;

      // Store email if present
      if (this.email) {
        localStorage.setItem('registration_email', this.email);
      }
    } else {
      const pendingVerification = localStorage.getItem('pending_verification');
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
          this.email = data.email || this.email;
          this.userData = data.userData || data.tempUserData;
          this.requiresVerification = true;

          // Store email if present
          if (this.email) {
            localStorage.setItem('registration_email', this.email);
          }
        } catch (error) {
          console.error('Error parsing pending verification data:', error);
        }
      }
    }

    // If still no email, try to get from localStorage
    if (!this.email) {
      this.email = localStorage.getItem('registration_email');
    }

    console.log('🔍 OTP Verification Data:', {
      email: this.email,
      requiresVerification: this.requiresVerification,
      userData: this.userData,
    });

    if (!this.email) {
      this.toast.openSnackBar(
        'No verification session found. Please login again.',
        'error',
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.requiresVerification) {
      this.sendOtpAutomatically();
    }
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    if (value && index < this.otpControls.length - 1) {
      const inputs = input.parentElement?.querySelectorAll('input');
      if (inputs && inputs[index + 1]) {
        const nextInput = inputs[index + 1] as HTMLInputElement;
        nextInput.focus();
      }
    }

    if (value && index === this.otpControls.length - 1) {
      if (this.getOtpValue().length === this.otpLength) {
        this.verifyOtpAndProceed();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace') {
      const input = event.target as HTMLInputElement;
      if (!input.value && index > 0) {
        const inputs = input.parentElement?.querySelectorAll('input');
        if (inputs && inputs[index - 1]) {
          const prevInput = inputs[index - 1] as HTMLInputElement;
          prevInput.focus();
          prevInput.select();
        }
      } else if (input.value) {
        input.value = '';
        this.otpControls[index].setValue('');
      }
    }
  }

  getOtpValue(): string {
    return this.otpControls
      .map((control) => control?.value || '')
      .join('')
      .replace(/\s/g, '');
  }

  clearOtpFields() {
    this.otpControls.forEach((control) => {
      control.setValue('');
      control.markAsUntouched();
    });
  }

  sendOtpAutomatically() {
    if (!this.ensureEmailExists()) return;

    // Try multiple sources for email
    this.email = this.getEmailForVerification();

    if (!this.email) {
      this.setError('Email is required to send OTP');
      return;
    }

    // Store it for later use
    localStorage.setItem('registration_email', this.email);

    console.log('🔍 Sending OTP to:', this.email);
    const payload = { email: this.email };

    this.scouterService.resendOtp(payload).subscribe({
      next: (res: any) => {
        console.log('✅ OTP sent successfully', res);
        this.startCountdown();
        this.clearOtpFields();
        this.toast.openSnackBar('OTP sent successfully!', 'success');
      },
      error: (err: any) => {
        console.error('❌ Failed to send OTP', err);
        this.setError(
          err?.error?.message || 'Failed to send OTP. Please try again.',
        );
      },
    });
  }

  verifyOtpAndProceed() {
    if (!this.ensureEmailExists()) return;

    const otpValue = this.getOtpValue();
    if (!otpValue || otpValue.length !== this.otpLength) {
      this.setError('Please enter complete 4-digit OTP.');
      return;
    }

    // CRITICAL FIX: Ensure we have a valid email
    const emailValue = this.getEmailForVerification();

    if (!emailValue) {
      this.setError('Email is required for verification. Please login again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.isProcessing = true;
    const payload = { otp: otpValue, email: emailValue };
    console.log('🔍 OTP Verification Payload:', payload);

    this.scouterService.verifyOtp(payload).subscribe({
      next: (res: any) => {
        console.log('✅ OTP verified successfully', res);
        this.isProcessing = false;
        this.updateUserVerificationStatus();
        this.toast.openSnackBar('Account verified successfully!', 'success');
        this.handleSuccessfulVerification();
      },
      error: (err: any) => {
        console.error('❌ OTP verification failed', err);
        this.isProcessing = false;
        if (err.status === 422) {
          this.setError(
            'The OTP you entered is invalid or has expired. Please try again or request a new OTP.',
          );
        } else {
          this.setError(
            err?.error?.message || 'Invalid OTP. Please try again.',
          );
        }
        this.clearOtpFields();
      },
    });
  }

  // Add this helper method to get email from multiple sources
  private getEmailForVerification(): string | null {
    // Try from component property first
    if (this.email) {
      return this.email;
    }

    // Try from localStorage
    const storedEmail = localStorage.getItem('registration_email');
    if (storedEmail) {
      return storedEmail;
    }

    // Try from user_data
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        return (
          parsed.email || parsed.details?.user?.email || parsed.user?.email
        );
      }
    } catch (e) {
      console.error('Error parsing user_data for email:', e);
    }

    return null;
  }

  private updateUserVerificationStatus() {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);

        user.isVerified = true;
        user.verified = true;
        user.emailVerified = true;
        user.otpVerified = true;

        if (user.details?.user) {
          user.details.user.isVerified = true;
          user.details.user.verified = true;
          user.details.user.emailVerified = true;
          user.details.user.otpVerified = true;
        }

        if (user.user) {
          user.user.isVerified = true;
          user.user.verified = true;
          user.user.emailVerified = true;
          user.user.otpVerified = true;
        }

        localStorage.setItem('user_data', JSON.stringify(user));
        console.log('✅ User verification status updated');
      } catch (error) {
        console.error('Error updating user verification status:', error);
      }
    }

    localStorage.removeItem('pending_verification');
  }

  private handleSuccessfulVerification() {
    const userData = localStorage.getItem('user_data');
    let role = '';

    if (userData) {
      try {
        const user = JSON.parse(userData);
        role = user.role || user.details?.user?.role || user.user?.role;
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    const routes: Record<string, string> = {
      scouter: '/scouter/dashboard',
      talent: '/talent/dashboard',
    };

    const route = routes[role] || '/auth/login';
    console.log('🧭 Navigating to:', route);

    setTimeout(async () => {
      await this.router.navigateByUrl(route, { replaceUrl: true });
    }, 1500);
  }

  resendOtp() {
    if (this.countdown > 0) return;

    // Ensure we have email before resending
    this.email = this.getEmailForVerification();

    if (!this.email) {
      this.setError('No email found. Please login again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.sendOtpAutomatically();
  }

  private startCountdown() {
    clearInterval(this.timer);
    this.countdown = 120;
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  maskEmail(email: string | null): string {
    email = email ?? localStorage.getItem('registration_email');
    if (!email) return '';
    const [user, domain] = email?.split('@');
    if (!user || !domain) return '***@***';

    if (user.length <= 2) return `***@${domain}`;
    const maskedUser =
      user.slice(0, 2) + '*'.repeat(Math.min(3, user.length - 2));
    return `${maskedUser}@${domain}`;
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.toast.openSnackBar(message, 'error');
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  async goBack(): Promise<void> {
    await this.router.navigate(['/auth/login']);
  }

  async goToLogin(): Promise<void> {
    await this.router.navigate(['/auth/login']);
  }

  // Prevents accidental reload or refresh during OTP verification
  @HostListener('window:keydown', ['$event'])
  disableReloadKeys(event: KeyboardEvent) {
    if (
      event.key === 'F5' ||
      ((event.ctrlKey || event.metaKey) && event.key === 'r')
    ) {
      event.preventDefault();
      alert('Page reload is disabled during verification.');
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  async preventBrowserRefresh(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = ''; // Required for Chrome
    await this.router.navigateByUrl('/auth/login').then(() => {
      this.authService.clearAllStorage();
    });
  }
}
