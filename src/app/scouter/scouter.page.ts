import { Component, OnInit, OnDestroy } from '@angular/core';
import { addIcons } from 'ionicons';
import { personCircle, star, business } from 'ionicons/icons';
import { Location } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { debounceTime, map, switchMap } from 'rxjs/operators';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { UserService } from 'src/app/services/user.service';
import { ToastsService } from '../services/toasts.service';

@Component({
  selector: 'app-scouter',
  templateUrl: './scouter.page.html',
  styleUrls: ['./scouter.page.scss'],
  standalone: false,
})
export class ScouterPage implements OnInit, OnDestroy {
  currentStep = 0;
  activeTab: string = 'scouter';

  steps = [
    'Scouter Details',
    'Scouter Information',
    'Login Credentials',
    'Verify Scouter',
  ];

  isProcessing = false;
  tempUserData: any = null;
  tempUserId: string | null = null;
  lastOtpChannel: 'email' | 'phone' | null = null;
  accountExistsError: string | null = null;
  errorMessage: string = '';
  showSuccessModal = false;

  forms: FormGroup[] = [];
  otpControls: FormControl[] = [];
  otpLength = 4;
  countdown = 0;
  timer: any;

  // --- Organization input handling - UPDATED TO MATCH PROFILE PAGE ---
  orgTypeInput: string = '';
  selectedOrgTypes: string[] = []; // Changed from single string to array

  // Add organization type from input
  addOrgTypeFromInput(event: any) {
    event.preventDefault();
    event.stopPropagation();

    const newType = this.orgTypeInput.trim();
    if (newType && !this.selectedOrgTypes.includes(newType)) {
      this.selectedOrgTypes.push(newType);
      this.updateOrganisationFormControl();
    }

    this.orgTypeInput = ''; // clear after enter
  }

  // Remove organization type
  removeOrgType(index: number) {
    this.selectedOrgTypes.splice(index, 1);
    this.updateOrganisationFormControl();
  }

  // Focus the organization input when container is clicked
  focusOrgInput() {
    const input = document.getElementById('organisation') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }

  // Handle enter key (you can remove the old handleEnterKey method)
  handleEnterKey(event: any) {
    this.addOrgTypeFromInput(event);
  }

  constructor(
    private location: Location,
    private fb: FormBuilder,
    private router: Router,
    private scouterService: ScouterEndpointsService,
    private userService: UserService,
    private toast: ToastsService
  ) {
    addIcons({ personCircle, star, business });
  }

  ngOnInit() {
    this.initializeForms();
    this.initializeOtpControls();
    this.setupEmailValidation();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private initializeForms() {
    // Step 1: Personal Details
    this.forms[0] = this.fb.group({
      fullname: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      email: ['', [Validators.required, this.strictEmailValidator()]],
    });

    // Step 2: Scouter Information - UPDATED for array of organization types
    this.forms[1] = this.fb.group({
      location: ['', Validators.required],
      organisation: [[], Validators.required], // Now expects an array
      purpose: ['', Validators.required],
      payRange: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
    });

    // Step 3: Credentials
    this.forms[2] = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/
            ),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );

