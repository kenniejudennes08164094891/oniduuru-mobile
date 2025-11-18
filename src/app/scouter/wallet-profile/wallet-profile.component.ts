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
import { EndpointService } from 'src/app/services/endpoint.service';
import { LoadingController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

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

  // Profile type - initialize as null to show empty state
  profileType: 'business' | 'individual' | null = null;

  // Individual form data
  title = title;
  gender = gender;
  maritalStatus = maritalStatus;
  countries = countries;
  banks = banks;

  savingsAcc: string = '';
  savingsAccError: string = '';

  role = 'scouter';

  otp: string[] = ['', '', '', '', '', ''];
  otpArray = new Array(4);

  countdown = 60;

  fullName = '';
  email = '';
  bvn = '';
  nin = '';
  number = '';
  occupation = '';

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
  };

  constructor(
    private location: Location,
    private endpointService: EndpointService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

// ✅ NEW: Debug method to check user data sources
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
  
  // Check for any email-related keys in localStorage
  const emailKeys = Object.keys(localStorage).filter(key => 
    key.toLowerCase().includes('email')
  );
  console.log('Email-related localStorage keys:', emailKeys);
  
  emailKeys.forEach(key => {
    console.log(`LocalStorage ${key}:`, localStorage.getItem(key));
  });
  
  console.log('=== END DEBUG ===');
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

  ngOnInit() {
    this.filteredTitle = [...this.title];
    this.filteredGender = [...this.gender];
    this.filteredMaritalStatus = [...this.maritalStatus];
    this.filteredCountries = [...this.countries];
    this.filteredBanks = [...this.banks];

    // ✅ Enhanced: Auto-populate ALL available user data
    this.initializeUserData();
  }

  private initializeUserData(): void {
    console.log('🔄 Initializing user data for wallet profile...');

    // Get all possible user data sources
    const currentUser = this.authService.getCurrentUser();
    const userDataStr = localStorage.getItem('user_data');
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const userProfile = this.userService.getProfileData();

    console.log('🔍 User data sources:', {
      currentUser,
      userData,
      userProfile,
      localStorageKeys: Object.keys(localStorage).filter(
        (key) =>
          key.includes('user') ||
          key.includes('email') ||
          key.includes('profile')
      ),
    });

    // Use the most complete user data source
    const user = currentUser || userProfile || userData;

    if (user) {
      console.log('✅ User data found:', user);

      // ✅ FIXED: Enhanced email extraction with priority
      this.email = this.extractEmailWithPriority(user);
      console.log('📧 Extracted email:', this.email);

      // ✅ Phone number
      this.number = this.extractPhoneNumber(user);
      console.log('📞 Extracted phone:', this.number);

      // ✅ Name fields
      this.fullName = this.extractFullName(user);
      this.userName = this.extractUserName(user);
      console.log('👤 Extracted names:', {
        fullName: this.fullName,
        userName: this.userName,
      });

      // ✅ Auto-populate business fields
      this.businessData.companyEmail = this.email;
      this.businessData.companyPhone = this.number;
      this.businessData.companyName = this.fullName;

      // ✅ Additional user data
      this.occupation =
        this.extractValue(user, ['occupation', 'profession', 'jobTitle']) || '';
      this.bvn =
        this.extractValue(user, ['bvn', 'bankVerificationNumber']) || '';
      this.nin =
        this.extractValue(user, ['nin', 'nationalIdentificationNumber']) || '';

      // ✅ Set dropdown values
      this.setDropdownValues(user);

      // ✅ Date of Birth
      const dobValue = this.extractValue(user, [
        'dateOfBirth',
        'dob',
        'birthDate',
      ]);
      if (dobValue) {
        this.dob = this.formatDateForInput(dobValue);
        this.formatDob();
      }

      // ✅ Role
      this.role = this.extractValue(user, ['role', 'userRole']) || 'scouter';

      console.log('✅ User data binding completed');
    } else {
      console.warn('❌ No user data found in any source');

      // ✅ FALLBACK: Try direct localStorage access for email
      const registrationEmail = localStorage.getItem('registration_email');
      const userEmail = localStorage.getItem('user_email');

      if (registrationEmail || userEmail) {
        this.email = registrationEmail || userEmail || '';
        this.businessData.companyEmail = this.email;
        console.log('📧 Using fallback email from localStorage:', this.email);
      }
    }
  }

  private extractEmailWithPriority(user: any): string {
    if (!user) return '';

    // Priority 1: Direct email fields (most common)
    const directEmail = user.email || user.userEmail || user.emailAddress;
    if (directEmail && this.isValidEmail(directEmail)) {
      console.log('✅ Email found via direct field:', directEmail);
      return directEmail.trim();
    }

    // Priority 2: Nested user object email
    if (user.user && user.user.email && this.isValidEmail(user.user.email)) {
      console.log('✅ Email found via user.user.email:', user.user.email);
      return user.user.email.trim();
    }

    // Priority 3: Details object email
    if (
      user.details &&
      user.details.user &&
      user.details.user.email &&
      this.isValidEmail(user.details.user.email)
    ) {
      console.log(
        '✅ Email found via details.user.email:',
        user.details.user.email
      );
      return user.details.user.email.trim();
    }

    // Priority 4: Deep search in the entire object
    const deepEmail = this.deepSearchEmail(user);
    if (deepEmail) {
      console.log('✅ Email found via deep search:', deepEmail);
      return deepEmail;
    }

    // Priority 5: Check localStorage fallbacks
    const registrationEmail = localStorage.getItem('registration_email');
    const userEmail = localStorage.getItem('user_email');
    const fallbackEmail = registrationEmail || userEmail;

    if (fallbackEmail && this.isValidEmail(fallbackEmail)) {
      console.log('✅ Email found in localStorage:', fallbackEmail);
      return fallbackEmail.trim();
    }

    console.warn('❌ No valid email found in user data or localStorage');
    return '';
  }

  // ✅ NEW: Improved deep email search
  private deepSearchEmail(obj: any, depth = 0, maxDepth = 4): string {
    if (depth > maxDepth || obj === null || typeof obj !== 'object') {
      return '';
    }

    // Check if current object has an email field
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        // If the key contains 'email' and value is a valid email string
        if (
          key.toLowerCase().includes('email') &&
          typeof value === 'string' &&
          this.isValidEmail(value)
        ) {
          return value.trim();
        }

        // If value is an object, search recursively
        if (typeof value === 'object' && value !== null) {
          const found = this.deepSearchEmail(value, depth + 1, maxDepth);
          if (found) return found;
        }
      }
    }

    return '';
  }

  // ✅ NEW: Enhanced full name extraction
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

    // Fallback: combine first and last name
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

  // ✅ NEW: Enhanced username extraction
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

  // ✅ NEW: Specialized phone number extraction method
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
        console.log(`✅ Phone found via path '${path}':`, value);
        // Clean the phone number (remove spaces, dashes, etc.)
        return value.replace(/[^\d]/g, '').trim();
      }
    }

    console.warn('❌ No phone number found in user data');
    return '';
  }


  // ✅ NEW: Email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // ✅ NEW: Smart value extraction from nested objects
  private extractValue(obj: any, paths: string[]): string {
    for (const path of paths) {
      const value = this.getNestedValue(obj, path);
      if (value && typeof value === 'string' && value.trim() !== '') {
        return value.trim();
      }
    }
    return '';
  }

  // ✅ NEW: Get nested property value using dot notation
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // ✅ NEW: Smart dropdown value setting with fuzzy matching
  private setDropdownValues(user: any): void {
    // Title
    const titleValue = this.extractValue(user, [
      'title',
      'salutation',
      'details.user.title',
    ]);
    if (titleValue) {
      this.selectedTitle = this.findClosestMatch(titleValue, this.title);
    }

    // Gender
    const genderValue = this.extractValue(user, [
      'gender',
      'sex',
      'details.user.gender',
    ]);
    if (genderValue) {
      this.selectedGender = this.findClosestMatch(genderValue, this.gender);
    }

    // Marital Status
    const maritalValue = this.extractValue(user, [
      'maritalStatus',
      'marital',
      'details.user.maritalStatus',
    ]);
    if (maritalValue) {
      this.selectedMaritalStatus = this.findClosestMatch(
        maritalValue,
        this.maritalStatus
      );
    }

    // Country
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

    // Bank
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

  // ✅ NEW: Fuzzy matching for dropdown values
  private findClosestMatch(value: string, options: string[]): string {
    if (!value) return '';

    const cleanValue = value.toLowerCase().trim();

    // Exact match
    const exactMatch = options.find((opt) => opt.toLowerCase() === cleanValue);
    if (exactMatch) return exactMatch;

    // Contains match
    const containsMatch = options.find(
      (opt) =>
        opt.toLowerCase().includes(cleanValue) ||
        cleanValue.includes(opt.toLowerCase())
    );
    if (containsMatch) return containsMatch;

    // Partial match (first word)
    const firstWord = cleanValue.split(' ')[0];
    const partialMatch = options.find(
      (opt) =>
        opt.toLowerCase().startsWith(firstWord) ||
        firstWord.startsWith(opt.toLowerCase())
    );
    if (partialMatch) return partialMatch;

    return '';
  }

  // ✅ NEW: Format date for input field (YYYY-MM-DD)
  private formatDateForInput(dateString: string): string {
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';

      // Format as YYYY-MM-DD for input[type="date"]
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');

      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  // Individual form methods
  onBvnInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.bvn = value;
  }

  onNinInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.nin = value;
  }

  onNumberInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.number = value;
  }

  // ✅ NEW: Business phone input handler
  onBusinessPhoneInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 11);
    this.businessData.companyPhone = value;
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
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
    this.savingsAcc = value;
  }

  // Business form methods
  onBusinessAccountInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9]/g, '').slice(0, 10);
    this.businessData.accountNumber = value;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.businessData.cacCertificate = file;
      // Convert file to base64 for API
      this.convertFileToBase64(file)
        .then((base64) => {
          this.businessData.cacRegCertificate = base64;
        })
        .catch((error) => {
          console.error('Error converting file to base64:', error);
          this.showToast('Error uploading file. Please try again.', 'danger');
        });
    }
  }

  convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        reject(new Error('File size must be less than 5MB'));
        return;
      }

      // Validate file type
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

  selectBusinessCountry(country: string) {
    this.businessData.country = country;
    this.showCountryDropdown = false;
  }

  selectBusinessBank(bank: string) {
    this.businessData.bankName = bank;
    this.showBankDropdown = false;
  }

  // Common methods
  filterTitle(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredTitle = this.title.filter((t) =>
      t.toLowerCase().includes(query)
    );
  }

  async onSubmit(form: any) {
    const validation = this.validateIndividualForm();
    if (!validation.isValid) {
      await this.showToast(validation.errors[0], 'danger');
      return;
    }

    const isSavingsValid = this.validateSavingsAcc();
    if (!isSavingsValid) {
      await this.showToast(this.savingsAccError, 'danger');
      return;
    }

    if (form.valid) {
      await this.createIndividualProfile();
    }
  }

  async onBusinessSubmit(form: any) {
    const validation = this.validateBusinessForm();
    if (!validation.isValid) {
      await this.showToast(validation.errors[0], 'danger');
      return;
    }

    if (form.valid) {
      await this.createBusinessProfile();
    }
  }

  // Enhanced individual form validation
  private validateIndividualForm(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.fullName || this.fullName.trim().length < 3) {
      errors.push('Full name must be at least 3 characters');
    }

    if (!this.bvn || !/^\d{11}$/.test(this.bvn)) {
      errors.push('BVN must be exactly 11 digits');
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

    // Age validation (must be at least 18 years old)
    if (this.dob) {
      const birthDate = new Date(this.dob);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        errors.push('You must be at least 18 years old');
      }
    } else {
      errors.push('Date of birth is required');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Enhanced business form validation
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

    return { isValid: errors.length === 0, errors };
  }

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

      // Parse full name into first, middle, and last names
      const nameParts = this.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const middleName = nameParts.slice(1, -1).join(' ') || '';
      const lastName = nameParts[nameParts.length - 1] || '';

      const bankCode = this.getBankCode(this.selectedBank);
      if (!bankCode) {
        throw new Error('Invalid bank selected. Please choose a valid bank.');
      }

      const payload = {
        selectedOption: 'isIndividual',
        bvn: this.bvn,
        nin: this.nin,
        title: this.selectedTitle,
        firstName: firstName,
        middleName: middleName,
        lastName: lastName,
        occupation: this.occupation,
        gender: this.mapGenderToEnum(this.selectedGender),
        maritalStatus: this.mapMaritalStatusToEnum(this.selectedMaritalStatus),
        countryOfResidence: this.selectedCountry,
        bankAccountNumber: this.savingsAcc,
        bankName: this.selectedBank,
        bankCode: bankCode,
        uniqueId: uniqueId,
        role: this.role,
        email: this.email,
        dob: this.formatDateForAPI(this.dob),
        cacRegCertificate: '',
        rcNumber: '',
      };

      console.log('📤 Sending individual wallet profile:', payload);

      const response = await this.endpointService
        .createWalletProfile(payload)
        .toPromise();

      await loading.dismiss();

      localStorage.setItem('walletProfileCreated', 'true');
      localStorage.setItem('walletProfileType', 'individual');

      await this.showToast(
        'Individual wallet profile created successfully!',
        'success'
      );

      this.isFormLocked = true;

      setTimeout(() => {
        this.router.navigate(['/wallet-dashboard'], { replaceUrl: true });
      }, 2000);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error creating individual profile:', error);

      let errorMessage =
        'Failed to create individual profile. Please try again.';

      if (error.status === 409) {
        errorMessage = 'Wallet profile already exists for this user.';
      } else if (error.status === 400) {
        errorMessage = 'Invalid data provided. Please check your information.';
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      await this.showToast(errorMessage, 'danger');
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

      const payload = {
        selectedOption: 'isRegisteredBusiness',
        bvn: '',
        nin: '',
        title: '',
        firstName: '',
        middleName: '',
        lastName: '',
        occupation: this.businessData.natureOfBusiness,
        gender: 'corporate_organization',
        maritalStatus: 'corporate_organization',
        countryOfResidence: this.businessData.country,
        bankAccountNumber: this.businessData.accountNumber,
        bankName: this.businessData.bankName,
        bankCode: bankCode,
        uniqueId: uniqueId,
        role: this.role,
        email: this.businessData.companyEmail,
        dob: this.formatDateForAPI(this.businessData.incorporationDate),
        cacRegCertificate: this.businessData.cacRegCertificate,
        rcNumber: this.businessData.rcNumber,
      };

      console.log('📤 Sending business wallet profile:', {
        ...payload,
        cacRegCertificate: payload.cacRegCertificate ? '***BASE64***' : '',
      });

      const response = await this.endpointService
        .createWalletProfile(payload)
        .toPromise();

      await loading.dismiss();

      localStorage.setItem('walletProfileCreated', 'true');
      localStorage.setItem('walletProfileType', 'business');

      await this.showToast(
        'Business wallet profile created successfully!',
        'success'
      );

      this.isFormLocked = true;

      setTimeout(() => {
        this.router.navigate(['/wallet-dashboard'], { replaceUrl: true });
      }, 2000);
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error creating business profile:', error);

      let errorMessage = 'Failed to create business profile. Please try again.';

      if (error.status === 409) {
        errorMessage = 'Wallet profile already exists for this business.';
      } else if (error.status === 400) {
        errorMessage =
          'Invalid business data provided. Please check your information.';
      } else if (error.status === 401) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }

      await this.showToast(errorMessage, 'danger');
    }
  }

  // Helper methods
  private mapGenderToEnum(gender: string): string {
    const genderMap: { [key: string]: string } = {
      male: 'male',
      female: 'female',
      other: 'other',
    };
    return genderMap[gender.toLowerCase()] || 'other';
  }

  private mapMaritalStatusToEnum(status: string): string {
    const statusMap: { [key: string]: string } = {
      single: 'single',
      married: 'married',
      divorced: 'divorced',
      widowed: 'widowed',
      corporate: 'corporate_organization',
    };
    return statusMap[status.toLowerCase()] || 'single';
  }

  private getBankCode(bankName: string): string {
    const bankCodeMap: { [key: string]: string } = {
      'access bank': '044',
      'zenith bank': '057',
      'first bank of nigeria': '011',
      'guaranty trust bank': '058',
      'united bank for africa': '033',
      'union bank of nigeria': '032',
      'first city monument bank': '214',
      'ecobank nigeria': '050',
      'polaris bank': '076',
      'stanbic ibtc bank': '039',
      'standard chartered bank': '068',
      'sterling bank': '232',
      'unity bank': '215',
      'wema bank': '035',
      'heritage bank': '030',
      'keystone bank': '082',
      'providus bank': '101',
      'suntrust bank': '100',
      'jaiz bank': '301',
      'kuda microfinance bank': '50211',
      'moniepoint microfinance bank': '50515',
      opay: '100',
      palmpay: '100',
    };
    return bankCodeMap[bankName.toLowerCase()] || '';
  }

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

  private async showLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingController.create({
      message: message,
      spinner: 'crescent',
      backdropDismiss: false,
    });
    await loading.present();
    return loading;
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: message,
      duration: 4000,
      color: color,
      position: 'bottom',
      buttons: color === 'danger' ? [{ text: 'OK', role: 'cancel' }] : [],
    });
    await toast.present();
  }

  // Rest of your existing methods...
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
