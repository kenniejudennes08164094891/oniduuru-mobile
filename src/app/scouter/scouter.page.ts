import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { addIcons } from 'ionicons';
import { personCircle, star, business, addOutline } from 'ionicons/icons';
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

  @ViewChild('orgInput') orgInput!: ElementRef<HTMLInputElement>;

  // --- Organization input handling - UPDATED TO MATCH PROFILE PAGE ---
  orgTypeInput: string = '';
  selectedOrgTypes: string[] = []; // Changed from single string to array


  onOrgInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      this.orgTypeInput = inputElement.value;
    }
  }

  addOrgTypeFromInput(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const newType = this.orgTypeInput.trim();

    // Validate input
    if (!newType) {
      return;
    }

    // Check for duplicates
    if (this.selectedOrgTypes.includes(newType)) {
      this.toast.openSnackBar(`"${newType}" is already added`, 'warning');
      return;
    }

    // Add the new organization type
    this.selectedOrgTypes.push(newType);
    this.updateOrganisationFormControl();

    // Clear input and refocus
    this.orgTypeInput = '';

    // Refocus the input for better mobile UX
    setTimeout(() => {
      if (this.orgInput?.nativeElement) {
        this.orgInput.nativeElement.focus();
      }
    }, 50);

    // Debug and validation
    console.log('✅ Added org type:', newType);
    console.log('📋 Current org types:', this.selectedOrgTypes);
    this.checkFormStatus();

    // Show success feedback
    this.toast.openSnackBar(`Added "${newType}"`, 'success');
  }

  removeOrgType(index: number) {
    const removedType = this.selectedOrgTypes[index];
    this.selectedOrgTypes.splice(index, 1);
    this.updateOrganisationFormControl();

    this.checkFormStatus();

    // Show feedback
    this.toast.openSnackBar(`Removed "${removedType}"`, 'info');
  }

  // Update the focus method with null check
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
    private toast: ToastsService,
  ) {
    addIcons({ personCircle, star, business, addOutline });
  }

  ngOnInit() {
    this.initializeForms();
    this.initializeOtpControls();
    this.setupEmailValidation();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  // Add this custom validator
  arrayMinLengthValidator(min: number) {
    return (control: AbstractControl) => {
      if (
        !control.value ||
        !Array.isArray(control.value) ||
        control.value.length < min
      ) {
        return {
          minLength: {
            requiredLength: min,
            actualLength: control.value?.length || 0,
          },
        };
      }
      return null;
    };
  }

  // Update your form initialization for step 2
  private initializeForms() {
    this.forms = [];

    // Step 1: Personal Details (unchanged)
    this.forms.push(
      this.fb.group({
        fullname: ['', [Validators.required, Validators.minLength(2)]],
        phone: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
        email: ['', [Validators.required, this.strictEmailValidator()]],
      }),
    );

    // Step 2: Scouter Information - UPDATED with custom validator
    this.forms.push(
      this.fb.group({
        location: ['', Validators.required],
        organisation: [
          [],
          [Validators.required, this.arrayMinLengthValidator(1)],
        ],
        purpose: ['', Validators.required],
        payRange: ['', [Validators.required]],
      }),
    );

    // Step 3: Credentials
    this.forms.push(
      this.fb.group(
        {
          password: [
            '',
            [
              Validators.required,
              Validators.minLength(8),
              Validators.pattern(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              ),
            ],
          ],
          confirmPassword: ['', Validators.required],
        },
        { validators: this.passwordMatchValidator },
      ),
    );

    // Step 4: OTP Verification
    this.forms.push(
      this.fb.group({
        otp: this.fb.array([]),
      }),
    );
  }

  private buildPayload() {
    const orgTypes = this.selectedOrgTypes.length ? this.selectedOrgTypes : [];

    return {
      fullName: this.forms[0].get('fullname')?.value,
      phoneNumber: this.forms[0].get('phone')?.value,
      email: this.forms[0].get('email')?.value,
      location: this.forms[1].get('location')?.value,
      scoutingPurpose: this.forms[1].get('purpose')?.value,
      organizationType: orgTypes,
      payRange: String(this.forms[1].get('payRange')?.value),
      password: this.forms[2].get('password')?.value,
    };
  }

  // Add this temporary method to manually check what's missing
  manualCheckStep2() {
    const form = this.forms[1];
    if (!form) return;
  }

  // Update the organization form control method
  private updateOrganisationFormControl() {
    const orgTypes = this.selectedOrgTypes.filter(
      (org) => org && org.trim() !== '',
    );
    const orgControl = this.forms[1]?.get('organisation');

    if (orgControl) {
      orgControl.setValue(orgTypes);
      orgControl.markAsTouched();
      orgControl.updateValueAndValidity();

      console.log('🔄 Organization control updated:', {
        value: orgControl.value,
        valid: orgControl.valid,
        errors: orgControl.errors,
      });
    }
  }

  // Update the account creation payload
  submitScouterAccount() {
    if (this.forms[2].invalid) {
      console.log('Step 3 form invalid');
      this.forms[2].markAllAsTouched();
      return;
    }

    this.isProcessing = true;

    const organizationType = Array.isArray(this.selectedOrgTypes)
      ? this.selectedOrgTypes.filter((org) => org && org.trim() !== '')
      : [];

    const payload = {
      fullName: this.forms[0].get('fullname')?.value,
      phoneNumber: this.forms[0].get('phone')?.value,
      email: this.forms[0].get('email')?.value,
      location: this.forms[1].get('location')?.value,
      scoutingPurpose: this.forms[1].get('purpose')?.value,
      organizationType: organizationType,
      payRange: String(this.forms[1].get('payRange')?.value),
      password: this.forms[2].get('password')?.value,
    };

    console.log('📤 Final payload:', payload);

    this.scouterService.createScouterProfile(payload).subscribe({
      next: (res) => {
        console.log('✅ Account creation response:', res);
        this.isProcessing = false;
        this.tempUserData = { ...res };
        this.tempUserId = res?.id || null;
        this.currentStep = 3;
        this.sendOtpAutomatically();
      },
      error: (err) => {
        console.error('❌ Account creation error:', err);
        this.isProcessing = false;
        this.setError(err?.error?.message || 'Failed to create account.');
      },
    });
  }

  // Rest of your existing methods remain the same...
  private initializeOtpControls() {
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
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
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res.exists) {
            this.accountExistsError =
              'Account already exists. Please log in instead.';
            this.toast.openSnackBar(this.accountExistsError, 'error');
          } else {
            this.accountExistsError = null;
          }
        },
        error: (err) => {
          console.error('Email check error', err);
          this.accountExistsError = null;
        },
      });
  }

  goPrevious() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  // Form Validation
  isCurrentFormValid(): boolean {
    const currentForm = this.forms[this.currentStep];
    return currentForm ? currentForm.valid : false;
  }

  // Add this method to check form status
  checkFormStatus() {
    const currentForm = this.forms[this.currentStep];
    if (currentForm) {
      console.log('🔍 FORM STATUS:', {
        valid: currentForm.valid,
        invalid: currentForm.invalid,
        errors: currentForm.errors,
        controls: Object.keys(currentForm.controls).map((key) => ({
          control: key,
          valid: currentForm.get(key)?.valid,
          errors: currentForm.get(key)?.errors,
          value: currentForm.get(key)?.value,
        })),
      });
    }
  }

  // Update your goNext method to call this
  goNext() {
    this.checkFormStatus(); // Add this line

    const currentForm = this.forms[this.currentStep];
    if (!currentForm || !this.isCurrentFormValid()) {
      currentForm?.markAllAsTouched();
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

  strictEmailValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) return null;

      const valid =
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|edu|gov|co|io)$/i.test(
          value,
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
          err?.error?.message || 'Failed to send OTP. Please try again.',
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

  resendOtp() {
    if (this.countdown > 0) return;

    this.sendOtpAutomatically();
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

  clearOtpFields() {
    this.otpControls.forEach((control) => {
      control.setValue('');
      control.markAsUntouched();
    });
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

  getProgressWidth(): string {
    return `${((this.currentStep + 1) / this.steps.length) * 100}%`;
  }

  getOtpValue(): string {
    return this.otpControls
      .map((control) => control?.value || '')
      .join('')
      .replace(/\s/g, '');
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.toast.openSnackBar(message, 'error');
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  getEmailForOtp(): string {
    return this.forms[0]?.get('email')?.value || '';
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
    this.showSuccessModal = false;
    this.router.navigate(['/scouter/dashboard']);
  }
}
