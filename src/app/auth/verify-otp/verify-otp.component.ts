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
import { Subject, takeUntil, finalize } from 'rxjs';

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
  email: string | null = null;
  userData: any = null;
  requiresVerification = false;
  
  private destroy$ = new Subject<void>();
  private readonly STORAGE_KEYS = {
    EMAIL: 'registration_email',
    PENDING_VERIFICATION: 'pending_verification',
    USER_DATA: 'user_data'
  } as const;

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
    this.loadEmailFromSources();
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearTimer();
  }

  private initializeOtpForm() {
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [
        Validators.required, 
        Validators.pattern(/^[0-9]$/),
        Validators.maxLength(1)
      ]),
    );

    this.otpForm = this.fb.group({
      otpArray: this.fb.array(this.otpControls)
    });
  }

  private loadEmailFromSources(): void {
    // Try query params first
    const emailFromQuery = this.route.snapshot.queryParamMap.get('email');
    if (emailFromQuery) {
      this.email = emailFromQuery;
      this.saveEmailToStorage(emailFromQuery);
      return;
    }

    // Try navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;
    if (state?.email) {
      this.email = state.email;
      this.saveEmailToStorage(state.email);
      return;
    }

    // Try localStorage
    const storedEmail = localStorage.getItem(this.STORAGE_KEYS.EMAIL);
    if (storedEmail) {
      this.email = storedEmail;
      return;
    }

    // If no email found, redirect to login
    this.handleMissingEmail();
  }

  private loadUserData() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as any;

    if (state) {
      this.userData = state.userData;
      this.requiresVerification = state.requiresVerification || false;
    } else {
      const pendingVerification = localStorage.getItem(this.STORAGE_KEYS.PENDING_VERIFICATION);
      if (pendingVerification) {
        try {
          const data = JSON.parse(pendingVerification);
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
      hasUserData: !!this.userData,
    });

    if (this.requiresVerification && this.email) {
      this.sendOtpAutomatically();
    }
  }

  private saveEmailToStorage(email: string): void {
    localStorage.setItem(this.STORAGE_KEYS.EMAIL, email);
  }

  private handleMissingEmail(): void {
    console.error('No email found for verification');
    this.toast.openSnackBar(
      'Session expired. Please login again.',
      'error'
    );
    this.navigateToLogin();
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow numbers
    if (value && !/^\d+$/.test(value)) {
      input.value = '';
      this.otpControls[index].setValue('');
      return;
    }

    if (value && index < this.otpControls.length - 1) {
      this.focusNextInput(input, index);
    }

    // Auto-submit when last digit is entered
    if (value && index === this.otpControls.length - 1) {
      const otpValue = this.getOtpValue();
      if (otpValue.length === this.otpLength) {
        this.verifyOtpAndProceed();
      }
    }
  }

  private focusNextInput(currentInput: HTMLInputElement, index: number): void {
    const inputs = currentInput.parentElement?.querySelectorAll('input');
    if (inputs && inputs[index + 1]) {
      const nextInput = inputs[index + 1] as HTMLInputElement;
      setTimeout(() => nextInput.focus());
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      event.preventDefault();
      
      if (!input.value && index > 0) {
        this.focusPreviousInput(input, index);
      } else if (input.value) {
        input.value = '';
        this.otpControls[index].setValue('');
      }
    }
  }

  private focusPreviousInput(currentInput: HTMLInputElement, index: number): void {
    const inputs = currentInput.parentElement?.querySelectorAll('input');
    if (inputs && inputs[index - 1]) {
      const prevInput = inputs[index - 1] as HTMLInputElement;
      setTimeout(() => {
        prevInput.focus();
        prevInput.select();
      });
    }
  }

  getOtpValue(): string {
    return this.otpControls
      .map((control) => control?.value || '')
      .join('')
      .trim();
  }

  clearOtpFields() {
    this.otpControls.forEach((control) => {
      control.setValue('');
      control.markAsUntouched();
    });
    
    // Focus first input
    setTimeout(() => {
      const firstInput = document.querySelector('input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    });
  }

  sendOtpAutomatically() {
    if (!this.email) {
      this.setError('Email is required to send OTP');
      return;
    }

    console.log('🔍 Sending OTP to:', this.email);
    
    this.isProcessing = true;
    this.clearError();

    this.scouterService.resendOtp({ email: this.email })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing = false)
      )
      .subscribe({
        next: (res: any) => {
          console.log('✅ OTP sent successfully', res);
          this.startCountdown();
          this.clearOtpFields();
          this.toast.openSnackBar('OTP sent successfully!', 'success');
        },
        error: (err: any) => {
          console.error('❌ Failed to send OTP', err);
          const errorMessage = err?.error?.message || 
                              err?.message || 
                              'Failed to send OTP. Please try again.';
          this.setError(errorMessage);
        },
      });
  }

  verifyOtpAndProceed() {
    if (!this.email) {
      this.setError('Session expired. Please login again.');
      this.navigateToLogin();
      return;
    }

    const otpValue = this.getOtpValue();
    
    if (!otpValue || otpValue.length !== this.otpLength) {
      this.setError('Please enter complete 4-digit OTP.');
      return;
    }

    this.isProcessing = true;
    this.clearError();

    const payload = { 
      otp: otpValue, 
      email: this.email 
    };
    
    console.log('🔍 OTP Verification Payload:', payload);

    this.scouterService.verifyOtp(payload)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isProcessing = false)
      )
      .subscribe({
        next: (res: any) => {
          console.log('✅ OTP verified successfully', res);
          this.updateUserVerificationStatus();
          this.toast.openSnackBar('Account verified successfully!', 'success');
          this.handleSuccessfulVerification();
        },
        error: (err: any) => {
          console.error('❌ OTP verification failed', err);
          
          if (err.status === 422) {
            this.setError(
              'The OTP you entered is invalid or has expired. Please try again or request a new OTP.'
            );
          } else {
            this.setError(
              err?.error?.message || err?.message || 'Invalid OTP. Please try again.'
            );
          }
          
          this.clearOtpFields();
        },
      });
  }

  private updateUserVerificationStatus() {
    const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
    if (!userData) return;

    try {
      const user = JSON.parse(userData);

      // Update verification flags at all levels
      const updateNestedObject = (obj: any) => {
        if (!obj) return;
        
        obj.isVerified = true;
        obj.verified = true;
        obj.emailVerified = true;
        obj.otpVerified = true;
      };

      // Update main user object
      updateNestedObject(user);

      // Update nested structures
      if (user.details?.user) updateNestedObject(user.details.user);
      if (user.user) updateNestedObject(user.user);

      localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      console.log('✅ User verification status updated');
    } catch (error) {
      console.error('Error updating user verification status:', error);
    }

    // Clean up
    localStorage.removeItem(this.STORAGE_KEYS.PENDING_VERIFICATION);
  }

  private handleSuccessfulVerification() {
    const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA);
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

    // Short delay for success message to be seen
    setTimeout(() => {
      this.navigateToUrl(route);
    }, 1500);
  }

  resendOtp() {
    if (this.countdown > 0) {
      this.toast.openSnackBar(`Please wait ${this.countdown}s before resending`, 'info');
      return;
    }

    if (!this.email) {
      this.setError('No email found. Please login again.');
      this.navigateToLogin();
      return;
    }

    this.sendOtpAutomatically();
  }

  private startCountdown() {
    this.clearTimer();
    this.countdown = 120;
    
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  maskEmail(email: string | null): string {
    if (!email) return '';
    
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const [user, domain] = parts;
    if (!user || !domain) return email;

    if (user.length <= 2) {
      return `***@${domain}`;
    }
    
    const visibleChars = 2;
    const maskedUser = user.slice(0, visibleChars) + '*'.repeat(Math.min(3, user.length - visibleChars));
    return `${maskedUser}@${domain}`;
  }

  private clearError(): void {
    this.errorMessage = '';
  }

  private setError(message: string): void {
    this.errorMessage = message;
    this.toast.openSnackBar(message, 'error');
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.clearError();
      }
    }, 5000);
  }

  private navigateToLogin(): void {
    this.navigateToUrl('/auth/login');
  }

  private async navigateToUrl(url: string): Promise<void> {
    try {
      await this.router.navigateByUrl(url, { replaceUrl: true });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }

  async goBack(): Promise<void> {
    await this.navigateToLogin();
  }

  async goToLogin(): Promise<void> {
    await this.navigateToLogin();
  }

  // Prevent accidental reload during verification
  @HostListener('window:keydown', ['$event'])
  disableReloadKeys(event: KeyboardEvent) {
    if (this.isProcessing) {
      if (
        event.key === 'F5' ||
        ((event.ctrlKey || event.metaKey) && event.key === 'r')
      ) {
        event.preventDefault();
        this.toast.openSnackBar('Please wait while we verify your OTP', 'info');
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isProcessing) {
      event.preventDefault();
      event.returnValue = 'Verification in progress. Are you sure you want to leave?';
    }
  }
}