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
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { debounceTime, map, switchMap, catchError } from 'rxjs/operators';
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
  // Password visibility toggles
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  currentStep = 0;
  activeTab: string = 'scouter';

  steps = [
    'Scouter Details',
    'Scouter Information',
    'Login Credentials',
    'Verify Scouter',
  ];

  orgTypeInputTouched: boolean = false;
  orgTypeInputError: string = '';

  isProcessing = false;
  tempUserData: any = null;
  tempUserId: string | null = null;
  lastOtpChannel: 'email' | 'phone' | null = null;
  accountExistsError: string | null = null;
  errorMessage: string = '';
  otpError: string = '';
  showSuccessModal = false;

  forms: FormGroup[] = [];
  otpControls: FormControl[] = [];
  otpLength = 4;
  countdown = 0;
  timer: any;

  @ViewChild('orgInput') orgInput!: ElementRef<HTMLInputElement>;

  // Organization input handling
  orgTypeInput: string = '';
  selectedOrgTypes: string[] = [];

  // Password strength tracking
  passwordStrength: number = 0;

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

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit() {
    this.initializeForms();
    this.initializeOtpControls();
    this.setupEmailValidation();
    this.setupPasswordStrengthListener();
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private nigerianPhoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Remove any spaces, dashes, or parentheses for validation
      const cleaned = value.replace(/[\s\-\(\)]/g, '');

      // Accept two formats:
      // 1. +234 followed by 10 digits (network code + 8 digits) - total 14 chars
      // 2. 0 followed by 10 digits (network code + 8 digits) - total 11 chars
      const plus234Pattern = /^\+234[789][01][0-9]{8}$/; // +2348083826576
      const zeroPattern = /^0[789][01][0-9]{8}$/; // 08083826576

      const isValid = plus234Pattern.test(cleaned) || zeroPattern.test(cleaned);

      return isValid ? null : { pattern: true };
    };
  }

  private strictEmailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Acceptable domains
      const allowedDomains = [
        'com',
        'org',
        'net',
        'edu',
        'gov',
        'co',
        'io',
        'ng',
        'us',
        'uk',
        'ca',
        'de',
        'fr',
        'au',
        'za',
        'info',
        'me',
        'tv',
        'biz',
        'app',
        'dev',
        'ai',
        'ac',
        'in',
        'eu',
        'asia',
        'africa',
        'int',
        'mil',
        'museum',
        'name',
        'pro',
        'tech',
        'xyz',
        'id',
        'ph',
        'sg',
        'my',
        'jp',
        'kr',
        'cn',
        'es',
        'it',
        'ru',
        'br',
        'mx',
        'ar',
        'cl',
        'pe',
        'tr',
        'pl',
        'se',
        'no',
        'fi',
        'dk',
        'be',
        'ch',
        'nl',
        'at',
        'cz',
        'gr',
        'pt',
        'ro',
        'sk',
        'si',
        'hr',
        'bg',
        'lt',
        'lv',
        'ee',
        'hu',
        'rs',
        'ua',
        'by',
        'kz',
        'ge',
        'il',
        'sa',
        'ae',
        'qa',
        'kw',
        'om',
        'bh',
        'eg',
        'ma',
        'tn',
        'dz',
        'ng',
        'gh',
        'ke',
        'tz',
        'ug',
        'zm',
        'zw',
        'mw',
        'na',
        'bw',
        'ls',
        'sz',
        'cm',
        'sn',
        'ci',
        'ml',
        'bf',
        'ne',
        'td',
        'sd',
        'ss',
        'et',
        'so',
        'dj',
        'er',
        'mg',
        'mu',
        'sc',
        'cv',
        'st',
        'gq',
        'ga',
        'cg',
        'cd',
        'ao',
        'mz',
        'gw',
        'gm',
        'sl',
        'lr',
        'mr',
        'gn',
        'tg',
        'bj',
        'cf',
        'cg',
        'cm',
        'bi',
        'rw',
        'km',
        'yt',
        're',
        'pm',
        'wf',
        'tf',
        'pf',
        'nc',
        'vu',
        'sb',
        'fm',
        'mh',
        'pw',
        'nr',
        'tv',
        'ki',
        'to',
        'ws',
        'as',
        'ck',
        'nu',
        'tk',
        'wf',
        'tf',
        'pn',
        'sh',
        'gs',
        'io',
        'aq',
        'bv',
        'hm',
        'sj',
        'um',
        'va',
        'su',
        'tp',
        'yu',
        'zr',
        'dd',
        'tp',
        'an',
        'bu',
        'cs',
        'nt',
        'pc',
        'vd',
        'wk',
        'yu',
        'zr',
        'co',
        'uk',
        'us',
        'ca',
        'au',
        'nz',
        'za',
        'ng',
        'ke',
        'gh',
        'tz',
        'ug',
        'zm',
        'zw',
        'mw',
        'na',
        'bw',
        'ls',
        'sz',
        'cm',
        'sn',
        'ci',
        'ml',
        'bf',
        'ne',
        'td',
        'sd',
        'ss',
        'et',
        'so',
        'dj',
        'er',
        'mg',
        'mu',
        'sc',
        'cv',
        'st',
        'gq',
        'ga',
        'cg',
        'cd',
        'ao',
        'mz',
        'gw',
        'gm',
        'sl',
        'lr',
        'mr',
        'gn',
        'tg',
        'bj',
        'cf',
        'cg',
        'cm',
        'bi',
        'rw',
        'km',
        'yt',
        're',
        'pm',
        'wf',
        'tf',
        'pf',
        'nc',
        'vu',
        'sb',
        'fm',
        'mh',
        'pw',
        'nr',
        'tv',
        'ki',
        'to',
        'ws',
        'as',
        'ck',
        'nu',
        'tk',
        'wf',
        'tf',
        'pn',
        'sh',
        'gs',
        'io',
        'aq',
        'bv',
        'hm',
        'sj',
        'um',
        'va',
        'su',
        'tp',
        'yu',
        'zr',
        'dd',
        'tp',
        'an',
        'bu',
        'cs',
        'nt',
        'pc',
        'vd',
        'wk',
        'yu',
        'zr',
      ];
      // Extract domain
      const match = value.match(
        /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})$/,
      );
      let unusualDomain = false;
      if (match) {
        const tld = match[2].toLowerCase();
        if (!allowedDomains.includes(tld)) {
          unusualDomain = true;
        }
      }
      // Standard email pattern
      const valid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
        value,
      );
      if (!valid) return { pattern: true };
      if (unusualDomain) return { unusualDomain: true };
      return null;
    };
  }

  private fullNameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      // Allow letters, spaces, hyphens, and apostrophes
      const valid = /^[a-zA-Z\s\-']+$/.test(value);
      return valid ? null : { pattern: true };
    };
  }

  private arrayMinLengthValidator(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
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

  private passwordMatchValidator(
    group: AbstractControl,
  ): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    if (confirmPassword && !password) {
      group.get('confirmPassword')?.setErrors({ required: true });
    }

    return null;
  }

  private initializeForms() {
    this.forms = [];

    // Step 1: Personal Details
    this.forms.push(
      this.fb.group({
        fullname: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            this.fullNameValidator(),
          ],
        ],
        phone: ['', [Validators.required, this.nigerianPhoneValidator()]],
        email: ['', [Validators.required, this.strictEmailValidator()]],
      }),
    );

    // Step 2: Scouter Information
    this.forms.push(
      this.fb.group({
        location: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(100),
          ],
        ],
        organisation: [
          [],
          [Validators.required, this.arrayMinLengthValidator(1)],
        ],
        purpose: [
          '',
          [
            Validators.required,
            Validators.minLength(3),
            Validators.maxLength(200),
          ],
        ],
        payRange: [
          '',
          [
            Validators.required,
            Validators.min(1000),
            Validators.pattern(/^[0-9]+$/),
          ],
        ],
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
              Validators.maxLength(50),
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

  private setupPasswordStrengthListener() {
    this.forms[2].get('password')?.valueChanges.subscribe((password) => {
      this.calculatePasswordStrength(password);
    });
  }

  private calculatePasswordStrength(password: string) {
    let strength = 0;

    if (!password) {
      this.passwordStrength = 0;
      return;
    }

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Character variety checks
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    // Cap at 3 for the progress bar
    this.passwordStrength = Math.min(3, Math.floor(strength / 2));
  }

  getPasswordStrengthClass(level: number): string {
    const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500'];

    if (level < this.passwordStrength) {
      return colors[level];
    }
    return 'bg-gray-200';
  }

  private setupEmailValidation() {
    this.forms[0]
      .get('email')
      ?.valueChanges.pipe(
        debounceTime(800),
        switchMap((email: string) => {
          if (email && this.forms[0].get('email')?.valid) {
            return this.userService
              .checkEmailExists(email)
              .pipe(catchError(() => of({ exists: false })));
          }
          return of({ exists: false });
        }),
      )
      .subscribe({
        next: (res: any) => {
          if (res?.exists) {
            this.accountExistsError =
              'Account already exists. Please log in instead.';
            this.toast.openSnackBar(this.accountExistsError, 'error');
          } else {
            this.accountExistsError = null;
          }
        },
        error: () => {
          this.accountExistsError = null;
        },
      });
  }

  addOrgTypeFromInput(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Mark as touched for validation
    this.orgTypeInputTouched = true;

    const newType = this.orgTypeInput.trim();

    // Validate input
    if (!newType) {
      this.orgTypeInputError = 'Please enter an organization type';
      this.toast.openSnackBar(this.orgTypeInputError, 'warning');
      return;
    }

    if (newType.length < 2) {
      this.orgTypeInputError =
        'Organization type must be at least 2 characters';
      this.toast.openSnackBar(this.orgTypeInputError, 'warning');
      return;
    }

    if (newType.length > 50) {
      this.orgTypeInputError = 'Organization type cannot exceed 50 characters';
      this.toast.openSnackBar(this.orgTypeInputError, 'warning');
      return;
    }

    // Check for duplicates (case insensitive)
    if (
      this.selectedOrgTypes.some(
        (org) => org.toLowerCase() === newType.toLowerCase(),
      )
    ) {
      this.orgTypeInputError = `"${newType}" is already added`;
      this.toast.openSnackBar(this.orgTypeInputError, 'warning');
      return;
    }

    // Clear error on successful validation
    this.orgTypeInputError = '';

    // Add the new organization type
    this.selectedOrgTypes.push(newType);
    this.updateOrganisationFormControl();

    // Clear input and refocus
    this.orgTypeInput = '';
    this.orgTypeInputTouched = false; // Reset touched state for new input

    setTimeout(() => {
      if (this.orgInput?.nativeElement) {
        this.orgInput.nativeElement.focus();
      }
    }, 50);

    this.toast.openSnackBar(`Added "${newType}"`, 'success');
  }

  // Add this method to reset validation when typing
  onOrgInput(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement) {
      this.orgTypeInput = inputElement.value;
      // Clear error when user starts typing
      if (this.orgTypeInputError) {
        this.orgTypeInputError = '';
      }
    }
  }

  removeOrgType(index: number) {
    if (index >= 0 && index < this.selectedOrgTypes.length) {
      const removedType = this.selectedOrgTypes[index];
      this.selectedOrgTypes.splice(index, 1);
      this.updateOrganisationFormControl();
      this.toast.openSnackBar(`Removed "${removedType}"`, 'info');
    }
  }

  private updateOrganisationFormControl() {
    const orgTypes = this.selectedOrgTypes.filter(
      (org) => org && org.trim() !== '',
    );
    const orgControl = this.forms[1]?.get('organisation');

    if (orgControl) {
      orgControl.setValue(orgTypes);
      orgControl.markAsTouched();
      orgControl.updateValueAndValidity();
    }
  }

  private buildPayload() {
    let phoneNumber = this.forms[0].get('phone')?.value?.trim() || '';

    // Remove any spaces or special characters
    phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // If it starts with 0, convert to +234 format
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+234' + phoneNumber.substring(1);
    }

    // Ensure it starts with +234
    if (phoneNumber.startsWith('234') && !phoneNumber.startsWith('+234')) {
      phoneNumber = '+' + phoneNumber;
    }

    return {
      fullName: this.forms[0].get('fullname')?.value?.trim(),
      phoneNumber: phoneNumber, // Will always be in +234 format for API
      email: this.forms[0].get('email')?.value?.trim().toLowerCase(),
      location: this.forms[1].get('location')?.value?.trim(),
      scoutingPurpose: this.forms[1].get('purpose')?.value?.trim(),
      organizationType: this.selectedOrgTypes,
      payRange: String(this.forms[1].get('payRange')?.value),
      password: this.forms[2].get('password')?.value,
    };
  }

  formatPhoneNumber(event: any) {
    let input = event.target.value;

    // Remove any non-digit and non-+ characters
    let cleaned = input.replace(/[^\d+]/g, '');

    // Ensure only one + at the beginning
    if (cleaned.indexOf('+') > 0) {
      cleaned = '+' + cleaned.replace(/\+/g, '');
    }

    // If starts with +, limit to 14 characters (+234 + 10 digits)
    if (cleaned.startsWith('+')) {
      if (cleaned.length > 14) {
        cleaned = cleaned.substring(0, 14);
      }
    }
    // If starts with 0, limit to 11 characters
    else if (cleaned.startsWith('0')) {
      if (cleaned.length > 11) {
        cleaned = cleaned.substring(0, 11);
      }
    }
    // If starts with anything else, force either 0 or +234
    else if (cleaned.length > 0) {
      // Default to 0 format if first digit is valid network code
      if (cleaned.length === 1 && ['7', '8', '9'].includes(cleaned[0])) {
        cleaned = '0' + cleaned;
      }
    }

    // Update the form control only if value changed
    if (cleaned !== input) {
      this.forms[0].get('phone')?.setValue(cleaned, { emitEvent: false });
    }
  }

  submitScouterAccount() {
    if (this.forms[2].invalid) {
      this.forms[2].markAllAsTouched();
      this.toast.openSnackBar(
        'Please fill in all required fields correctly',
        'error',
      );
      return;
    }

    this.isProcessing = true;
    this.errorMessage = '';

    const payload = this.buildPayload();

    // Validate payload
    if (
      !payload.fullName ||
      !payload.phoneNumber ||
      !payload.email ||
      !payload.location ||
      !payload.scoutingPurpose ||
      !payload.payRange ||
      !payload.password
    ) {
      this.isProcessing = false;
      this.toast.openSnackBar('All fields are required', 'error');
      return;
    }

    this.scouterService.createScouterProfile(payload).subscribe({
      next: (res) => {
        this.isProcessing = false;
        this.tempUserData = { ...res };
        this.tempUserId = res?.id || null;
        this.currentStep = 3;
        this.sendOtpAutomatically();
      },
      error: (err) => {
        this.isProcessing = false;
        const errorMsg =
          err?.error?.message ||
          err?.message ||
          'Failed to create account. Please try again.';
        this.setError(errorMsg);
      },
    });
  }

  private initializeOtpControls() {
    this.otpControls = Array.from({ length: this.otpLength }, () =>
      this.fb.control('', [Validators.required, Validators.pattern(/^[0-9]$/)]),
    );

    const otpArray = this.fb.array(this.otpControls);
    this.forms[3].setControl('otp', otpArray);
  }

  isOtpComplete(): boolean {
    return this.otpControls.every((control) => control.value && control.valid);
  }

  goPrevious() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.otpError = '';
    }
  }

  isCurrentFormValid(): boolean {
    const currentForm = this.forms[this.currentStep];

    if (!currentForm) return false;

    // Special handling for step 2 with organization array
    if (this.currentStep === 1) {
      return currentForm.valid && this.selectedOrgTypes.length > 0;
    }

    return currentForm.valid;
  }

  goNext() {
    const currentForm = this.forms[this.currentStep];

    if (!currentForm || !this.isCurrentFormValid()) {
      currentForm?.markAllAsTouched();

      // Show specific error messages
      if (this.currentStep === 1 && this.selectedOrgTypes.length === 0) {
        this.toast.openSnackBar(
          'Please add at least one organization type',
          'error',
        );
      } else {
        this.toast.openSnackBar(
          'Please fill in all required fields correctly',
          'error',
        );
      }
      return;
    }

    this.errorMessage = '';
    this.otpError = '';

    if (this.currentStep === 2) {
      this.submitScouterAccount();
    } else {
      this.currentStep++;

      if (this.currentStep === 3 && this.tempUserId) {
        this.sendOtpAutomatically();
      }
    }
  }

  sendOtpAutomatically() {
    const email = this.forms[0].get('email')?.value;
    const phone = this.forms[0].get('phone')?.value;

    if (!email && !phone) {
      this.setError('Email or phone number is required to send OTP');
      return;
    }

    const payload: any = email ? { email } : { phoneNumber: phone };
    this.lastOtpChannel = email ? 'email' : 'phone';

    this.isProcessing = true;
    this.otpError = '';

    this.scouterService.resendOtp(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.startCountdown();
        this.clearOtpFields();
        this.toast.openSnackBar('OTP sent successfully', 'success');
      },
      error: (err) => {
        this.isProcessing = false;
        const errorMsg =
          err?.error?.message || 'Failed to send OTP. Please try again.';
        this.otpError = errorMsg;
        this.setError(errorMsg);
      },
    });
  }

  verifyOtpAndProceed() {
    const otpValue = this.getOtpValue();

    if (!otpValue || otpValue.length !== this.otpLength) {
      this.otpError = 'Please enter the complete 4-digit OTP.';
      return;
    }

    const payload: any = { otp: otpValue };

    if (this.lastOtpChannel === 'phone') {
      payload.phoneNumber = this.forms[0].get('phone')?.value;
    } else {
      payload.email = this.forms[0].get('email')?.value;
    }

    this.isProcessing = true;
    this.otpError = '';

    this.scouterService.verifyOtp(payload).subscribe({
      next: () => {
        this.isProcessing = false;

        // Store email in localStorage
        const email = this.forms[0].get('email')?.value;
        if (email) {
          localStorage.setItem('registration_email', email);
        }

        this.showSuccessModal = true;
        this.tempUserId = null;
        this.tempUserData = null;

        // Clear forms
        this.clearForms();
      },
      error: (err) => {
        this.isProcessing = false;

        if (err.status === 422 || err.status === 400) {
          this.otpError =
            'Invalid or expired OTP. Please try again or request a new one.';
        } else {
          this.otpError =
            err?.error?.message || 'OTP verification failed. Please try again.';
        }

        this.clearOtpFields();
        this.setError(this.otpError);
      },
    });
  }

  resendOtp() {
    if (this.countdown > 0 || this.isProcessing) return;
    this.sendOtpAutomatically();
  }

