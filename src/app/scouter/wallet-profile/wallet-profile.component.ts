import { Component, OnInit, HostListener } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {
  title,
  gender,
  maritalStatus,
  countries,
  banks,
} from 'src/app/models/mocks';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-wallet-profile',
  templateUrl: './wallet-profile.component.html',
  styleUrls: ['./wallet-profile.component.scss'],
  standalone: false,
})
export class WalletProfileComponent implements OnInit {
  images = imageIcons;
  dob: string = '';
  dobFormatted: string = '';

  isFormLocked = false; // default unlocked until first save
  isOtpStep = false; // control OTP screen

  title = title;
  gender = gender;
  maritalStatus = maritalStatus;
  countries = countries;
  banks = banks;

  savingsAcc: string = '';
  savingsAccError: string = '';

  role = 'Scouter';

  otp: string[] = ['', '', '', '', '', '']; // change to 4
  otpArray = new Array(4);

  countdown = 60;

  fullName = '';
  email = '';
  bvn = '';
  nin = '';
  number = '';


  filteredTitle: string[] = [];
  filteredGender: string[] = [];
  filteredMaritalStatus: string[] = [];
  filteredCountries: string[] = [];
  filteredBanks: string[] = [];

  selectedTitle: string = '';
  selectedGender: string = '';
  selectedMaritalStatus: string = '';
  selectedCountry: string = '';
  selectedBank: string = '';

  showTitleDropdown = false;
  showGenderDropdown = false;
  showMaritalStatusDropdown = false;
  showCountryDropdown = false;
  showBankDropdown = false;

  constructor(private location: Location) {}

  triggerOtpStep() {
    this.isOtpStep = true;
    this.startCountdown();
  }

  startCountdown() {
    this.countdown = 60;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown === 0) clearInterval(interval);
    }, 1000);
  }

  verifyOtp() {
    const enteredOtp = this.otp.join('');
    if (enteredOtp === '1234') {
      // Replace with backend check
      this.isFormLocked = false;
      this.isOtpStep = false;
      this.otp = ['', '', '', '', '', ''];
    } else {
      alert('Invalid OTP, try again!');
    }
  }

  bvnCtrl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/),
  ]);

  ninCtrl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/),
  ]);
  numberCtrl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[0-9]{11}$/),
  ]);

  moveToNext(event: any, index: number) {
    const input = event.target as HTMLInputElement;

    if (input.value && index < this.otpArray.length - 1) {
      const nextInput = input.parentElement?.querySelectorAll('input')[
        index + 1
      ] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }

    if (
      !input.value &&
      index > 0 &&
      event.inputType === 'deleteContentBackward'
    ) {
      const prevInput = input.parentElement?.querySelectorAll('input')[
        index - 1
      ] as HTMLInputElement;
      if (prevInput) prevInput.focus();
    }
  }

  ngOnInit() {
    this.filteredTitle = [...this.title];
    this.filteredGender = [...this.gender];
    this.filteredMaritalStatus = [...this.maritalStatus];
    this.filteredCountries = [...this.countries];
    this.filteredBanks = [...this.banks];
  }

  onBvnInput(event: any) {
    let value = event.target.value;
    // Allow only numbers, max 11 digits
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.bvn = value;
  }

  onNinInput(event: any) {
    let value = event.target.value;
    // Allow only numbers, max 11 digits
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.nin = value;
  }
  onNumberInput(event: any) {
    let value = event.target.value;
    // Allow only numbers, max 11 digits
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.number = value;
  }

  validateSavingsAcc() {
    if (!this.savingsAcc) {
      this.savingsAccError = 'Account number is required.';
      return false;
    }
    if (!/^[0-9]{10}$/.test(this.savingsAcc)) {
      this.savingsAccError = 'Account number must be exactly 10 digits.';
      return false;
    }
    this.savingsAccError = '';
    return true;
  }

  onSavingsAccInput(event: any) {
    let value = event.target.value;
    // Allow only numbers, max 10 digits
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
    this.savingsAcc = value;
  }

  filterTitle(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredTitle = this.title.filter((t) =>
      t.toLowerCase().includes(query)
    );
  }

  onSubmit(form: any) {
    const isSavingsValid = this.validateSavingsAcc();

    if (form.valid && isSavingsValid) {
      console.log('Form Data:', form.value);

      // 🚀 Lock form after successful save
      this.isFormLocked = true;

      // Later call API to save data
    }
  }

  filterGender(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredGender = this.gender.filter((g) =>
      g.toLowerCase().includes(query)
    );
  }
  filterMaritalStatus(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredMaritalStatus = this.maritalStatus.filter((m) =>
      m.toLowerCase().includes(query)
    );
  }

  filterCountries(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter((c) =>
      c.toLowerCase().includes(query)
    );
  }

  filterBanks(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredBanks = this.banks.filter((b) =>
      b.toLowerCase().includes(query)
    );
  }

  selectTitle(title: string) {
    this.selectedTitle = title;
    this.showTitleDropdown = false;
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
    this.showGenderDropdown = false;
  }

  selectMaritalStatus(maritalStatus: string) {
    this.selectedMaritalStatus = maritalStatus;
    this.showMaritalStatusDropdown = false;
  }

  selectCountry(country: string) {
    this.selectedCountry = country;
    this.showCountryDropdown = false;
  }

  selectBank(bank: string) {
    this.selectedBank = bank;
    this.showBankDropdown = false;
  }

  formatDob() {
    if (!this.dob) return;
    const date = new Date(this.dob);
    this.dobFormatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // 👇 Close dropdowns on outside click
  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-title')) {
      this.showTitleDropdown = false;
    }
    if (!target.closest('.dropdown-gender')) {
      this.showGenderDropdown = false;
    }
    if (!target.closest('.dropdown-maritalStatus')) {
      this.showMaritalStatusDropdown = false;
    }
    if (!target.closest('.dropdown-country')) {
      this.showCountryDropdown = false;
    }
    if (!target.closest('.dropdown-bank')) {
      this.showBankDropdown = false;
    }
  }

  goBack() {
    this.location.back();
  }
}
