import { Component, OnInit, HostListener } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { title, gender, maritalStatus } from 'src/app/models/mocks';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { EndpointService } from 'src/app/services/endpoint.service';
import { LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { ToastsService } from 'src/app/services/toasts.service';

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

  userName: string = '';

  isFormLocked = false;
  isOtpStep = false;
  isLoading = false;

  bvnDateOfBirth: string = '';

  // Profile type - initialize as null to show empty state
  profileType: 'business' | 'individual' | null = null;

  // Individual form data
  title = title;
  gender = gender;
  maritalStatus = maritalStatus;

  // Add these properties to your component
  otp: string = '';
  otpSent: boolean = false;
  otpVerifying: boolean = false;
  otpVerified: boolean = false;
  bvnSessionId: string = '';
  maskedPhoneNumber: string = '';
  otpError: string = '';

  // API loaded data
  banks: string[] = [];
  countries: any[] = [];
  allCountries: any[] = [];
  nigerianBanks: any[] = [];

  // Bank code mapping from API data
  private bankCodeMap: { [key: string]: string } = {};

  // Add these properties to store BVN and NIN names
  bvnFirstName: string = '';
  bvnMiddleName: string = '';
  bvnLastName: string = '';
  bvnFullName: string = '';

  ninFirstName: string = '';
  ninMiddleName: string = '';
  ninLastName: string = '';
  ninFullName: string = '';

  // Add these properties to store account names
  accountName: string = '';
  businessAccountName: string = '';

  savingsAcc: string = '';
  savingsAccError: string = '';

  role = 'scouter';

  // otp: string[] = ['', '', '', '', '', ''];
  // otpArray = new Array(4);

  countdown = 60;

  fullName = '';
  email = '';
  bvn = '';
  nin = '';
  number = '';
  occupation = '';

  // Verification states
  bvnVerified: boolean | null = null;
  bvnVerifying: boolean = false;
  ninVerified: boolean | null = null;
  ninVerifying: boolean = false;
  acctVerified: boolean | null = null;
  acctVerifying: boolean = false;
  rcVerified: boolean | null = null;
  rcVerifying: boolean = false;

  // Add these properties for business account verification
  businessAcctVerified: boolean | null = null;
  businessAcctVerifying: boolean = false;
  businessAcctError: string = '';

  // debounce timers
  private businessAcctTimer: any = null;

  private bvnTimer: any = null;
  private ninTimer: any = null;
  private acctTimer: any = null;
  private rcTimer: any = null;

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

  // Business form data
  businessData = {
    rcNumber: '',
    companyName: '',
    natureOfBusiness: '',
    country: '',
    bankName: '',
    companyEmail: '',
    accountNumber: '',
    companyPhone: '',
    cacCertificate: null as File | null,
    incorporationDate: '',
    cacRegCertificate: '',
    incorporationDateFormatted: '',
  };

  // Form controls
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

  ninDateOfBirth: string = '';

  constructor(
    private location: Location,
    private endpointService: EndpointService,
    private loadingController: LoadingController,
    private toastService: ToastsService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  // ==================== INITIALIZATION ====================
  async ngOnInit() {
    this.filteredTitle = [...this.title];
    this.filteredGender = [...this.gender];
    this.filteredMaritalStatus = [...this.maritalStatus];

    // Load data from APIs
    await this.loadBanksAndCountries();

    // Auto-populate user data
    this.initializeUserData();
  }

  // ==================== API DATA LOADING ====================
  private async loadBanksAndCountries(): Promise<void> {
    // const loading = await this.showLoading('Loading banks and countries...');

    let banksLoaded = false;
    let countriesLoaded = false;

    try {
      // Load banks with individual error handling
      try {
        console.log('🏦 Starting banks load...');
        const banksData = await this.endpointService
          .getNigerianBanks()
          .toPromise();

        console.log('🏦 Banks data received:', banksData);

        if (banksData && Array.isArray(banksData)) {
          this.nigerianBanks = banksData;
          this.banks = this.nigerianBanks
            .map((bank) => bank.bankName)
            .filter((name) => name && typeof name === 'string')
            .sort();
          this.filteredBanks = [...this.banks];

          // Create bank code mapping
          this.nigerianBanks.forEach((bank) => {
            if (bank.bankName && bank.cbnCode) {
              this.bankCodeMap[bank.bankName.toLowerCase()] = bank.cbnCode;
            } else if (bank.bankName && bank.bankCode) {
              this.bankCodeMap[bank.bankName.toLowerCase()] = bank.bankCode;
            }
          });

          console.log('✅ Loaded banks:', this.banks.length, 'banks');
          console.log('🏦 Sample banks:', this.banks.slice(0, 3));
          banksLoaded = true;
        } else {
          console.warn('🏦 Invalid banks data structure:', banksData);
          throw new Error('Invalid banks data');
        }
      } catch (banksError) {
        console.error('❌ Failed to load banks:', banksError);
        this.banks = [
          'Access Bank',
          'Zenith Bank',
          'First Bank',
          'GT Bank',
          'UBA',
        ];
        this.filteredBanks = [...this.banks];
        banksLoaded = true; // Mark as loaded since we have fallback
      }

      // Load countries with individual error handling
      try {
        console.log('🌍 Starting countries load...');
        const countriesData = await this.endpointService
          .getAllCountries()
          .toPromise();

        console.log('🌍 Countries data received:', countriesData);

        if (countriesData && Array.isArray(countriesData)) {
          this.allCountries = countriesData;

          // Extract just country names for the dropdown display and filtering
          this.countries = this.allCountries
            .map((country) => country.countryName) // Use countryName from API
            .filter((name) => name && typeof name === 'string')
            .sort();

          this.filteredCountries = [...this.countries];

          console.log(
            '✅ Loaded countries:',
            this.countries.length,
            'countries'
          );
          console.log(
            '🌍 Sample countries with flags:',
            this.allCountries.slice(0, 3)
          );
          console.log('🌍 Country names:', this.countries.slice(0, 5));
          countriesLoaded = true;
        } else {
          console.warn('🌍 Invalid countries data structure:', countriesData);
          throw new Error('Invalid countries data');
        }
      } catch (countriesError) {
        console.error('❌ Failed to load countries:', countriesError);
        // Use fallback that includes flags
        this.allCountries = this.getFallbackCountries();
        this.countries = this.allCountries.map(
          (country) => country.countryName
        );
        this.filteredCountries = [...this.countries];
        countriesLoaded = true;
      }
      // Show appropriate toast messages
      if (!banksLoaded && !countriesLoaded) {
        this.toastService.openSnackBar(
          'Failed to load banks and countries. Using fallback data.',
          'warning'
        );
      } else if (!banksLoaded) {
        this.toastService.openSnackBar(
          'Failed to load banks. Using fallback data.',
          'warning'
        );
      } else if (!countriesLoaded) {
        this.toastService.openSnackBar(
          'Failed to load countries. Using fallback data.',
          'warning'
        );
      } else {
        console.log('✅ Successfully loaded all data');
        console.log('🏦 Final banks list:', this.banks.length);
        console.log('🌍 Final countries list:', this.countries.length);
      }
    } catch (error) {
      console.error('❌ Unexpected error in loadBanksAndCountries:', error);
      this.toastService.openSnackBar(
        'Unexpected error loading data. Using fallback options.',
        'warning'
      );
    } finally {
      // await loading.dismiss();
    }
  }

  // Helper method to get country flag by country name
  getCountryFlag(countryName: string): string {
    if (!countryName || !this.allCountries.length) return '';

    const country = this.allCountries.find(
      (c) => c.countryName === countryName || c.name === countryName
    );

    return country?.countryFlag || country?.flag || '';
  }

  // Helper method to get full country object by name
  getCountryObject(countryName: string): any {
    if (!countryName || !this.allCountries.length) return null;

    return this.allCountries.find(
      (c) => c.countryName === countryName || c.name === countryName
    );
  }

  // Update the fallback countries to match API structure
  private getFallbackCountries(): any[] {
    return [
      {
        id: 1,
        countryName: 'Nigeria',
        name: 'Nigeria',
        isoCode: 'NG',
        countryFlag: 'https://flagsapi.com/NG/shiny/64.png',
        code: 'NG',
      },
      {
        id: 2,
        countryName: 'Ghana',
        name: 'Ghana',
        isoCode: 'GH',
        countryFlag: 'https://flagsapi.com/GH/shiny/64.png',
        code: 'GH',
      },
      {
        id: 3,
        countryName: 'Kenya',
        name: 'Kenya',
        isoCode: 'KE',
        countryFlag: 'https://flagsapi.com/KE/shiny/64.png',
        code: 'KE',
      },
      {
        id: 4,
        countryName: 'South Africa',
        name: 'South Africa',
        isoCode: 'ZA',
        countryFlag: 'https://flagsapi.com/ZA/shiny/64.png',
        code: 'ZA',
      },
      {
        id: 5,
        countryName: 'United Kingdom',
        name: 'United Kingdom',
        isoCode: 'GB',
        countryFlag: 'https://flagsapi.com/GB/shiny/64.png',
        code: 'GB',
      },
      {
        id: 6,
        countryName: 'United States',
        name: 'United States',
        isoCode: 'US',
        countryFlag: 'https://flagsapi.com/US/shiny/64.png',
        code: 'US',
      },
    ];
  }

  // ==================== SEPARATE VERIFICATION METHODS ====================

  initiateBVNVerification(): void {
    if (!this.bvn || this.bvn.length !== 11) return;

    // Get phone number from user profile
    const phoneNumber = this.number;
    if (!phoneNumber || phoneNumber.length !== 11) {
      this.toastService.openSnackBar(
        'Phone number is required for BVN verification. Please ensure your profile has a valid phone number.',
        'error'
      );
      return;
    }

    this.bvnVerifying = true;
    this.otpSent = false;
    this.otpVerified = false;

    // Mask the phone number for display (shows last 4 digits)
    this.maskedPhoneNumber = this.maskPhoneNumber(phoneNumber);

    this.endpointService.verifyBVNWithPhone(this.bvn, phoneNumber).subscribe({
      next: (res: any) => {
        console.log('BVN OTP Initiation Success:', res);
        this.bvnVerifying = false;

        // FIX: Check for success based on API response
        if (
          res.success === true &&
          res.message &&
          res.message.includes('OTP')
        ) {
          this.otpSent = true;
          this.bvnSessionId = res.sessionId || res.data?.sessionId;

          // Extract phone number from message for display
          const phoneInMessage = this.extractPhoneFromMessage(res.message);
          if (phoneInMessage) {
            this.maskedPhoneNumber = this.maskPhoneNumber(phoneInMessage);
          }

          this.toastService.openSnackBar(
            res.message ||
              `OTP sent to the phone number registered with your BVN: ${this.maskedPhoneNumber}`,
            'success'
          );

          // Focus on OTP input
          setTimeout(() => {
            const otpInput = document.querySelector(
              'input[name="otp"]'
            ) as HTMLInputElement;
            if (otpInput) {
              otpInput.focus();
            }
          }, 100);
        } else {
          console.warn('Unexpected response:', res);
          this.bvnVerified = false;
          this.toastService.openSnackBar(
            res.message || 'Failed to send OTP. Please try again.',
            'error'
          );
        }
      },
      error: (err: any) => {
        console.error('BVN OTP initiation error:', err);
        this.bvnVerifying = false;
        this.bvnVerified = false;

        const errorMsg =
          err?.userMessage || err?.message || 'Failed to send OTP';
        this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
      },
    });
  }

  // Add this helper method to extract phone from message
  private extractPhoneFromMessage(message: string): string {
    if (!message) return '';

    // Extract phone number from message like "OTP sent to 08083826576"
    const phoneMatch = message.match(/\d{10,}/);
    return phoneMatch ? phoneMatch[0] : '';
  }

  private autoPopulateDateOfBirth(): void {
    // Priority: 1. BVN DOB, 2. NIN DOB, 3. Existing DOB from user data
    if (!this.dob) {
      let dateToUse = '';

      if (this.bvnVerified && this.bvnDateOfBirth) {
        dateToUse = this.bvnDateOfBirth;
        console.log('Using date of birth from BVN verification');
      } else if (this.ninVerified && this.ninDateOfBirth) {
        dateToUse = this.ninDateOfBirth;
        console.log('Using date of birth from NIN verification');
      }

      if (dateToUse) {
        this.dob = this.formatDateForInput(dateToUse);
        this.formatDob();
        console.log('✅ Date of birth auto-populated:', this.dob);
      }
    }
  }

  // Method to verify OTP
  verifyOTP(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.otpError = 'OTP must be 6 digits';
      return;
    }

    if (!this.bvnSessionId) {
      this.otpError = 'Session expired. Please re-enter your BVN.';
      return;
    }

    this.otpVerifying = true;
    this.otpError = '';

    this.endpointService.verifyBVNOTP(this.bvnSessionId, this.otp).subscribe({
      next: (res: any) => {
        this.otpVerifying = false;

        if (res.success === true || res.statusCode === 200) {
          this.otpVerified = true;
          this.bvnVerified = true;

          // Extract name data from BVN details
          const bvnDetails = res.bvnDetails || res.data || res;
          this.bvnFirstName =
            bvnDetails?.firstName || bvnDetails?.firstname || '';
          this.bvnMiddleName =
            bvnDetails?.middleName || bvnDetails?.middlename || '';
          this.bvnLastName = bvnDetails?.lastName || bvnDetails?.lastname || '';

          // Construct full name
          this.bvnFullName = [
            this.bvnFirstName,
            this.bvnMiddleName,
            this.bvnLastName,
          ]
            .filter((name) => name && name.trim())
            .join(' ');

          // ✅ Extract and store date of birth from BVN response
          this.bvnDateOfBirth = this.extractDateOfBirthFromBVNResponse(res);

          // Auto-populate date of birth
          this.autoPopulateDateOfBirth();

          // Priority: BVN DOB > NIN DOB > existing DOB
          if (this.bvnDateOfBirth && !this.dob) {
            this.dob = this.formatDateForInput(this.bvnDateOfBirth);
            this.formatDob();
            console.log('✅ Date of birth auto-populated from BVN:', this.dob);
          } else if (!this.dob && this.ninDateOfBirth) {
            // If no DOB from BVN but we have from NIN
            this.dob = this.formatDateForInput(this.ninDateOfBirth);
            this.formatDob();
            console.log(
              '✅ Date of birth auto-populated from NIN (fallback):',
              this.dob
            );
          }

          const successMessage = this.bvnFullName
            ? `✅ BVN has been verified successfully! for ${this.bvnFullName}`
            : '✅ BVN verified successfully';

          this.toastService.openSnackBar(successMessage, 'success');

          // Clear OTP after successful verification
          setTimeout(() => {
            this.otp = '';
          }, 1000);
        } else {
          this.otpVerified = false;
          this.otpError = res.message || 'Invalid OTP. Please try again.';
          this.toastService.openSnackBar(`❌ ${this.otpError}`, 'error');
        }
      },
      error: (err: any) => {
        console.error('OTP verification error:', err);
        this.otpVerifying = false;
        this.otpVerified = false;
        this.otpError =
          err?.userMessage || err?.message || 'OTP verification failed';

        const errorMsg =
          err?.userMessage || err?.message || 'OTP verification failed';
        this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
      },
    });
  }

  // OTP input handler with auto-verification
  onOtpInput(event: any): void {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 6);
    this.otp = value;
    this.otpError = '';

    // Auto-verify when 6 digits are entered
    if (value.length === 6 && this.otpSent && !this.otpVerified) {
      this.verifyOTP();
    }
  }

  // Helper method to mask phone number
  private maskPhoneNumber(phoneNumber: string): string {
    if (!phoneNumber || phoneNumber.length < 5) return phoneNumber;

    const visibleDigits = 5;
    const maskedPart = '*******';
    const lastDigits = phoneNumber.slice(-visibleDigits);

    return `${maskedPart}${lastDigits}`;
  }

  private verifyNIN(): void {
    if (!this.nin || this.nin.length !== 11) return;

    this.ninVerifying = true;
    this.ninVerified = null;
    this.ninFirstName = '';
    this.ninMiddleName = '';
    this.ninLastName = '';
    this.ninFullName = '';
    this.ninDateOfBirth = '';

    this.endpointService.validateNIN(this.nin).subscribe({
      next: (res: any) => {
        this.ninVerifying = false;
        console.log('NIN Verification Raw Response:', res);

        // Check for success based on actual API response structure
        if (res && (res.success === true || res.statusCode === 200)) {
          this.ninVerified = true;

          // Extract name data from response
          this.ninFirstName = res.data?.firstName || res.data?.firstname || '';
          this.ninMiddleName =
            res.data?.middleName || res.data?.middlename || '';
          this.ninLastName = res.data?.lastName || res.data?.lastname || '';

          // Construct full name
          this.ninFullName = [
            this.ninFirstName,
            this.ninMiddleName,
            this.ninLastName,
          ]
            .filter((name) => name && name.trim())
            .join(' ');

          // ✅ Store date of birth from NIN response
          this.ninDateOfBirth = this.extractDateOfBirthFromNINResponse(res);

          // Auto-populate date of birth if not already set
          if (this.ninDateOfBirth && !this.dob) {
            // Format the date for HTML input (YYYY-MM-DD)
            const formattedDate = this.formatDateForInput(this.ninDateOfBirth);

            // Validate the formatted date
            if (this.isValidDateForInput(formattedDate)) {
              this.dob = formattedDate;
              this.formatDob();
              console.log(
                '✅ Date of birth auto-populated from NIN:',
                this.dob
              );
            } else {
              console.warn(
                '⚠️ Invalid date format from NIN:',
                this.ninDateOfBirth
              );
              this.toastService.openSnackBar(
                'Date of birth from NIN is in an unexpected format. Please enter it manually.',
                'warning'
              );
            }
          }

          const successMessage = this.ninFullName
            ? `✅ NIN has been verified successfully! for ${this.ninFullName}`
            : '✅ NIN verified successfully';

          this.toastService.openSnackBar(successMessage, 'success');
        } else {
          this.ninVerified = false;
          console.warn('NIN verification failed - unexpected response:', res);
          this.toastService.openSnackBar('❌ NIN verification failed', 'error');
        }
      },
      error: (err: any) => {
        console.error('NIN verification error:', err);
        this.ninVerifying = false;
        this.ninVerified = false;

        const errorMsg =
          err?.userMessage || err?.message || 'NIN verification failed';
        this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
      },
    });
  }

  // Add this utility method to validate if date is in correct format for HTML date input
  private isValidDateForInput(dateString: string): boolean {
    if (!dateString) return false;

    // Check if date is in YYYY-MM-DD format
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    // Validate the actual date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  //  NEW METHOD: Extract date of birth specifically from NIN response
  private extractDateOfBirthFromNINResponse(response: any): string {
    if (!response) return '';

    // Check for date of birth in different NIN response structures
    const ninData = response.data || response;

    const dateOfBirth =
      ninData.birthDate ||
      ninData.dateOfBirth ||
      ninData.dob ||
      response.birthDate;

    console.log('🎂 Extracted date of birth from NIN:', dateOfBirth);

    if (dateOfBirth) {
      // Normalize the date to YYYY-MM-DD format
      return this.normalizeDate(dateOfBirth);
    }

    return '';
  }

  //  NEW METHOD: Extract date of birth from BVN response
  private extractDateOfBirthFromBVNResponse(response: any): string {
    if (!response) return '';

    const bvnDetails = response.bvnDetails || response.data || response;

    const dateOfBirth =
      bvnDetails.dateOfBirth ||
      bvnDetails.dob ||
      bvnDetails.birthDate ||
      bvnDetails.date_of_birth;

    console.log('🎂 Extracted date of birth from BVN:', dateOfBirth);

    // Format the date if needed
    if (dateOfBirth) {
      // Handle different date formats
      return this.normalizeDate(dateOfBirth);
    }

    return '';
  }

  //  HELPER METHOD: Normalize date from different formats
  private normalizeDate(dateString: string): string {
    if (!dateString) return '';

    console.log('🔄 Normalizing date:', dateString);

    try {
      // Handle format "17-04-2002" (DD-MM-YYYY)
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');

        // Check if first part is day (2 digits) - DD-MM-YYYY format
        if (
          parts[0].length === 2 &&
          parts[1].length === 2 &&
          parts[2].length === 4
        ) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          console.log('✅ Normalized DD-MM-YYYY to:', formatted);
          return formatted;
        }

        // Check if first part is year (4 digits) - YYYY-MM-DD format
        if (
          parts[0].length === 4 &&
          parts[1].length === 2 &&
          parts[2].length === 2
        ) {
          // Already in YYYY-MM-DD format
          console.log('✅ Already YYYY-MM-DD format:', dateString);
          return dateString;
        }
      }

      // Handle format with slashes "17/04/2002" (DD/MM/YYYY)
      if (dateString.includes('/') && dateString.split('/').length === 3) {
        const parts = dateString.split('/');

        if (
          parts[0].length === 2 &&
          parts[1].length === 2 &&
          parts[2].length === 4
        ) {
          // Convert DD/MM/YYYY to YYYY-MM-DD
          const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          console.log('✅ Normalized DD/MM/YYYY to:', formatted);
          return formatted;
        }
      }

      // Handle ISO format
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('✅ Normalized ISO date to:', formatted);
        return formatted;
      }

      console.warn('⚠️ Could not normalize date:', dateString);
      return dateString;
    } catch (error) {
      console.error('❌ Error normalizing date:', error, 'Input:', dateString);
      return dateString;
    }
  }

  private extractDateOfBirthFromResponse(response: any): string {
    // Determine which type of response this is and use appropriate method
    if (response?.data?.nin || response?.nin) {
      return this.extractDateOfBirthFromNINResponse(response);
    } else if (response?.bvnDetails || response?.data?.bvn) {
      return this.extractDateOfBirthFromBVNResponse(response);
    }

    // Fallback to generic extraction
    const dateOfBirth =
      response?.data?.dateOfBirth ||
      response?.data?.dob ||
      response?.data?.birthDate ||
      response?.dateOfBirth ||
      response?.dob ||
      response?.birthDate;

    return dateOfBirth || '';
  }

  private verifyAccount(): void {
    // Don't proceed if no bank is selected
    if (!this.selectedBank) {
      this.acctVerified = false;
      this.toastService.openSnackBar(
        'Please select a bank first to verify account',
        'warning'
      );
      return;
    }

    if (!this.savingsAcc || this.savingsAcc.length !== 10 || !this.selectedBank)
      return;

    const bankCode = this.getBankCode(this.selectedBank);
    if (!bankCode) {
      this.acctVerified = false;
      this.toastService.openSnackBar(
        '❌ Could not find bank code for selected bank',
        'error'
      );
      return;
    }

    this.acctVerifying = true;
    this.acctVerified = null;
    this.accountName = ''; // Reset account name

    const payload = {
      bankCode: bankCode,
      bankName: this.selectedBank,
      bankAccountNo: this.savingsAcc,
    };

    this.endpointService.verifyAccountNumber(payload).subscribe({
      next: (res: any) => {
        this.acctVerifying = false;

        if (res.success === true || res.accountName || res.data?.accountName) {
          this.acctVerified = true;
          // Extract account name from response
          this.accountName = res.data?.accountName || res.accountName || '';

          const successMessage = this.accountName
            ? `✅ Account verified successfully! Account Name: ${this.accountName}`
            : '✅ Account verified successfully';

          this.toastService.openSnackBar(successMessage, 'success');
        } else {
          this.acctVerified = false;
          this.accountName = '';
          this.toastService.openSnackBar(
            '❌ Account verification failed',
            'error'
          );
        }
      },
      error: (err: any) => {
        console.error('Account verification error:', err);
        this.acctVerifying = false;
        this.acctVerified = false;
        this.accountName = '';

        const errorMsg =
          err?.userMessage || err?.message || 'Account verification failed';
        this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
      },
    });
  }

  private verifyBusinessAccount(): void {
    // Don't proceed if no bank is selected
    if (!this.businessData.bankName) {
      this.businessAcctVerified = false;
      this.businessAcctError = 'Please select a bank first to verify account';
      this.toastService.openSnackBar(
        'Please select a bank first to verify account',
        'warning'
      );
      return;
    }

    if (
      !this.businessData.accountNumber ||
      this.businessData.accountNumber.length !== 10 ||
      !this.businessData.bankName
    )
      return;

    const bankCode = this.getBankCode(this.businessData.bankName);
    if (!bankCode) {
      this.businessAcctVerified = false;
      this.businessAcctError = 'Could not find bank code for selected bank';
      this.toastService.openSnackBar(
        '❌ Could not find bank code for selected bank',
        'error'
      );
      return;
    }

    this.businessAcctVerifying = true;
    this.businessAcctVerified = null;
    this.businessAcctError = '';
    this.businessAccountName = ''; // Reset business account name

    const payload = {
      bankCode: bankCode,
      bankName: this.businessData.bankName,
      bankAccountNo: this.businessData.accountNumber,
    };

    this.endpointService.verifyAccountNumber(payload).subscribe({
      next: (res: any) => {
        this.businessAcctVerifying = false;

        if (res.success === true || res.accountName || res.data?.accountName) {
          this.businessAcctVerified = true;
          // Extract account name from response
          this.businessAccountName =
            res.data?.accountName || res.accountName || '';

          const successMessage = this.businessAccountName
            ? `✅ Business account verified successfully! Account Name: ${this.businessAccountName}`
            : '✅ Business account verified successfully';

          this.toastService.openSnackBar(successMessage, 'success');
        } else {
          this.businessAcctVerified = false;
          this.businessAccountName = '';
          this.businessAcctError = 'Account verification failed';
          this.toastService.openSnackBar(
            '❌ Business account verification failed',
            'error'
          );
        }
      },
      error: (err: any) => {
        console.error('Business account verification error:', err);
        this.businessAcctVerifying = false;
        this.businessAcctVerified = false;
        this.businessAccountName = '';
        this.businessAcctError = 'Account verification failed';

        const errorMsg =
          err?.userMessage ||
          err?.message ||
          'Business account verification failed';
        this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
      },
    });
  }

  validateBusinessAccount() {
    if (!this.businessData.bankName) {
      this.businessAcctError = 'Please select a bank first.';
      return false;
    }

    if (!this.businessData.accountNumber) {
      this.businessAcctError = 'Account number is required.';
      return false;
    }

    if (!/^[0-9]{10}$/.test(this.businessData.accountNumber)) {
      this.businessAcctError = 'Account number must be exactly 10 digits.';
      return false;
    }

    this.businessAcctError = '';
    return true;
  }

  private verifyRCNumber(): void {
    if (
      !this.businessData.rcNumber ||
      this.businessData.rcNumber.trim().length < 3
    )
      return;

    this.rcVerifying = true;
    this.rcVerified = null;

    const verifyPayload = {
      SearchType: 'ALL',
      searchTerm: this.businessData.rcNumber,
    };

    console.log(
      '🔍 Calling business verification with payload:',
      verifyPayload
    );

    this.endpointService.verifyBusiness(verifyPayload).subscribe({
      next: (res: any) => {
        this.rcVerifying = false;
        console.log('✅ RC Verification Response:', res);

        // Check for success based on the actual API response structure
        // Your API returns: {message: 'Successful Business Verification', statusCode: 200, data: {...}}
        if (
          res &&
          (res.statusCode === 200 || res.statusCode === 201) &&
          res.message === 'Successful Business Verification'
        ) {
          this.rcVerified = true;

          // ✅ EXTRACT AND BIND BUSINESS NAME (approvedName)
          if (res.data && res.data.approvedName) {
            this.businessData.companyName = res.data.approvedName;
            console.log(
              '✅ Business name extracted and bound:',
              this.businessData.companyName
            );
          }

          // ✅ EXTRACT AND BIND INCORPORATION DATE (companyRegistrationDate)
          if (res.data && res.data.companyRegistrationDate) {
            const rawDate = res.data.companyRegistrationDate;
            this.businessData.incorporationDate =
              this.formatDateForInput(rawDate);
            console.log(
              '✅ Incorporation date extracted and bound:',
              this.businessData.incorporationDate
            );
          }

          // ✅ EXTRACT NATURE OF BUSINESS
          if (
            res.data &&
            res.data.natureOfBusiness &&
            res.data.natureOfBusiness !== 'N/A'
          ) {
            this.businessData.natureOfBusiness = res.data.natureOfBusiness;
            console.log(
              '✅ Nature of business extracted:',
              this.businessData.natureOfBusiness
            );
          }

          this.toastService.openSnackBar(
            '✅ RC number verified successfully',
            'success'
          );
        } else {
          this.rcVerified = false;
          console.warn('Unexpected response structure:', res);
          this.toastService.openSnackBar(
            '❌ Invalid RC number or unexpected response',
            'error'
          );
        }
      },
      error: (err: any) => {
        console.error('❌ RC Number verification error:', err);
        this.rcVerifying = false;
        this.rcVerified = false;

        // Handle 404 specifically
        if (err.status === 404) {
          console.warn('⚠️ Business verification endpoint returned 404');
          // Try alternative endpoint or show specific message
          this.toastService.openSnackBar(
            '⚠️ Business verification service is currently unavailable. Please try again later.',
            'warning'
          );
        } else {
          const errorMsg =
            err?.userMessage || err?.message || 'RC Number verification failed';
          this.toastService.openSnackBar(`❌ ${errorMsg}`, 'error');
        }
      },
    });
  }

  //  ADD THIS HELPER METHOD FOR DATE DISPLAY
  private formatDateForDisplay(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return dateString;
    }
  }

  // ==================== HELPER METHODS ====================
  private getBankCode(bankName: string): string {
    if (!bankName) {
      console.warn('❌ No bank name provided');
      return '';
    }

    const cleanBankName = bankName.toLowerCase().trim();
    console.log(
      `🔍 Looking up bank code for: "${bankName}" (cleaned: "${cleanBankName}")`
    );

    // First try exact match
    let bankCode = this.bankCodeMap[cleanBankName];

    // If not found, try partial match
    if (!bankCode) {
      console.log('🔍 Trying partial match...');
      const matchedBank = this.nigerianBanks.find((bank) => {
        if (!bank.bankName) return false;
        const bankNameLower = bank.bankName.toLowerCase();
        return (
          bankNameLower.includes(cleanBankName) ||
          cleanBankName.includes(bankNameLower) ||
          bankNameLower === cleanBankName
        );
      });

      if (matchedBank) {
        bankCode = matchedBank.cbnCode || matchedBank.bankCode || '';
        console.log(
          `✅ Found bank "${matchedBank.bankName}" with code: ${bankCode}`
        );

        // Cache this mapping for future use
        if (bankCode) {
          this.bankCodeMap[cleanBankName] = bankCode;
        }
      }
    } else {
      console.log(`✅ Found exact match with code: ${bankCode}`);
    }

    if (!bankCode) {
      console.warn(`❌ No bank code found for: "${bankName}"`);
      console.log('Available banks:', this.banks.slice(0, 5));
      console.log(
        'Bank code map keys:',
        Object.keys(this.bankCodeMap).slice(0, 5)
      );
    }

    return bankCode || '';
  }

  // ==================== USER DATA INITIALIZATION ====================
  private initializeUserData(): void {
    console.log('🔍 Initializing user data for wallet profile...');

    const currentUser = this.authService.getCurrentUser();
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userProfile = this.userService.getProfileData();

    const user = currentUser || userProfile || userData;

    if (user) {
      console.log('✅ User data found:', user);

      // Extract and set user data
      this.email = this.extractEmailWithPriority(user);
      this.number = this.extractPhoneNumber(user);
      this.fullName = this.extractFullName(user);
      this.userName = this.extractUserName(user);
      this.occupation =
        this.extractValue(user, ['occupation', 'profession', 'jobTitle']) || '';
      this.bvn =
        this.extractValue(user, ['bvn', 'bankVerificationNumber']) || '';
      this.nin =
        this.extractValue(user, ['nin', 'nationalIdentificationNumber']) || '';

      // Auto-populate business fields
      this.businessData.companyEmail = this.email;
      this.businessData.companyPhone = this.number;
      // ✅ FIX: DO NOT auto-populate companyName here - let it come from CAC verification
      // this.businessData.companyName = this.fullName; // REMOVE THIS LINE

      // Set dropdown values
      this.setDropdownValues(user);

      // Date of Birth
      const dobValue = this.extractValue(user, [
        'dateOfBirth',
        'dob',
        'birthDate',
      ]);
      if (dobValue) {
        this.dob = this.formatDateForInput(dobValue);
        this.formatDob();
      }

      // Role
      this.role = this.extractValue(user, ['role', 'userRole']) || 'scouter';

      console.log('✅ User data binding completed');
    } else {
      console.warn('⚠️ No user data found in any source');
      this.loadFallbackUserData();
    }
  }

  private loadFallbackUserData(): void {
    // Try localStorage fallbacks
    const registrationEmail = localStorage.getItem('registration_email');
    const userEmail = localStorage.getItem('user_email');

    if (registrationEmail || userEmail) {
      this.email = registrationEmail || userEmail || '';
      this.businessData.companyEmail = this.email;
      console.log('✅ Using fallback email from localStorage:', this.email);
    }
  }

  // ==================== FORM SUBMISSION METHODS ====================
  async onSubmit(form: any) {
    // Check if BVN requires OTP verification
    if (this.bvn && this.bvn.length === 11 && !this.otpVerified) {
      if (this.otpSent) {
        this.toastService.openSnackBar(
          'Please enter and verify the OTP sent to your phone.',
          'warning'
        );
        return;
      } else {
        this.toastService.openSnackBar(
          'Please complete BVN verification first.',
          'warning'
        );
        return;
      }
    }

    // First validate the form
    const validation = this.validateIndividualForm();

    if (!validation.isValid) {
      // Show all validation errors in a comprehensive message
      const errorMessage = this.formatValidationErrors(validation.errors);
      this.toastService.openSnackBar(errorMessage, 'error');
      return;
    }

    if (!this.validateSavingsAcc()) {
      this.toastService.openSnackBar(this.savingsAccError, 'error');
      return;
    }

    // Check if verifications are completed
    const verificationErrors = this.checkVerificationStatus();
    if (verificationErrors.length > 0) {
      const verificationMessage =
        this.formatValidationErrors(verificationErrors);
      this.toastService.openSnackBar(verificationMessage, 'warning');
      return;
    }

    if (form.valid) {
      await this.createIndividualProfile();
    } else {
      this.toastService.openSnackBar(
        'Please fill in all required fields correctly',
        'error'
      );
    }
  }

  async onBusinessSubmit(form: any) {
    // First validate the form
    const validation = this.validateBusinessForm();

    if (!validation.isValid) {
      // Show all validation errors in a comprehensive message
      const errorMessage = this.formatValidationErrors(validation.errors);
      this.toastService.openSnackBar(errorMessage, 'error');
      return;
    }

    if (!this.validateBusinessAccount()) {
      this.toastService.openSnackBar(this.businessAcctError, 'error');
      return;
    }

    // Verify RC number before submission if not already verified
    if (!this.rcVerified) {
      const loading = await this.showLoading('Verifying RC Number...');
      try {
        await this.verifyBusinessRC();
        await loading.dismiss();

        if (!this.rcVerified) {
          this.toastService.openSnackBar(
            'RC number verification failed. Please check your RC number and try again.',
            'error'
          );
          return;
        }
      } catch (error) {
        await loading.dismiss();
        this.toastService.openSnackBar(
          'RC number verification failed. Please try again.',
          'error'
        );
        return;
      }
    }

    if (form.valid) {
      await this.createBusinessProfile();
    } else {
      this.toastService.openSnackBar(
        'Please fill in all required fields correctly',
        'error'
      );
    }
  }

  // ==================== HELPER VALIDATION METHODS ====================
  private checkVerificationStatus(): string[] {
    const errors: string[] = [];

    // BVN verification check - requires OTP verification
    if (this.bvn && this.bvn.length === 11) {
      if (!this.otpVerified) {
        if (this.otpSent) {
          errors.push('Please enter and verify the OTP sent to your phone');
        } else {
          errors.push('Please complete BVN verification by initiating OTP');
        }
      } else if (this.bvnVerified !== true) {
        errors.push('BVN verification failed. Please try again.');
      }
    }

    // NIN verification check
    if (this.nin && this.nin.length === 11 && this.ninVerified !== true) {
      errors.push('NIN verification is required');
    }

    // Account verification check
    if (
      this.savingsAcc &&
      this.savingsAcc.length === 10 &&
      this.acctVerified !== true
    ) {
      errors.push('Account verification is required');
    }

    return errors;
  }

  private formatValidationErrors(errors: string[]): string {
    if (errors.length === 1) {
      return errors[0];
    } else if (errors.length <= 3) {
      return errors.join('. ');
    } else {
      return `Please fix the following issues: ${errors
        .slice(0, 3)
        .join(', ')} and ${errors.length - 3} more...`;
    }
  }

  // ==================== PROFILE CREATION METHODS ====================
  async createIndividualProfile() {
    const loading = await this.showLoading('Creating individual profile...');

    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated. Please login again.');
      }

      const uniqueId = this.getCurrentUserUniqueId();
      if (!uniqueId) {
        throw new Error(
          'Unable to retrieve user information. Please login again.'
        );
      }

      const bankCode = this.getBankCode(this.selectedBank);
      if (!bankCode) {
        throw new Error('Invalid bank selected. Please choose a valid bank.');
      }

      // 🔴 REMOVE THIS BLOCK - BVN verification is already handled via OTP flow
      // Verify all details before submission
      // try {
      //   await this.endpointService.validateBVN(this.bvn).toPromise(); // ❌ This is causing the error
      //   await this.endpointService.validateNIN(this.nin).toPromise();

      //   const acctPayload = {
      //     bankCode: bankCode,
      //     bankName: this.selectedBank,
      //     bankAccountNo: this.savingsAcc,
      //   };
      //   await this.endpointService.verifyAccountNumber(acctPayload).toPromise();
      // } catch (verifyErr: any) {
      //   throw new Error(
      //     verifyErr?.userMessage ||
      //     'Verification failed. Please check your inputs.'
      //   );
      // }

      // ✅ NEW: Check verification status instead
      const verificationErrors = this.checkVerificationStatus();
      if (verificationErrors.length > 0) {
        throw new Error(this.formatValidationErrors(verificationErrors));
      }

      // ✅ Verify NIN and Account if they exist (but not BVN since it's already verified via OTP)
      try {
        if (this.nin) {
          await this.endpointService.validateNIN(this.nin).toPromise();
        }

        if (this.savingsAcc && this.selectedBank) {
          const acctPayload = {
            bankCode: bankCode,
            bankName: this.selectedBank,
            bankAccountNo: this.savingsAcc,
          };
          await this.endpointService
            .verifyAccountNumber(acctPayload)
            .toPromise();
        }
      } catch (verifyErr: any) {
        throw new Error(
          verifyErr?.userMessage ||
            'Verification failed. Please check your inputs.'
        );
      }

      // Create individual payload
      const nameParts = (this.fullName || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);

      // Use verified names from BVN/NIN if available, otherwise use manual input
      const firstName =
        this.bvnFirstName || this.ninFirstName || nameParts[0] || '';
      const middleName =
        this.bvnMiddleName ||
        this.ninMiddleName ||
        (nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '');
      const lastName =
        this.bvnLastName ||
        this.ninLastName ||
        (nameParts.length > 1 ? nameParts[nameParts.length - 1] : '');

      const payload = {
        bankAccountNumber: this.savingsAcc,
        bankCode: bankCode,
        bankName: this.selectedBank,
        bvn: this.bvn,
        countryOfResidence: this.selectedCountry,
        dob: this.formatDateForAPI(this.dob),
        email: this.email,
        firstName: firstName,
        gender: this.selectedGender.toLowerCase(),
        maritalStatus: this.selectedMaritalStatus.toLowerCase(),
        middleName: middleName,
        lastName: lastName,
        nin: this.nin,
        occupation: this.occupation,
        role: this.role.toLowerCase(),
        selectedOption: 'isIndividual',
        title: this.selectedTitle,
        phoneNumber: this.number,
        uniqueId: uniqueId,
      };

      console.log('📤 Sending individual wallet profile:', payload);
      const response = await this.endpointService
        .createWalletProfile(payload)
        .toPromise();
      console.log('✅ Individual profile created:', response);

      await loading.dismiss();

      // Save to localStorage and navigate
      localStorage.setItem('walletProfileCreated', 'true');
      localStorage.setItem('walletProfileType', 'individual');

      // Mark the logged-in user as having a wallet profile and notify services
      try {
        this.authService.updateCurrentUser({ hasWalletProfile: true });
      } catch (err) {
        console.warn('Could not update user_data hasWalletProfile', err);
      }

      this.toastService.openSnackBar(
        '✅ Individual wallet profile created successfully!',
        'success'
      );
      this.isFormLocked = true;

      setTimeout(() => {
        this.router.navigate(['/wallet-dashboard'], { replaceUrl: true });
      }, 2000);
    } catch (error: any) {
      await loading.dismiss();
      console.error('❌ Error creating individual profile:', error);

      let errorMessage =
        'Failed to create individual profile. Please try again.';
      if (error.status === 409)
        errorMessage = 'Wallet profile already exists for this user.';
      else if (error.status === 400) {
        // Check for BVN-specific error
        if (error.message?.includes('BVN')) {
          errorMessage =
            'BVN verification required. Please complete BVN OTP verification first.';
        } else {
          errorMessage =
            'Invalid data provided. Please check your information.';
        }
      } else if (error.status === 401)
        errorMessage = 'Session expired. Please login again.';
      else if (error.message) errorMessage = error.message;

      this.toastService.openSnackBar(errorMessage, 'error');
    }
  }
  async createBusinessProfile() {
    const loading = await this.showLoading('Creating business profile...');

    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('User not authenticated. Please login again.');
      }

      const uniqueId = this.getCurrentUserUniqueId();
      if (!uniqueId) {
        throw new Error(
          'Unable to retrieve user information. Please login again.'
        );
      }

      const bankCode = this.getBankCode(this.businessData.bankName);
      if (!bankCode) {
        throw new Error('Invalid bank selected. Please choose a valid bank.');
      }

      // Verify business RC number
      if (!this.rcVerified) {
        throw new Error('RC number verification is required');
      }

      // Verify account number
      try {
        const acctPayload = {
          bankCode: bankCode,
          bankName: this.businessData.bankName,
          bankAccountNo: this.businessData.accountNumber,
        };
        await this.endpointService.verifyAccountNumber(acctPayload).toPromise();
      } catch (verifyErr: any) {
        throw new Error(
          verifyErr?.userMessage || 'Account verification failed'
        );
      }

      // Create business payload
      const payload = {
        selectedOption: 'isRegisteredBusiness',
        occupation: this.businessData.natureOfBusiness,
        countryOfResidence: this.businessData.country,
        bankAccountNumber: this.businessData.accountNumber,
        bankName: this.businessData.bankName,
        bankCode: bankCode,
        uniqueId: uniqueId,
        role: this.role.toLowerCase(),
        email: this.businessData.companyEmail,
        dob: this.formatDateForAPI(this.businessData.incorporationDate),
        cacRegCertificate: this.businessData.cacRegCertificate,
        rcNumber: this.businessData.rcNumber,
        companyName: this.businessData.companyName,
        phoneNumber: this.businessData.companyPhone,
      };

      console.log('📤 Sending business wallet profile:', {
        ...payload,
        cacRegCertificate: payload.cacRegCertificate ? '***BASE64***' : '',
      });

      const response = await this.endpointService
        .createWalletProfile(payload)
        .toPromise();
      console.log('✅ Business profile created:', response);

      await loading.dismiss();

      // Save to localStorage and navigate
      localStorage.setItem('walletProfileCreated', 'true');
      localStorage.setItem('walletProfileType', 'business');

      // Mark the logged-in user as having a wallet profile and notify services
      try {
        this.authService.updateCurrentUser({ hasWalletProfile: true });
      } catch (err) {
        console.warn('Could not update user_data hasWalletProfile', err);
      }

      this.toastService.openSnackBar(
        '✅ Business wallet profile created successfully!',
        'success'
      );
      this.isFormLocked = true;

      setTimeout(() => {
        this.router.navigate(['/wallet-dashboard'], { replaceUrl: true });
      }, 2000);
    } catch (error: any) {
      await loading.dismiss();
      console.error('❌ Error creating business profile:', error);

      let errorMessage = 'Failed to create business profile. Please try again.';
      if (error.status === 409)
        errorMessage = 'Wallet profile already exists for this business.';
      else if (error.status === 400)
        errorMessage =
          'Invalid business data provided. Please check your information.';
      else if (error.status === 401)
        errorMessage = 'Session expired. Please login again.';
      else if (error.message) errorMessage = error.message;

      this.toastService.openSnackBar(errorMessage, 'error');
    }
  }

  // ==================== VALIDATION METHODS ====================
  private validateIndividualForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.fullName || this.fullName.trim().length < 3) {
      errors.push('Full name must be at least 3 characters');
    }
    if (!this.bvn || !/^\d{11}$/.test(this.bvn)) {
      errors.push('BVN must be exactly 11 digits');
    }
    // OTP verification check
    if (this.bvn && this.bvn.length === 11 && !this.otpVerified) {
      if (this.otpSent) {
        errors.push('Please enter and verify the OTP sent to your phone');
      } else {
        errors.push('Please complete BVN verification by entering the OTP');
      }
    }
    if (!this.nin || !/^\d{11}$/.test(this.nin)) {
      errors.push('NIN must be exactly 11 digits');
    }
    if (!this.savingsAcc || !/^\d{10}$/.test(this.savingsAcc)) {
      errors.push('Account number must be exactly 10 digits');
    }
    if (!this.selectedBank) {
      errors.push('Please select a bank');
    }
    if (!this.selectedGender) {
      errors.push('Please select gender');
    }
    if (!this.selectedMaritalStatus) {
      errors.push('Please select marital status');
    }
    if (!this.selectedCountry) {
      errors.push('Please select country of residence');
    }
    if (!this.occupation || this.occupation.trim().length < 2) {
      errors.push('Occupation is required');
    }
    if (!this.dob) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(this.dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18) errors.push('You must be at least 18 years old');
    }

    // Verification status checks
    if (this.bvnVerified === false) {
      errors.push(
        'BVN verification failed. Please check your BVN and try again.'
      );
    }
    if (this.ninVerified === false) {
      errors.push(
        'NIN verification failed. Please check your NIN and try again.'
      );
    }
    if (this.acctVerified === false) {
      errors.push(
        'Account verification failed. Please check your account number and bank details.'
      );
    }
    if (this.bvnVerified === null && this.bvn) {
      errors.push(
        'BVN verification is pending. Please wait for verification to complete.'
      );
    }
    if (this.ninVerified === null && this.nin) {
      errors.push(
        'NIN verification is pending. Please wait for verification to complete.'
      );
    }
    if (this.acctVerified === null && this.savingsAcc && this.selectedBank) {
      errors.push(
        'Account verification is pending. Please wait for verification to complete.'
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateBusinessForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (
      !this.businessData.rcNumber ||
      this.businessData.rcNumber.trim().length < 3
    ) {
      errors.push('RC Number is required');
    }
    if (
      !this.businessData.companyName ||
      this.businessData.companyName.trim().length < 3
    ) {
      errors.push('Company name is required');
    }
    if (
      !this.businessData.natureOfBusiness ||
      this.businessData.natureOfBusiness.trim().length < 3
    ) {
      errors.push('Nature of business is required');
    }
    if (!this.businessData.cacRegCertificate) {
      errors.push('CAC certificate is required');
    }
    if (
      !this.businessData.accountNumber ||
      !/^\d{10}$/.test(this.businessData.accountNumber)
    ) {
      errors.push('Valid account number is required (10 digits)');
    }
    if (!this.businessData.country) {
      errors.push('Please select country');
    }
    if (!this.businessData.bankName) {
      errors.push('Please select bank');
    }
    if (!this.businessData.incorporationDate) {
      errors.push('Date of incorporation is required');
    }

    // Verification status checks
    if (this.rcVerified === false) {
      errors.push(
        'RC Number verification failed. Please check your RC number and try again.'
      );
    }
    if (this.rcVerified === null && this.businessData.rcNumber) {
      errors.push(
        'RC Number verification is pending. Please wait for verification to complete.'
      );
    }

    // Add business account verification checks
    if (this.businessAcctVerified === false) {
      errors.push(
        'Business account verification failed. Please check your account number and bank details.'
      );
    }
    if (
      this.businessAcctVerified === null &&
      this.businessData.accountNumber &&
      this.businessData.bankName
    ) {
      errors.push(
        'Business account verification is pending. Please wait for verification to complete.'
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ==================== UI HELPER METHODS ====================
  getIndividualSubmitButtonText(): string {
    const validation = this.validateIndividualForm();
    if (!validation.isValid) {
      return 'Fill all inputs to Save';
    }

    // Check if BVN needs OTP verification
    if (this.bvn && this.bvn.length === 11 && !this.otpVerified) {
      if (this.otpSent) {
        return 'Verify OTP to Continue';
      } else {
        return 'Verify BVN to Continue';
      }
    }

    const verificationErrors = this.checkVerificationStatus();
    if (verificationErrors.length > 0) {
      return 'Complete Verifications';
    }

    return 'Save';
  }

  getBusinessSubmitButtonText(): string {
    const validation = this.validateBusinessForm();
    if (!validation.isValid) {
      return 'Fill all inputs to Save';
    }

    if (!this.rcVerified) {
      return 'Verify RC Number';
    }

    if (!this.businessAcctVerified) {
      return 'Verify Account Number';
    }

    return 'Save';
  }

  // Enhanced account validation with bank dependency
  validateSavingsAcc() {
    if (!this.selectedBank) {
      this.savingsAccError = 'Please select a bank first.';
      return false;
    }

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

  // ==================== UTILITY METHODS ====================
  private getCurrentUserUniqueId(): string {
    const currentUser = this.authService.getCurrentUser();
    const userProfile = this.userService.getProfileData();
    const userData = localStorage.getItem('user_data');

    const user =
      currentUser || userProfile || (userData ? JSON.parse(userData) : null);

    if (user) {
      const uniqueId =
        user.uniqueId ||
        user.id ||
        user.userId ||
        user.scouterId ||
        user.talentId ||
        user.details?.user?.uniqueId ||
        user.details?.user?.id;

      if (uniqueId) {
        console.log('✅ Using uniqueId:', uniqueId);
        return String(uniqueId);
      }
    }

    throw new Error(
      'Unable to retrieve user unique ID. Please ensure you are logged in.'
    );
  }

  private formatDateForAPI(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    try {
      console.log('📅 Formatting date for input:', dateString);

      // Handle format "17-04-2002" (DD-MM-YYYY)
      if (dateString.includes('-') && dateString.split('-').length === 3) {
        const parts = dateString.split('-');

        // Check if first part is day (2 digits) - DD-MM-YYYY format
        if (
          parts[0].length === 2 &&
          parts[1].length === 2 &&
          parts[2].length === 4
        ) {
          // Convert DD-MM-YYYY to YYYY-MM-DD
          const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          console.log('📅 Converted DD-MM-YYYY to YYYY-MM-DD:', formatted);
          return formatted;
        }

        // Check if first part is year (4 digits) - YYYY-MM-DD format
        if (
          parts[0].length === 4 &&
          parts[1].length === 2 &&
          parts[2].length === 2
        ) {
          // Already in YYYY-MM-DD format
          console.log('📅 Already in YYYY-MM-DD format:', dateString);
          return dateString;
        }
      }

      // Handle ISO format (e.g., "1992-07-27T23:00:00.000+00:00")
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const formatted = `${year}-${month}-${day}`;
        console.log('📅 Converted ISO to YYYY-MM-DD:', formatted);
        return formatted;
      }

      // Try parsing as just date string without time
      const justDate = dateString.split('T')[0];
      if (justDate && justDate.includes('-')) {
        console.log('📅 Using date part only:', justDate);
        return justDate;
      }

      console.warn('⚠️ Could not parse date:', dateString);
      return '';
    } catch (error) {
      console.error('❌ Error formatting date:', error, 'Input:', dateString);
      return '';
    }
  }

  private async showLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent',
      backdropDismiss: false,
    });
    await loading.present();
    return loading;
  }

  // ==================== TEMPLATE INTERACTION METHODS ====================
  onBvnInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.bvn = value;
    this.bvnVerified = null;
    this.otpSent = false;
    this.otpVerified = false;
    this.otp = '';
    this.otpError = '';

    // Reset BVN name data when input changes
    this.bvnFirstName = '';
    this.bvnMiddleName = '';
    this.bvnLastName = '';
    this.bvnFullName = '';

    // Clear any existing timer
    if (this.bvnTimer) clearTimeout(this.bvnTimer);

    // Only initiate verification when we have exactly 11 digits
    if (this.bvn && this.bvn.length === 11) {
      this.bvnTimer = setTimeout(() => this.initiateBVNVerification(), 700);
    }
  }

  onNinInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.nin = value;
    this.ninVerified = null;
    // Reset NIN name data when input changes
    this.ninFirstName = '';
    this.ninMiddleName = '';
    this.ninLastName = '';
    this.ninFullName = '';

    if (this.ninTimer) clearTimeout(this.ninTimer);
    if (this.nin && this.nin.length === 11) {
      this.ninTimer = setTimeout(() => this.verifyNIN(), 700);
    }
  }
  onRcNumberInput(event: any) {
    let value = event.target.value;
    this.businessData.rcNumber = value;
    this.rcVerified = null;

    if (this.rcTimer) clearTimeout(this.rcTimer);
    if (
      this.businessData.rcNumber &&
      this.businessData.rcNumber.trim().length >= 3
    ) {
      this.rcTimer = setTimeout(() => this.verifyRCNumber(), 1000);
    }
  }

  onNumberInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.number = value;
  }

  onBusinessPhoneInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.businessData.companyPhone = value;
  }

  onSavingsAccInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
    this.savingsAcc = value;
    this.acctVerified = null;
    this.accountName = ''; // Reset account name when input changes
    if (this.acctTimer) clearTimeout(this.acctTimer);
    if (this.savingsAcc && this.savingsAcc.length === 10 && this.selectedBank) {
      this.acctTimer = setTimeout(() => this.verifyAccount(), 700);
    }
  }

  onBusinessAccountInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
    this.businessData.accountNumber = value;
    this.businessAcctVerified = null;
    this.businessAcctError = '';
    this.businessAccountName = ''; // Reset business account name when input changes

    if (this.businessAcctTimer) clearTimeout(this.businessAcctTimer);
    if (
      this.businessData.accountNumber &&
      this.businessData.accountNumber.length === 10 &&
      this.businessData.bankName
    ) {
      this.businessAcctTimer = setTimeout(
        () => this.verifyBusinessAccount(),
        700
      );
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.businessData.cacCertificate = file;
      this.convertFileToBase64(file)
        .then((base64) => {
          this.businessData.cacRegCertificate = base64;
          this.toastService.openSnackBar(
            '✅ CAC certificate uploaded successfully',
            'success'
          );
        })
        .catch((error) => {
          console.error('Error converting file to base64:', error);
          this.toastService.openSnackBar(`❌ ${error.message}`, 'error');
        });
    }
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('File size must be less than 5MB'));
        return;
      }

      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/pdf',
      ];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Please upload a JPEG, PNG, or PDF file'));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // ==================== BUSINESS VERIFICATION ====================
  private async verifyBusinessRC(): Promise<boolean> {
    try {
      const verifyPayload = {
        SearchType: 'ALL',
        searchTerm:
          this.businessData.rcNumber || this.businessData.companyName || '',
      };

      console.log('🔍 Verifying business with payload:', verifyPayload);

      const businessVerification = await this.endpointService
        .verifyBusiness(verifyPayload)
        .toPromise();

      console.log('✅ Business verification response:', businessVerification);

      if (businessVerification.success === true) {
        this.rcVerified = true;
        return true;
      } else {
        this.rcVerified = false;
        throw new Error(
          businessVerification.message || 'Business verification failed'
        );
      }
    } catch (verifyErr: any) {
      console.error('❌ Business verification failed:', verifyErr);
      this.rcVerified = false;
      const msg =
        verifyErr?.userMessage ||
        verifyErr?.message ||
        'Business verification failed';
      throw new Error(msg);
    }
  }

  // ==================== DROPDOWN METHODS ====================
  filterTitle(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredTitle = this.title.filter((t) =>
      t.toLowerCase().includes(query)
    );
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

  selectBusinessCountry(country: string) {
    this.businessData.country = country;
    this.showCountryDropdown = false;
  }

  selectBank(bank: string) {
    this.selectedBank = bank;
    this.showBankDropdown = false;
    this.accountName = ''; // Reset account name when bank changes

    if (this.savingsAcc && this.savingsAcc.length === 10) {
      setTimeout(() => this.verifyAccount(), 500);
    }
  }

  selectBusinessBank(bank: string) {
    this.businessData.bankName = bank;
    this.showBankDropdown = false;
    this.businessAccountName = ''; // Reset business account name when bank changes

    // Trigger account verification if account number is already entered
    if (
      this.businessData.accountNumber &&
      this.businessData.accountNumber.length === 10
    ) {
      setTimeout(() => this.verifyBusinessAccount(), 500);
    }
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

  // ==================== USER DATA EXTRACTION METHODS ====================
  private extractEmailWithPriority(user: any): string {
    if (!user) return '';

    const directEmail = user.email || user.userEmail || user.emailAddress;
    if (directEmail && this.isValidEmail(directEmail)) {
      return directEmail.trim();
    }

    if (user.user && user.user.email && this.isValidEmail(user.user.email)) {
      return user.user.email.trim();
    }

    if (
      user.details &&
      user.details.user &&
      user.details.user.email &&
      this.isValidEmail(user.details.user.email)
    ) {
      return user.details.user.email.trim();
    }

    const deepEmail = this.deepSearchEmail(user);
    if (deepEmail) return deepEmail;

    const registrationEmail = localStorage.getItem('registration_email');
    const userEmail = localStorage.getItem('user_email');
    const fallbackEmail = registrationEmail || userEmail;

    if (fallbackEmail && this.isValidEmail(fallbackEmail)) {
      return fallbackEmail.trim();
    }

    return '';
  }

  private deepSearchEmail(obj: any, depth = 0, maxDepth = 4): string {
    if (depth > maxDepth || obj === null || typeof obj !== 'object') return '';

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (
          key.toLowerCase().includes('email') &&
          typeof value === 'string' &&
          this.isValidEmail(value)
        ) {
          return value.trim();
        }
        if (typeof value === 'object' && value !== null) {
          const found = this.deepSearchEmail(value, depth + 1, maxDepth);
          if (found) return found;
        }
      }
    }
    return '';
  }

  private extractFullName(user: any): string {
    const namePaths = [
      'fullName',
      'name',
      'displayName',
      'fullname',
      'user.fullName',
      'details.user.fullName',
      'firstName',
      'first_name',
      'user.firstName',
    ];

    for (const path of namePaths) {
      const value = this.getNestedValue(user, path);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    const firstName =
      this.getNestedValue(user, 'firstName') ||
      this.getNestedValue(user, 'first_name');
    const lastName =
      this.getNestedValue(user, 'lastName') ||
      this.getNestedValue(user, 'last_name');

    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    return '';
  }

  private extractUserName(user: any): string {
    const usernamePaths = [
      'username',
      'userName',
      'displayName',
      'fullName',
      'name',
      'user.username',
      'details.user.username',
    ];

    for (const path of usernamePaths) {
      const value = this.getNestedValue(user, path);
      if (value && typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return 'User';
  }

  private extractPhoneNumber(user: any): string {
    const phonePaths = [
      'phoneNumber',
      'phone',
      'mobile',
      'contactNumber',
      'user.phoneNumber',
      'details.user.phoneNumber',
      'user.phone',
      'details.phoneNumber',
      'data.phoneNumber',
      'mobileNumber',
      'telephone',
    ];

    for (const path of phonePaths) {
      const value = this.getNestedValue(user, path);
      if (value && typeof value === 'string' && value.trim()) {
        return value.replace(/[^\d]/g, '').trim();
      }
    }

    return '';
  }

  private extractValue(obj: any, paths: string[]): string {
    for (const path of paths) {
      const value = this.getNestedValue(obj, path);
      if (value && typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
    return '';
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private setDropdownValues(user: any): void {
    const titleValue = this.extractValue(user, [
      'title',
      'salutation',
      'details.user.title',
    ]);
    if (titleValue)
      this.selectedTitle = this.findClosestMatch(titleValue, this.title);

    const genderValue = this.extractValue(user, [
      'gender',
      'sex',
      'details.user.gender',
    ]);
    if (genderValue)
      this.selectedGender = this.findClosestMatch(genderValue, this.gender);

    const maritalValue = this.extractValue(user, [
      'maritalStatus',
      'marital',
      'details.user.maritalStatus',
    ]);
    if (maritalValue)
      this.selectedMaritalStatus = this.findClosestMatch(
        maritalValue,
        this.maritalStatus
      );

    const countryValue = this.extractValue(user, [
      'country',
      'countryOfResidence',
      'nationality',
    ]);
    if (countryValue) {
      this.selectedCountry = this.findClosestMatch(
        countryValue,
        this.countries
      );
      this.businessData.country = this.selectedCountry;
    }

    const bankValue = this.extractValue(user, [
      'bank',
      'bankName',
      'primaryBank',
    ]);
    if (bankValue) {
      this.selectedBank = this.findClosestMatch(bankValue, this.banks);
      this.businessData.bankName = this.selectedBank;
    }
  }

  private findClosestMatch(value: string, options: string[]): string {
    if (!value) return '';
    const cleanValue = value.toLowerCase().trim();

    const exactMatch = options.find((opt) => opt.toLowerCase() === cleanValue);
    if (exactMatch) return exactMatch;

    const containsMatch = options.find(
      (opt) =>
        opt.toLowerCase().includes(cleanValue) ||
        cleanValue.includes(opt.toLowerCase())
    );
    if (containsMatch) return containsMatch;

    const firstWord = cleanValue.split(' ')[0];
    const partialMatch = options.find(
      (opt) =>
        opt.toLowerCase().startsWith(firstWord) ||
        firstWord.startsWith(opt.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return '';
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ==================== EVENT HANDLERS ====================
  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-title')) this.showTitleDropdown = false;
    if (!target.closest('.dropdown-gender')) this.showGenderDropdown = false;
    if (!target.closest('.dropdown-maritalStatus'))
      this.showMaritalStatusDropdown = false;
    if (!target.closest('.dropdown-country')) this.showCountryDropdown = false;
    if (!target.closest('.dropdown-bank')) this.showBankDropdown = false;
  }

  goBack() {
    this.location.back();
  }

  // Debug method
  debugUserData(): void {
    console.log('=== DEBUG USER DATA ===');
    const currentUser = this.authService.getCurrentUser();
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userProfile = this.userService.getProfileData();

    console.log('Current User:', currentUser);
    console.log('LocalStorage User Data:', userData);
    console.log('User Service Profile:', userProfile);
    console.log('All localStorage keys:', Object.keys(localStorage));
    console.log('=== END DEBUG ===');
  }
}