// OTP Input Handling
onOtpInput(event: Event, index: number) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // Clear error when user starts typing
  if (this.otpError) {
    this.otpError = '';
  }

  // Only allow single digit
  if (value && !/^\d$/.test(value)) {
    input.value = '';
    this.otpControls[index].setValue('');
    return;
  }

  // Update the control value
  this.otpControls[index].setValue(value);

  // Auto-advance to next input if current has value
  if (value && index < this.otpControls.length - 1) {
    // Find the next input with class 'otp-input'
    const inputs = document.querySelectorAll('.otp-input');
    if (inputs && inputs[index + 1]) {
      (inputs[index + 1] as HTMLInputElement).focus();
    }
  }

  // Auto-submit when last digit is entered
  if (
    value &&
    index === this.otpControls.length - 1 &&
    this.isOtpComplete()
  ) {
    setTimeout(() => this.verifyOtpAndProceed(), 100);
  }
}

// Also update onKeyDown for better backspace handling
onKeyDown(event: KeyboardEvent, index: number) {
  const input = event.target as HTMLInputElement;
  
  if (event.key === 'Backspace') {
    // If current input is empty and not first, move to previous
    if (!input.value && index > 0) {
      const inputs = document.querySelectorAll('.otp-input');
      if (inputs && inputs[index - 1]) {
        (inputs[index - 1] as HTMLInputElement).focus();
      }
    }
  } else if (event.key === 'ArrowLeft' && index > 0) {
    // Left arrow navigation
    const inputs = document.querySelectorAll('.otp-input');
    (inputs[index - 1] as HTMLInputElement)?.focus();
  } else if (event.key === 'ArrowRight' && index < this.otpControls.length - 1) {
    // Right arrow navigation
    const inputs = document.querySelectorAll('.otp-input');
    (inputs[index + 1] as HTMLInputElement)?.focus();
  }
}

  onOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text');

    if (pastedData && /^\d+$/.test(pastedData)) {
      const digits = pastedData.slice(0, this.otpLength).split('');

      digits.forEach((digit, index) => {
        if (index < this.otpControls.length) {
          this.otpControls[index].setValue(digit);
        }
      });

      // Focus the next empty input or last input
      const nextEmptyIndex = digits.length;
      if (nextEmptyIndex < this.otpControls.length) {
        const inputs = document.querySelectorAll('.otp-input');
        (inputs[nextEmptyIndex] as HTMLInputElement)?.focus();
      }
    }
  }

 

  clearOtpFields() {
    this.otpControls.forEach((control) => {
      control.setValue('');
      control.markAsUntouched();
      control.markAsPristine();
    });
  }

  clearForms() {
    this.forms.forEach((form) => form.reset());
    this.selectedOrgTypes = [];
    this.orgTypeInput = '';
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

  getProgressWidth(): string {
    return `${((this.currentStep + 1) / this.steps.length) * 100}%`;
  }

  getOtpValue(): string {
    return this.otpControls.map((control) => control?.value || '').join('');
  }

  private setError(message: string) {
    this.errorMessage = message;
    this.toast.openSnackBar(message, 'error');
    setTimeout(() => {
      if (this.errorMessage === message) {
        this.errorMessage = '';
      }
    }, 5000);
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
  goBack() {
    if (this.currentStep === 0) {
      this.router.navigate(['/auth/login']);
    } else {
      this.goPrevious();
    }
  }

  goToLogin() {
    this.showSuccessModal = false;
    this.router.navigate(['/auth/login'], {
      queryParams: {
        email: this.forms[0].get('email')?.value,
        message: 'Account created successfully. Please login.',
      },
    });
  }

  goToDashboard() {
    this.showSuccessModal = false;
    this.router.navigate(['/scouter/dashboard']);
  }
}
