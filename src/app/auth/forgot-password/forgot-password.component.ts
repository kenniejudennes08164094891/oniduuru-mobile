import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, Subscription } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  images = imageIcons;

  /* =========================
     REACTIVE FORM
  ========================= */
  forgotPasswordForm!: FormGroup;

  /* =========================
     UI STATE
  ========================= */
  showUniqueIdentifier = false;
  showSecurityFields = false;
  isDropdownOpen = false;
  loadingQuestions = false;

  questions: string[] = [];

  /* =========================
     STEP BASED (OTP + RESET)
  ========================= */
  currentStep = 3;
  countdown = 120;
  sendingOtp = false;
  verifyingOtp = false;
  private countdownInterval: any;

  otpBoxes = Array(6).fill(0);
  otpValues: string[] = Array(6).fill('');

  /* =========================
     SUBSCRIPTIONS
  ========================= */
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) { }

  /* =========================
     INIT
  ========================= */
  ngOnInit(): void {
    this.buildForm();
    this.handleAccountTypeChange();
    this.handleUniqueIdChange();
  }

  /* =========================
     FORM SETUP
  ========================= */
  private buildForm(): void {
    this.forgotPasswordForm = this.fb.group({
      accountType: ['', Validators.required],
      uniqueIdentifier: ['', Validators.required],
      securityQuestion: ['', Validators.required],
      securityAnswer: ['', Validators.required],

      otpMethod: [''],
      email: [''],
      phone: [''],
      otp: [''],
      newPassword: [''],
      confirmPassword: [''],
    });
  }

  /* =========================
     REACTIVE FLOW (WEB STYLE)
  ========================= */

  private handleAccountTypeChange(): void {
    const sub = this.forgotPasswordForm
      .get('accountType')!
      .valueChanges.subscribe(() => {
        this.showUniqueIdentifier = true;
        this.showSecurityFields = false;
        this.questions = [];
        this.forgotPasswordForm.patchValue({
          uniqueIdentifier: '',
          securityQuestion: '',
          securityAnswer: '',
        });
      });

    this.subscriptions.add(sub);
  }

  private handleUniqueIdChange(): void {
    const sub = this.forgotPasswordForm
      .get('uniqueIdentifier')!
      .valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((value: string) => {
        const trimmed = value?.trim();

        // Show security fields as soon as user types anything
        this.showSecurityFields = !!trimmed;

        // Only call API when input is reasonably valid
        if (trimmed && trimmed.length > 0) {
          this.fetchSecurityQuestions(trimmed);
        } else {
          this.questions = []; // keep dropdown empty but visible
        }
      });

    this.subscriptions.add(sub);
  }

  private fetchSecurityQuestions(uniqueId: string): void {
    this.loadingQuestions = true;

    this.authService.getMySecurityQuestions(uniqueId).subscribe({
      next: (res) => {
        this.questions = res?.data || [];
        //this.showSecurityFields = this.questions.length > 0;
        this.loadingQuestions = false;

        this.forgotPasswordForm.get('uniqueIdentifier')!.setErrors(null);
      },
      error: (err) => {
        console.error('Failed to fetch security questions', err);
        this.questions = [];
        //this.showSecurityFields = false;
        this.loadingQuestions = false;

        this.forgotPasswordForm.get('uniqueIdentifier')!.setErrors({ invalid: true });
      },
    });
  }

  /* =========================
     SECURITY QUESTION
  ========================= */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  selectSecurityQuestion(question: string): void {
    this.forgotPasswordForm.patchValue({
      securityQuestion: question,
    });

    this.forgotPasswordForm
      .get('securityQuestion')
      ?.updateValueAndValidity();

    this.isDropdownOpen = false;
  }


  onSubmitSecurityAnswer(): void {
    const requiredControls = [
      'uniqueIdentifier',
      'securityQuestion',
      'securityAnswer',
    ];

    let hasError = false;

    requiredControls.forEach((controlName) => {
      const control = this.forgotPasswordForm.get(controlName);
      control?.markAsTouched();
      if (control?.invalid) {
        hasError = true;
      }
    });

    if (hasError) return;

    const payload = {
      talentId: this.forgotPasswordForm.value.uniqueIdentifier,
      answerSecurityQuestion: {
        question: this.forgotPasswordForm.value.securityQuestion,
        answer: this.forgotPasswordForm.value.securityAnswer,
      },
    };

    this.authService.validateTalentSecurityQuestion(payload).subscribe({
      next: () => {
        // Blur the currently focused element to avoid aria-hidden focus conflicts
        try {
          const active = document.activeElement as HTMLElement | null;
          if (active) active.blur();
        } catch (e) {
          // ignore
        }

        // Navigate to OTP page (use setTimeout to ensure blur takes effect)
        setTimeout(() => {
          this.router.navigate(['/auth/forgot-password/verify-otp'], {
            state: {
              talentId: payload.talentId,
              flow: 'forgot-password',
            },
          });
        }, 0);
      },
      error: (err) => {
        console.error('Security validation failed', err);
      },
    });
  }

  /* =========================
     OTP LOGIC (UNCHANGED)
  ========================= */

  // selectOtpMethod(method: 'email' | 'phone'): void {
  //   this.forgotPasswordForm.patchValue({ otpMethod: method });
  //   this.sendOtp();
  // }

  // sendOtp(): void {
  //   if (this.sendingOtp) return;

  //   const payload = {
  //     email:
  //       this.forgotPasswordForm.value.otpMethod === 'email'
  //         ? this.forgotPasswordForm.value.email
  //         : '',
  //     phoneNumber:
  //       this.forgotPasswordForm.value.otpMethod === 'phone'
  //         ? this.forgotPasswordForm.value.phone
  //         : '',
  //   };

  //   this.sendingOtp = true;

  //   this.authService.resendOTP(payload).subscribe({
  //     next: () => {
  //       this.sendingOtp = false;
  //       this.resetOtp();
  //       this.startCountdown();
  //       this.currentStep = 5;
  //     },
  //     error: () => {
  //       this.sendingOtp = false;
  //     },
  //   });
  // }

  // onOtpInput(event: any, index: number): void {
  //   const value = event.target.value;

  //   if (!/^\d*$/.test(value)) {
  //     event.target.value = '';
  //     return;
  //   }

  //   this.otpValues[index] = value;
  //   this.forgotPasswordForm.patchValue({
  //     otp: this.otpValues.join(''),
  //   });
  // }

  // verifyOtp(): void {
  //   if (this.otpValues.join('').length !== 6 || this.verifyingOtp) return;

  //   const payload = {
  //     otp: this.forgotPasswordForm.value.otp,
  //     email:
  //       this.forgotPasswordForm.value.otpMethod === 'email'
  //         ? this.forgotPasswordForm.value.email
  //         : '',
  //     phoneNumber:
  //       this.forgotPasswordForm.value.otpMethod === 'phone'
  //         ? this.forgotPasswordForm.value.phone
  //         : '',
  //   };

  //   this.verifyingOtp = true;

  //   this.authService.verifyOTP(payload).subscribe({
  //     next: () => {
  //       this.verifyingOtp = false;
  //       this.currentStep = 6;
  //     },
  //     error: () => {
  //       this.verifyingOtp = false;
  //     },
  //   });
  // }

  // /* =========================
  //    COUNTDOWN
  // ========================= */
  // startCountdown(): void {
  //   this.countdown = 120;
  //   clearInterval(this.countdownInterval);

  //   this.countdownInterval = setInterval(() => {
  //     this.countdown--;
  //     if (this.countdown <= 0) clearInterval(this.countdownInterval);
  //   }, 1000);
  // }

  // resetOtp(): void {
  //   this.otpValues = Array(6).fill('');
  //   this.forgotPasswordForm.patchValue({ otp: '' });
  // }

  /* =========================
     NAVIGATION
  ========================= */
  goBack(): void {
    if (this.currentStep > 3) {
      this.currentStep--;
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  /* =========================
     DESTROY
  ========================= */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    clearInterval(this.countdownInterval);
  }
}
