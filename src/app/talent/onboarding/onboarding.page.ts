import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { CommonModule, NgClass } from '@angular/common';
import { TalentService } from 'src/app/services/talent.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NgClass],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // Add this line

  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
  skillSetInputTouched: boolean = false;
  skillSetInputError: string = '';

  canResendOtp: boolean = false;
  private timerInterval: any;

  // --- Enhanced validation helpers ---
  get isFullNameValid(): boolean {
    return /^[a-zA-Z\s\-']{3,}$/.test(this.fullName.trim());
  }
  get isLocationValid(): boolean {
    return this.location.trim().length >= 2;
  }
  get isSkillSetValid(): boolean {
    return this.skillSets.length > 0;
  }
  get isPasswordValid(): boolean {
    // At least 8 chars, upper, lower, number, special
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      this.password,
    );
  }
  get isConfirmPasswordValid(): boolean {
    return (
      this.confirmPassword === this.password && this.confirmPassword.length > 0
    );
  }
  constructor(
    private router: Router,
    // private toastCtrl: ToastController,
    private toast: ToastsService,
    private talentService: TalentService,
  ) {}

  // ------------------- STEPS -------------------
  steps = [
    'Talent Details',
    'Other Details',
    'Login Credentials',
    'Verify OTP',
  ];
  currentStep = 0;

  getProgressWidth() {
    return ((this.currentStep + 1) / this.steps.length) * 100 + '%';
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) this.currentStep++;
  }
  previousStep() {
    if (this.currentStep > 0) this.currentStep--;
  }

  // ------------------- TALENT DETAILS -------------------
  fullName = '';
  phone = '';
  email = '';
  location = '';

  fullNameTouched = false;
  phoneTouched = false;
  emailTouched = false;
  locationTouched = false;

  // ------------------- OTHER DETAILS -------------------
  skillLevel = '';
  skillSets: string[] = [];
  skillSetInput = '';
  education = '';
  payRange = '';

  skillLevelTouched = false;
  skillSetTouched = false;
  educationTouched = false;
  payRangeTouched = false;

  skillLevels = ['Beginner', 'Intermediate', 'Expert'];
  educationLevels = [
    'School drop-out',
    'SCCE',
    "Bachelor's Degree",
    "Master's Degree",
    'PhD',
  ];
  payRanges = [
    'Less than 20k',
    '₦20,000 - ₦50,000',
    '₦50,000 - ₦100,000',
    '₦100,000 - ₦200,000',
    '₦200,000 - ₦500,000',
    '₦500,000 - ₦1,000,000',
    'Above ₦1,000,000',
  ];

  addSkill() {
    this.skillSetInputTouched = true;

    const trimmed = this.skillSetInput.trim();

    // Validate input
    if (!trimmed) {
      this.skillSetInputError = 'Please enter a skill';
      this.toast.openSnackBar(this.skillSetInputError, 'warning');
      return;
    }

    if (trimmed.length < 2) {
      this.skillSetInputError = 'Skill must be at least 2 characters';
      this.toast.openSnackBar(this.skillSetInputError, 'warning');
      return;
    }

    if (trimmed.length > 50) {
      this.skillSetInputError = 'Skill cannot exceed 50 characters';
      this.toast.openSnackBar(this.skillSetInputError, 'warning');
      return;
    }

    // Check for duplicates
    if (this.skillSets.includes(trimmed)) {
      this.skillSetInputError = `"${trimmed}" is already added`;
      this.toast.openSnackBar(this.skillSetInputError, 'warning');
      return;
    }

    // Clear error on successful validation
    this.skillSetInputError = '';

    // Add the skill
    this.skillSets.push(trimmed);

    // Clear input and reset validation state
    this.skillSetInput = '';
    this.skillSetInputTouched = false;

    // Mark the overall skill set as touched for form validation
    this.skillSetTouched = true;

    this.toast.openSnackBar(`Added "${trimmed}"`, 'success');
  }

  // Add this method to handle input changes
  onSkillInput(event: any) {
    this.skillSetInput = event.target.value;
    // Clear error when user starts typing
    if (this.skillSetInputError) {
      this.skillSetInputError = '';
    }
  }

  removeSkill(skill: string) {
    this.skillSets = this.skillSets.filter((s) => s !== skill);
  }

  // ------------------- LOGIN CREDENTIALS -------------------
  // emailLogin is now derived from the first step's email
  password = '';
  confirmPassword = '';

  emailLoginTouched = false;
  passwordTouched = false;
  confirmPasswordTouched = false;

  showPassword = false;
  showConfirmPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ------------------- VERIFY OTP -------------------
  otp: string[] = ['', '', '', ''];
  otpFields = new Array(4);
  timer: number = 120;
  error: string = '';

  // Add these missing properties
  isSubmitting = false;
  showSuccessPopup = false;

  ngOnInit() {
    // Timer should only run on OTP step
  }

  // ------------------- VALIDATIONS -------------------
  get isPhoneValid(): boolean {
    return /^\d{7,15}$/.test(this.phone);
  }

  get isEmailValid(): boolean {
    return /\S+@\S+\.\S+/.test(this.email);
  }

  get isEmailLoginValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  get isTalentDetailsValid(): boolean {
    return (
      this.fullName !== '' &&
      this.location !== '' &&
      this.isPhoneValid &&
      this.isEmailValid
    );
  }

  get isOtherDetailsValid(): boolean {
    return (
      this.skillLevel !== '' &&
      this.skillSets.length > 0 &&
      this.education !== '' &&
      this.payRange !== ''
    );
  }

  get isLoginCredentialsValid(): boolean {
    return (
      this.email.trim() !== '' &&
      this.password.trim() !== '' &&
      this.confirmPassword.trim() !== '' &&
      this.password === this.confirmPassword &&
      this.isEmailValid
    );
  }

  get isOtpValid(): boolean {
    return this.otp.every((d) => d !== '');
  }

  // ------------------- OTP METHODS -------------------
  maskedEmail() {
    if (!this.email) return '';
    const parts = this.email.split('@');
    return parts[0].slice(0, 2) + '***@' + parts[1];
  }

  maskedPhone() {
    if (!this.phone) return '';
    return this.phone.slice(0, 3) + '****' + this.phone.slice(-2);
  }

  moveNext(event: any, index: number) {
    const value = event.target.value;
    if (value.length === 1 && index < 3) {
      const next = event.target.nextElementSibling;
      if (next) next.focus();
    }
    if (value.length === 0 && index > 0) {
      const prev = event.target.previousElementSibling;
      if (prev) prev.focus();
    }
  }

  // ------------------- API: CREATE TALENT PROFILE -------------------
  submitTalentProfile() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.error = '';

    const payload = {
      email: this.email,
      password: this.password,
      fullName: this.fullName,
      phoneNumber: this.phone,
      address: this.location,
      educationalBackground: this.education,
      skillSets: this.skillSets,
      skillLevel: this.skillLevel,
      payRange: this.payRange,
    };

    this.talentService.createTalentProfile(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        // MOVE TO OTP STEP immediately on success
        this.currentStep = 3;
        this.startTimer();
      },
      error: (err) => {
        this.isSubmitting = false;

        const backendMsg = err?.error?.message?.toString()?.toLowerCase() ?? '';

        if (backendMsg.includes('email')) {
          // this.showToast('Email already exists. Please use another email.');
          this.toast.openSnackBar(
            'Email already exists. Please use another email.',
            'error',
          );
        } else if (backendMsg.includes('phone')) {
          // this.showToast(
          //   'Phone number already in use. Please use another number.'
          // );
          this.toast.openSnackBar(
            'Phone number already in use. Please use another number.',
            'error',
          );
        } else {
          // this.showToast(err?.error?.message ?? 'Failed to create profile');
          this.toast.openSnackBar(
            `${err?.error?.message ?? 'Failed to create profile'}`,
            'error',
          );
        }
        console.error('Onboard Talent Error:', err);
        this.error =
          err.error?.message || 'Failed to create profile. Try again later.';
      },
    });
  }

  // ------------------- API: VERIFY OTP -------------------
  verifyOtp() {
    const otpValue = this.otp.join('');
    if (otpValue.length !== 4) {
      this.error = 'Please enter complete OTP';
      return;
    }

    const payload = {
      otp: otpValue,
      phoneNumber: this.phone,
      email: this.email,
    };

    this.talentService.verifyOTP(payload).subscribe({
      next: (res) => {
        this.error = '';
        this.showPopup(); // success popup
      },
      error: (err) => {
        this.error = err.error?.message || 'Invalid OTP';
      },
    });
  }

  // ------------------- API: RESEND OTP -------------------
  resendOtp() {
    if (!this.canResendOtp) return; // Prevent resend if timer is still running

    const payload = {
      phoneNumber: this.phone,
      email: this.email,
    };

    this.talentService.resendOTP(payload).subscribe({
      next: (res) => {
        this.otp = ['', '', '', ''];
        this.startTimer(); // This will set canResendOtp to false again
        this.toast.openSnackBar('OTP resent successfully', 'success');
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to resend OTP';
      },
    });
  }

  // ------------------- TIMER -------------------
  startTimer() {
    this.timer = 120;
    this.canResendOtp = false; // Disable resend when timer starts

    // Clear any existing interval
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        // Timer reached zero, enable resend
        this.canResendOtp = true;
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  // ------------------- SUCCESS POPUP -------------------
  showPopup() {
    this.showSuccessPopup = true;
  }

  closePopup() {
    this.showSuccessPopup = false;
  }

  goToLogin() {
    this.showSuccessPopup = false;
    this.router.navigate(['/auth/login']);
  }

  // ------------------- NAVIGATION -------------------
  handleNextStep() {
    if (this.currentStep === 0 && this.isTalentDetailsValid) {
      this.nextStep();
      return;
    }

    if (this.currentStep === 1 && this.isOtherDetailsValid) {
      this.nextStep();
      return;
    }

    if (this.currentStep === 2 && this.isLoginCredentialsValid) {
      this.submitTalentProfile(); // IMPORTANT API CALL
      return;
    }
  }

  handlePreviousStep() {
    this.previousStep();
  }

  handleCancel() {
    this.router.navigate(['/auth/login']);
  }

  handleWelcomeBack() {
    this.router.navigate(['/auth/welcome-page']);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