    // Step 4: OTP Verification
    this.forms[3] = this.fb.group({
      otp: this.fb.array([]),
    });
  }

  // Update the organization type handling in onboarding
  private updateOrganisationFormControl() {
    const orgTypes = this.selectedOrgTypes.filter(
      (org) => org && org.trim() !== ''
    );
    this.forms[1].get('organisation')?.setValue(orgTypes);
  }

  // Update the account creation payload
  submitScouterAccount() {
    if (this.forms[2].invalid) {
      this.forms[2].markAllAsTouched();
      return;
    }

    this.isProcessing = true;

    // ✅ Ensure organizationType is always an array
    const organizationType = Array.isArray(this.selectedOrgTypes)
      ? this.selectedOrgTypes.filter((org) => org && org.trim() !== '')
      : [];

    const payload = {
      fullName: this.forms[0].get('fullname')?.value,
      phoneNumber: this.forms[0].get('phone')?.value,
      email: this.forms[0].get('email')?.value,
      location: this.forms[1].get('location')?.value,
      scoutingPurpose: this.forms[1].get('purpose')?.value,
      organizationType: organizationType, // ✅ Always array
      payRange: String(this.forms[1].get('payRange')?.value),
      password: this.forms[2].get('password')?.value,
    };

    console.log(
      '📤 Creating account with organization types:',
      payload.organizationType
    );

    this.scouterService.createScouterProfile(payload).subscribe({
      next: (res) => {
        console.log('✅ Account created:', res);
        this.isProcessing = false;
        this.tempUserData = { ...res, password: '****' };
        this.currentStep = 3;
        this.sendOtpAutomatically();
      },
      error: (err) => {
        console.error('❌ Error creating account:', err);
        this.isProcessing = false;
        this.setError(err?.error?.message || 'Failed to create account.');
      },
    });
  }

  // Rest of your existing methods remain the same...
  private initializeOtpControls() {
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)])
    );

    const otpArray = this.fb.array(this.otpControls);
    this.forms[3].setControl('otp', otpArray);
  }

  private setupEmailValidation() {
    this.forms[0]
      .get('email')
      ?.valueChanges.pipe(
        debounceTime(800),
        switchMap((email: string) => {
          if (email && this.forms[0].get('email')?.valid) {
            return this.userService.checkEmailExists(email);
          }
          return of({ exists: false });
        })
      )
      .subscribe({
        next: (res: any) => {
          this.accountExistsError = res.exists
            ? 'Account already exists. Please log in instead.'
            : null;
          this.toast.openSnackBar(
            'Account already exists. Please log in instead',
            'error'
          );
        },
        error: (err) => {
          console.error('Email check error', err);
          this.accountExistsError = null;
        },
      });
  }

  // Navigation Methods
  goNext() {
    if (!this.isCurrentFormValid()) {
      this.forms[this.currentStep].markAllAsTouched();
      return;
    }

    // Special handling for step 2 (before OTP)
    if (this.currentStep === 2) {
      this.submitScouterAccount();
    } else {
      this.currentStep++;

      // If moving to OTP step and we have temp user, send OTP
      if (this.currentStep === 3 && this.tempUserId) {
        this.sendOtpAutomatically();
      }
    }
  }

  goPrevious() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Form Validation
  isCurrentFormValid(): boolean {
    return this.forms[this.currentStep]?.valid || false;
  }

  strictEmailValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;

      const valid =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|co|io)$/i.test(
          value
        );
      return valid ? null : { pattern: true };
    };
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  // OTP Methods - UPDATED WITH DEBUG INFO
  sendOtpAutomatically() {
    const email = this.forms[0].get('email')?.value;
    const phone = this.forms[0].get('phone')?.value;

    console.log('🔍 Sending OTP to:', { email, phone }); // DEBUG

    if (!email && !phone) {
      this.setError('Email or phone number is required to send OTP');
      return;
    }

    const payload: any = email ? { email } : { phoneNumber: phone };
    this.lastOtpChannel = email ? 'email' : 'phone';

    console.log('🔍 OTP Payload:', payload); // DEBUG

    this.scouterService.resendOtp(payload).subscribe({
      next: (res) => {
        console.log('✅ OTP sent successfully', res);
        this.startCountdown();
        this.clearOtpFields();
      },
      error: (err) => {
        console.error('❌ Failed to send OTP', err);
        this.setError(
          err?.error?.message || 'Failed to send OTP. Please try again.'
        );
      },
    });
  }

  verifyOtpAndProceed() {
    const otpValue = this.getOtpValue();

    console.log('🔍 Verifying OTP:', otpValue); // DEBUG

    if (!otpValue || otpValue.length !== this.otpLength) {
      this.setError('Please enter complete 4-digit OTP.');
      return;
    }

    const payload: any = {
      otp: otpValue,
    };

    // Add identifier based on what was used to send OTP
    if (this.lastOtpChannel === 'phone') {
      payload.phoneNumber = this.forms[0].get('phone')?.value;
    } else {
      payload.email = this.forms[0].get('email')?.value;
    }

    console.log('🔍 OTP Verification Payload:', payload); // DEBUG

    this.scouterService.verifyOtp(payload).subscribe({
      next: (res) => {
        console.log('✅ OTP verified successfully', res);

        // ✅ STORE EMAIL IN LOCALSTORAGE HERE
        const email = this.forms[0].get('email')?.value;
        if (email) {
          localStorage.setItem('registration_email', email);
          console.log('✅ Email stored in localStorage:', email);
        }

        // In your scouter registration component, after successful registration:
        this.showSuccessModal = true;

        // Clear temporary data
        this.tempUserId = null;
        this.tempUserData = null;
      },
      error: (err) => {
        console.error('❌ OTP verification failed', err);
        console.error('🔍 Full error details:', {
          status: err.status,
          message: err.message,
          error: err.error,
          url: err.url,
        });

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

  resendOtp() {
    if (this.countdown > 0) return;

    this.sendOtpAutomatically();
  }

  // OTP Input Handling
  onOtpInput(event: any, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Auto-advance to next input
    if (value && index < this.otpControls.length - 1) {
      const nextInput = input.parentElement?.querySelectorAll('input')[
        index + 1
      ] as HTMLInputElement;
      if (nextInput) nextInput.focus();
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
        const prevInput = input.parentElement?.querySelectorAll('input')[
          index - 1
        ] as HTMLInputElement;
        if (prevInput) {
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
    return this.otpControls.map((control) => control.value || '').join('');
  }

  clearOtpFields() {
    this.otpControls.forEach((control) => {
      control.setValue('');
      control.markAsUntouched();
    });
  }

  // UI Helpers
  startCountdown(duration: number = 120) {
    clearInterval(this.timer);
    this.countdown = duration;

    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  getProgressWidth(): string {
    return `${((this.currentStep + 1) / this.steps.length) * 100}%`;
  }

  getEmailForOtp(): string {
    return this.forms[0]?.get('email')?.value || '';
  }

  maskEmail(email: string): string {
    if (!email) return '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `***@${domain}`;

    const maskedUser =
      user.slice(0, 2) + '*'.repeat(Math.min(3, user.length - 2));
    return `${maskedUser}@${domain}`;
  }

  // Organisation Dropdown
  // toggleOrganisationDropdown() {
  //   this.isOrganisationDropdownOpen = !this.isOrganisationDropdownOpen;
  // }

  // selectOrganisation(organisation: string) {
  //   this.forms[1].get('organisation')?.setValue(organisation);
  //   this.isOrganisationDropdownOpen = false;
  // }

  // Error Handling
  setError(message: string) {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  // Navigation
  closeSuccessModal() {
    this.showSuccessModal = false;
    this.router.navigate(['/auth/login'], {
      queryParams: {
        email: this.forms[0].get('email')?.value,
        message: 'Account verified successfully. Please login.',
      },
    });
  }

  goBack() {
    if (this.currentStep === 0) {
      this.router.navigate(['/auth/login']);
    } else {
      this.goPrevious();
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToDashboard() {
    this.router.navigate(['/scouter/dashboard']);
  }
}
