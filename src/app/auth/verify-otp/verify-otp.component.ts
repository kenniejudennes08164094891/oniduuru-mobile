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

// Test

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss'],
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  otpForm!: FormGroup;
  otpControls: FormControl[] = [];
  otpLength = 4;
  countdown = 0;
  timer: any;
  isProcessing = false;
  errorMessage = '';
  email = '';
  userData: any = null;
  requiresVerification = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private authService: AuthService,
    private scouterService: ScouterEndpointsService,
    private toast: ToastsService
  ) {}

  ngOnInit() {
    this.initializeOtpForm();
    this.loadUserData();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private initializeOtpForm() {
    // Initialize OTP controls
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)])
    );

    this.otpForm = this.fb.group({
      otp: this.fb.array(this.otpControls),
    });
  }

  private loadUserData() {
    // Get data from navigation state or localStorage
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;

    if (state) {
      this.email = state.email;
      this.userData = state.userData;
      this.requiresVerification = state.requiresVerification || false;
    } else {
      // Try to get from localStorage
      const pendingVerification = localStorage.getItem('pending_verification');
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
          this.email = data.email;
          this.userData = data.userData || data.tempUserData;
          this.requiresVerification = true;
        } catch (error) {
          console.error('Error parsing pending verification data:', error);
        }
      }
    }

    console.log('🔍 OTP Verification Data:', {
      email: this.email,
      requiresVerification: this.requiresVerification,
      userData: this.userData,
    });

    // If no email found, redirect to login
    if (!this.email) {
      this.toast.openSnackBar(
        'No verification session found. Please login again.',
        'error'
      );
      this.router.navigate(['/auth/login']);
      return;
    }

    // Auto-send OTP if required
    if (this.requiresVerification) {
      this.sendOtpAutomatically();
    }
  }

  // OTP Input Handling
  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Auto-advance to next input
    if (value && index < this.otpControls.length - 1) {
      const inputs = input.parentElement?.querySelectorAll('input');
      if (inputs && inputs[index + 1]) {
        const nextInput = inputs[index + 1] as HTMLInputElement;
        nextInput.focus();
      }
    }

    // Auto-submit when last digit is entered
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
        // Move to previous input if current is empty
        const inputs = input.parentElement?.querySelectorAll('input');
        if (inputs && inputs[index - 1]) {
          const prevInput = inputs[index - 1] as HTMLInputElement;
          prevInput.focus();
          prevInput.select();
        }
      } else if (input.value) {
        // Clear current input
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

  // OTP Methods
  sendOtpAutomatically() {
    if (!this.email) {
      this.setError('Email is required to send OTP');
      return;
    }

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
          err?.error?.message || 'Failed to send OTP. Please try again.'
        );
      },
    });
  }

  verifyOtpAndProceed() {
    const otpValue = this.getOtpValue();

    console.log('🔍 Verifying OTP:', otpValue);

    if (!otpValue || otpValue.length !== this.otpLength) {
      this.setError('Please enter complete 4-digit OTP.');
      return;
    }

    this.isProcessing = true;

    const payload = {
      otp: otpValue,
      email: this.email,
    };

    console.log('🔍 OTP Verification Payload:', payload);

    this.scouterService.verifyOtp(payload).subscribe({
      next: (res: any) => {
        console.log('✅ OTP verified successfully', res);
        this.isProcessing = false;

        // Update user verification status
        this.updateUserVerificationStatus();

        this.toast.openSnackBar('Account verified successfully!', 'success');

        // Navigate to appropriate page
        this.handleSuccessfulVerification();
      },
      error: (err: any) => {
        console.error('❌ OTP verification failed', err);
        this.isProcessing = false;

        // More specific error messages
        if (err.status === 422) {
          this.setError(
            'The OTP you entered is invalid or has expired. Please try again or request a new OTP.'
          );
        } else {
          this.setError(
            err?.error?.message || 'Invalid OTP. Please try again.'
          );
        }
        this.clearOtpFields();
      },
    });
  }

  private updateUserVerificationStatus() {
    // Update localStorage user data to mark as verified
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);

        // Update verification status in multiple possible locations
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

    // Clear pending verification
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

    // Navigate based on role
    const routes: { [key: string]: string } = {
      scouter: '/scouter/dashboard',
      talent: '/talent/dashboard',
      admin: '/admin/dashboard',
    };

    const route = routes[role] || '/auth/login';
    console.log('🧭 Navigating to:', route);

    // Small delay for better UX
    setTimeout(() => {
      this.router.navigateByUrl(route, { replaceUrl: true });
    }, 1500);
  }

  resendOtp() {
    if (this.countdown > 0) return;
    this.sendOtpAutomatically();
  }

  // UI Helpers
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

  maskEmail(email: string): string {
    if (!email) return '';
    const [user, domain] = email.split('@');
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

  // Navigation
  goBack() {
    this.router.navigate(['/auth/login']);
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }


  @HostListener('window:keydown', ['$event'])
  disableReloadKeys(event: KeyboardEvent) {
    if (
      (event.key === 'F5') ||
      ((event.ctrlKey || event.metaKey) && event.key === 'r')
    ) {
      event.preventDefault();
      alert('Page reload is disabled.');
    }
  }


  @HostListener('window:beforeunload', ['$event'])
  preventBrowserRefresh(event: BeforeUnloadEvent) {
    event.preventDefault();
    event.returnValue = ''; // Required for Chrome
  }
}
