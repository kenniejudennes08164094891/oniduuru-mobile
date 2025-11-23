import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  currentStep = 1;
  isDropdownOpen = false;
  selectedOption = '';
  images = imageIcons;
  countdown = 120;
  private countdownInterval: any;

  // OTP Management
  otpBoxes = Array(4).fill(0);
  otpValues: string[] = Array(4).fill('');

  // Security Questions
  securityQuestions = [
    'What was the name of your first pet?',
    'What city were you born in?',
    "What is your mother's maiden name?",
    'What was your first car?',
    'What is the name of your elementary school?',
  ];

  // Form Data
  forgotPasswordData = {
    accountType: '',
    identifier: '',
    securityQuestion: '',
    securityAnswer: '',
    otpMethod: '',
    email: '',
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  };

  constructor(private router: Router) {}

  ngOnInit() {
    this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  // Navigation Methods
  nextStep() {
    if (this.currentStep < 7) {
      this.currentStep++;

      // Reset OTP when moving to step 5
      if (this.currentStep === 5) {
        this.resetOtp();
        this.startCountdown();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    } else {
      this.goBack();
    }
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  // Dropdown Methods
  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectSecurityQuestion(question: string) {
    this.forgotPasswordData.securityQuestion = question;
    this.isDropdownOpen = false;
  }

  // OTP Method Selection
  selectOtpMethod(method: 'email' | 'phone') {
    this.forgotPasswordData.otpMethod = method;
    this.nextStep();
  }

  // OTP Management
  onOtpInput(event: any, index: number) {
    const input = event.target;
    const value = input.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) {
      input.value = '';
      this.otpValues[index] = '';
      return;
    }

    this.otpValues[index] = value;

    // Auto-focus next input
    if (value && index < this.otpBoxes.length - 1) {
      const nextInput = document.querySelector(
        `input[name="otp-${index + 1}"]`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Update the complete OTP
    this.forgotPasswordData.otp = this.otpValues.join('');
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpValues[index] && index > 0) {
      const prevInput = document.querySelector(
        `input[name="otp-${index - 1}"]`
      ) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  get isOtpComplete(): boolean {
    return (
      this.otpValues.every((value) => value !== '') &&
      this.otpValues.join('').length === 6
    );
  }

  resetOtp() {
    this.otpValues = Array(6).fill('');
    this.forgotPasswordData.otp = '';
  }

  // Countdown Timer
  startCountdown() {
    this.countdown = 120;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  // Action Methods
  sendOtp() {
    // Here you would typically call your OTP service
    console.log('Sending OTP to:', this.forgotPasswordData);
    this.nextStep();
  }

  resendOtp() {
    this.sendOtp();
    this.startCountdown();
  }

  verifyOtp() {
    // Here you would verify the OTP with your backend
    if (this.isOtpComplete) {
      console.log('Verifying OTP:', this.forgotPasswordData.otp);
      this.nextStep();
    }
  }

  updatePassword() {
    // Here you would update the password via your backend
    if (
      this.forgotPasswordData.newPassword ===
      this.forgotPasswordData.confirmPassword
    ) {
      console.log('Updating password:', this.forgotPasswordData.newPassword);
      this.nextStep();
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  cancel() {
    this.router.navigate(['/auth/login']);
  }

  onSubmit() {
    // Form submission handled in individual steps
  }

  // Utility Methods
  get maskedEmail(): string {
    if (!this.forgotPasswordData.email) return '';
    const [localPart, domain] = this.forgotPasswordData.email.split('@');
    const maskedLocal =
      localPart.substring(0, 3) + '*'.repeat(localPart.length - 3);
    return `${maskedLocal}@${domain}`;
  }

  get maskedPhone(): string {
    if (!this.forgotPasswordData.phone) return '';
    return (
      this.forgotPasswordData.phone.substring(0, 3) +
      '*'.repeat(this.forgotPasswordData.phone.length - 5) +
      this.forgotPasswordData.phone.slice(-2)
    );
  }
}
