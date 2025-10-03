import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scouter',
  templateUrl: './scouter.page.html',
  styleUrls: ['./scouter.page.scss'],
  standalone: false,
})
export class ScouterPage implements OnInit {
  currentStep = 0; // 0 = Scouter Details, 1 = Info, 2 = Credentials, 3 = Verify
  steps = [
    'Scouter Details',
    'Scouter Information',
    'Login Credentials',
    'Verify Scouter',
  ];
  organizationTypes: string[] = [
    'Individual',
    'Corporate',
    'Small Business',
    'NGO',
    'Startup',
    'Government',
  ];

  // User’s chosen organisation (single value)
  organisation: string | null = null;

  selectedOrganisation: string | null = null;
  isOrganisationDropdownOpen = false;

  forms: FormGroup[] = [];
  otpControls: FormControl[] = [];
  countdown = 30; // seconds
  timer: any;

  constructor(
    private location: Location,
    private fb: FormBuilder,
    private router: Router
  ) {}

  toggleOrganisationDropdown() {
    this.isOrganisationDropdownOpen = !this.isOrganisationDropdownOpen;
  }

  selectOrganisation(organisation: string) {
    this.forms[1].get('organisation')?.setValue(organisation); // sync to form
    this.isOrganisationDropdownOpen = false;
  }

  selectedOrgTypes: string[] = [];

  ngOnInit() {
    // Step 1 form
    this.forms[0] = this.fb.group({
      fullname: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
      email: ['', [Validators.required, Validators.email]],
    });

    // Step 2 form (placeholder example)
    this.forms[1] = this.fb.group({
      location: ['', Validators.required],
      organisation: [null, Validators.required],
      purpose: ['', Validators.required],
      payRange: ['', [Validators.required, Validators.min(1)]],
    });

    // Step 3 form (credentials)
    this.forms[2] = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    });

    // Step 4 (OTP with 4 inputs)
    this.otpControls = Array.from({ length: 4 }, () =>
      this.fb.control('', Validators.required)
    );
    this.forms[3] = this.fb.group({
      otp: this.fb.array(this.otpControls),
    });

    // Start countdown
    this.startCountdown();
  }

  get otpFormArray(): FormArray {
    return this.forms[3].get('otp') as FormArray;
  }

  onOtpInput(event: any, index: number) {
    const input = event.target;
    if (input.value && index < this.otpControls.length - 1) {
      input.parentElement.querySelectorAll('input')[index + 1].focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (
      event.key === 'Backspace' &&
      !this.otpControls[index].value &&
      index > 0
    ) {
      (event.target as HTMLInputElement).parentElement
        ?.querySelectorAll('input')
        [index - 1].focus();
    }
  }

  getOtpValue(): string {
    return this.otpControls.map((c) => c.value).join('');
  }

  startCountdown() {
    this.countdown = 30;
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  resendOtp() {
    // Call backend to resend OTP
    console.log('Resending OTP...');
    this.startCountdown();
  }

  goToDashboard() {
    const otpValue = this.getOtpValue();
    console.log('Entered OTP:', otpValue);

    if (this.forms[3].valid) {
      this.router.navigate(['scouter/dashboard']); // adjust route
    } else {
      this.forms[3].markAllAsTouched();
    }
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  // Navigation logic
  goNext() {
    if (this.forms[this.currentStep].valid) {
      this.currentStep++;
    } else {
      this.forms[this.currentStep].markAllAsTouched();
    }
  }

  goPrevious() {
    if (this.currentStep > 0) this.currentStep--;
  }

  isCurrentFormValid(): boolean {
    return this.forms[this.currentStep]?.valid || false;
  }

  getProgressWidth(): string {
    return `${((this.currentStep + 1) / this.steps.length) * 100}%`;
  }
}
