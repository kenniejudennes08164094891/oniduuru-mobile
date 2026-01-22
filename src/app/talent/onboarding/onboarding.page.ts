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
  constructor(
    private router: Router,
    // private toastCtrl: ToastController,
    private toast: ToastsService,
    private talentService: TalentService
  ) { }

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
    const trimmed = this.skillSetInput.trim();
    if (trimmed && !this.skillSets.includes(trimmed)) {
      this.skillSets.push(trimmed);
    }
    this.skillSetInput = '';
  }

  removeSkill(skill: string) {
    this.skillSets = this.skillSets.filter((s) => s !== skill);
  }

  // ------------------- LOGIN CREDENTIALS -------------------
  emailLogin = '';
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
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.emailLogin);
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
      this.emailLogin.trim() !== '' &&
      this.password.trim() !== '' &&
      this.confirmPassword.trim() !== '' &&
      this.password === this.confirmPassword &&
      this.isEmailLoginValid
    );
  }

  get isOtpValid(): boolean {
    return this.otp.every((d) => d !== '');
  }

  // ------------------- OTP METHODS -------------------
  maskedEmail() {
    if (!this.emailLogin) return '';
    const parts = this.emailLogin.split('@');
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
      email: this.emailLogin,
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
          this.toast.openSnackBar('Email already exists. Please use another email.', 'error');

        } else if (backendMsg.includes('phone')) {
          // this.showToast(
          //   'Phone number already in use. Please use another number.'
          // );
          this.toast.openSnackBar('Phone number already in use. Please use another number.', 'error');

        } else {
          // this.showToast(err?.error?.message ?? 'Failed to create profile');
          this.toast.openSnackBar(`${err?.error?.message ?? 'Failed to create profile'}`, 'error');

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
      email: this.emailLogin,
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
    const payload = {
      phoneNumber: this.phone,
      email: this.emailLogin,
    };

    this.talentService.resendOTP(payload).subscribe({
      next: (res) => {
        this.otp = ['', '', '', ''];
        this.startTimer();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to resend OTP';
      },
    });
  }

  // ------------------- TIMER -------------------
  startTimer() {
    this.timer = 120;

    const interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(interval);
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
}
