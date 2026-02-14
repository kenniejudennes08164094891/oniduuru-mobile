// src/app/scouter/pages/profile-page/profile-page.component.ts
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { UpdateProfileConfirmationPopupModalComponent } from 'src/app/utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';
import { UserService } from 'src/app/services/user.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { Subject, Subscription } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { map, takeUntil, timeout } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { switchMap } from 'rxjs/operators';
import { endpoints } from 'src/app/models/endpoint';

interface SecurityQuestion {
  id?: string;
  question: string;
  answer: string;
  isHashed?: boolean;
  showAnswer?: boolean;
  originalAnswer?: string; // Store the original answer
  // For edit/reveal flow
  revealAttempt?: string;
  revealed?: boolean;
  verifyInProgress?: boolean;
  masked?: boolean;
  createdAt?: string;
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  standalone: false,
})
export class ProfilePageComponent implements OnInit, OnDestroy {
  @ViewChild('orgInput') orgInput!: ElementRef<HTMLInputElement>;
  @ViewChild(IonContent) pageContent!: IonContent;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('profilePicture', { read: ElementRef })
  profilePicture!: ElementRef;
  @ViewChild('securityQuestionsSection', { read: ElementRef })
  securityQuestionsSection!: ElementRef;

  // Component State
  isEditingSecurityQuestions = false;
  tempSecurityQuestions: SecurityQuestion[] = [{ question: '', answer: '' }];
  currentYear: number = new Date().getFullYear();
  headerHidden = false;

  profileImage: string | null = null;
  selectedFile: File | null = null;
  scouterId: string = '';
  isEditing = false;
  saveButtonText = 'Update Profile';
  hasExistingProfilePicture = false;
  isLoadingSecurityQuestions = false;
  editingQuestionIndex: number | null = null;
  orgTypeInput = '';
  selectedOrgTypes: string[] = [];
  securityQuestions: SecurityQuestion[] = [];
  showQuestions = false;
  isLoadingProfile = false;
  isSavingProfile = false;

  maxSecurityQuestions = 5;
  securityQuestionCount = 0;
  isSavingSecurityQuestions = false;
  isDeletingQuestion = false;
  securityQuestionErrorMessage = '';

  // Track subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // Mask displayed for existing hashed answers in inputs
  private readonly ANSWER_MASK = '••••••••';
  private destroy$ = new Subject<void>();

  // Profile Data
  profileData = {
    fullName: '',
    phoneNumber: '',
    email: '',
    location: '',
    scoutingPurpose: '',
    payRange: '',
    organizationTypes: [] as string[],
    profileImage: '',
  };

  constructor(
    private router: Router,
    private location: Location,
    private modalCtrl: ModalController,
    private toastService: ToastsService,
    public userService: UserService,
    private endpointService: ScouterEndpointsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {
    console.log('🚀 ProfilePageComponent Initializing');

    // Run initialization inside Angular zone
    this.ngZone.run(() => {
      this.initializeScouterId();

      if (this.scouterId) {
        this.loadDataWithTracking();
      } else {
        console.error(' No scouterId found, cannot load data');
        this.isLoadingProfile = false;
        this.cdr.detectChanges();
      }

      // Subscribe to profile data updates
      const profileSub = this.userService.profileData$
        .pipe(takeUntil(this.destroy$))
        .subscribe((profile) => {
          if (profile) {
            this.bindUserProfile(profile);
          }
        });

      this.subscriptions.push(profileSub);

      // Test network connectivity after initialization
      setTimeout(() => {
        this.testNetworkConnectivity();
      }, 1000);
    });
  }

  private loadDataWithTracking(): void {
    console.log('📊 Loading data with tracking for scouterId:', this.scouterId);

    this.isLoadingProfile = true;
    this.cdr.detectChanges();

    // Clear any existing subscriptions
    this.clearSubscriptions();

    // Set a timeout for the entire loading process
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ Profile loading timed out');
      this.handleNetworkError();
    }, 30000); // 30 second timeout

    // Load profile data
    const profileSub = this.endpointService
      .fetchScouterProfile(this.scouterId)
      .subscribe({
        next: (res: any) => {
          clearTimeout(loadingTimeout);
          console.log(' Profile data received');
          this.handleProfileResponse(res);
          this.isLoadingProfile = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearTimeout(loadingTimeout);
          console.error(' Profile data error:', err);

          // Check if it's a timeout or network error
          if (err.message?.includes('Timeout') || err.name === 'TimeoutError') {
            this.handleNetworkError();
          } else {
            this.handleProfileError(err);
            this.isLoadingProfile = false;
          }
          this.cdr.detectChanges();
        },
      });

    // Load profile picture
    const pictureSub = this.loadProfilePicture();

    // Load security questions WITH ANSWERS
    setTimeout(() => {
      this.loadSecurityQuestionsWithAnswers();
    }, 2000);

    // Store subscriptions
    this.subscriptions.push(profileSub, pictureSub);

    console.log(` Started ${this.subscriptions.length} data loads`);
  }

  /**
   * Use the FULL scouter ID as-is
   * The backend expects: "scouter/5042/28September2025"
   */
  private getCleanScouterId(scouterId: string): string {
    if (!scouterId) return '';

    console.log(' Getting scouter ID for API:', scouterId);

    // Return the FULL scouter ID as-is
    return scouterId.trim();
  }

  // ==================== DEBUG & DIAGNOSTIC METHODS ====================

  runDebug(): void {
    // Removed: debug helper - left intentionally blank
  }

  private testNetworkConnectivity(): void {
    console.log(' Testing network connectivity...');

    // Test 1: Simple fetch to verify network
    fetch('https://httpbin.org/get')
      .then(() => console.log(' Internet connectivity: OK'))
      .catch(() => console.log(' Internet connectivity: FAILED'));

    // Test 2: Test backend endpoint directly
    this.testBackendDirectly();
  }

  private testBackendDirectly(): void {
    const token = localStorage.getItem('access_token');
    const testUrl = `${environment.baseUrl}/health`;

    if (!token) {
      console.log(' No token for backend test');
      return;
    }

    console.log(' Testing backend:', testUrl);

    fetch(testUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => {
        console.log(
          ` Backend response: ${response.status} ${response.statusText}`,
        );
        const text = await response.text();
        console.log(' Response:', text.substring(0, 200));
      })
      .catch((error) => {
        console.error(' Backend test failed:', error);
      });
  }

  // ==================== CORE INITIALIZATION ====================

  private initializeScouterId(): void {
    console.log(' Initializing scouterId...');

    const userDetails = this.authService.decodeScouterDetails();
    this.scouterId =
      userDetails?.details?.user?.scouterId || userDetails?.scouterId || '';

    console.log(' ScouterId initialized:', {
      scouterId: this.scouterId,
      cleanScouterId: this.getCleanScouterId(this.scouterId),
      hasSlash: this.scouterId.includes('/'),
      hasEncodedSlash: this.scouterId.includes('%2F'),
    });

    if (!this.scouterId) {
      console.error(' No scouterId found in auth service');
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          this.scouterId =
            parsed?.scouterId || parsed?.details?.user?.scouterId || '';
          console.log(' Found scouterId in localStorage:', this.scouterId);
        } catch (e) {
          console.error(' Error parsing user_data:', e);
        }
      }
    }

    if (!this.scouterId) {
      this.toastService.openSnackBar('User not authenticated', 'error');
      setTimeout(() => this.redirectToLogin(), 1000);
    }
  }

  private clearSubscriptions(): void {
    this.subscriptions.forEach((sub) => {
      if (sub && !sub.closed) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }

  private handleNetworkError(): void {
    console.log('🌐 Network error detected, trying offline mode...');

    // Try to load from localStorage
    const cachedProfile = localStorage.getItem('user_profile_data');
    const userData = localStorage.getItem('user_data');

    if (cachedProfile || userData) {
      this.isLoadingProfile = false;

      if (cachedProfile) {
        try {
          const profile = JSON.parse(cachedProfile);
          this.bindUserProfile(profile);
          console.log(' Loaded profile from cache');
        } catch (e) {
          console.error(' Error parsing cached profile:', e);
        }
      }

      if (userData) {
        try {
          const user = JSON.parse(userData);
          this.initializeWithUserProfileData();
          console.log(' Loaded profile from user_data');
        } catch (e) {
          console.error(' Error parsing user_data:', e);
        }
      }

      this.toastService.openSnackBar(
        'Using cached profile data. Some features may be limited.',
        'warning',
      );
    } else {
      this.toastService.openSnackBar(
        'Unable to load profile. Please check your internet connection.',
        'error',
      );
    }

    this.cdr.detectChanges();
  }

  private handleProfileResponse(res: any): void {
    console.log(' Profile response structure:', {
      hasData: !!res,
      hasDetails: !!res?.details,
      hasDataField: !!res?.data,
      keys: res ? Object.keys(res) : [],
    });

    const userData = res?.details || res?.data?.details || res?.data || res;

    if (userData) {
      console.log(' Found user data in response');

      // Ensure email is populated
      if (!userData.email) {
        userData.email = this.extractEmailFromAllSources();
        console.log(' Injected email:', userData.email);
      }

      this.bindUserProfile(userData);
      this.updateEditStateBasedOnProfile(userData);
    } else {
      console.warn(' No user data in response, using local data');
      this.initializeWithUserProfileData();
    }

    this.cdr.detectChanges();
  }

  private handleProfileError(err: any): void {
    console.error(' Profile load failed:', {
      status: err.status,
      message: err.message,
      error: err.error,
    });

    if (err.status === 401) {
      this.toastService.openSnackBar(
        'Session expired. Please login again.',
        'error',
      );
      this.redirectToLogin();
    } else {
      this.toastService.openSnackBar('Failed to load profile data', 'warning');
      this.initializeWithUserProfileData();
    }
  }

  // ==================== DATA BINDING ====================

  private extractEmailFromAllSources(): string {
    console.log(' Extracting email from all sources...');

    // 1. localStorage user_data
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        const email =
          parsed?.email ||
          parsed?.details?.email ||
          parsed?.details?.user?.email ||
          parsed?.details?.session?.email;
        if (email) {
          console.log(' Email found in localStorage:', email);
          return email;
        }
      } catch (e) {
        console.error(' Error parsing user_data:', e);
      }
    }

    // 2. Auth Service
    const userDetails = this.authService.decodeScouterDetails();
    if (userDetails) {
      const email =
        userDetails?.email ||
        userDetails?.details?.email ||
        userDetails?.details?.user?.email ||
        userDetails?.details?.session?.email;
      if (email) {
        console.log(' Email found in auth service:', email);
        return email;
      }
    }

    // 3. Current user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) {
      console.log(' Email found in current user:', currentUser.email);
      return currentUser.email;
    }

    // 4. Registration email
    const regEmail = localStorage.getItem('registration_email');
    if (regEmail) {
      console.log(' Email found in registration:', regEmail);
      return regEmail;
    }

    console.log(' No email found in any source');
    return '';
  }

  private initializeWithUserProfileData(): void {
    console.log(' Initializing with user profile data...');

    const email = this.extractEmailFromAllSources();
    console.log(' Extracted email:', email);

    // Get user data from localStorage or auth
    let userData = null;
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (e) {
        console.log(' Could not parse user_data for profile');
      }
    }

    if (!userData) {
      userData = this.authService.decodeScouterDetails();
    }

    const profile = {
      fullName: userData?.fullName || userData?.details?.user?.fullName || '',
      phoneNumber:
        userData?.phoneNumber || userData?.details?.user?.phoneNumber || '',
      email: email,
      location: userData?.location || userData?.details?.user?.location || '',
      organizationType:
        userData?.organizationType ||
        userData?.details?.user?.organizationType ||
        '[]',
      scoutingPurpose:
        userData?.scoutingPurpose ||
        userData?.details?.user?.scoutingPurpose ||
        '',
      payRange: userData?.payRange || userData?.details?.user?.payRange || '',
    };

    this.bindUserProfile(profile);
  }

  private bindUserProfile(user: any): void {
    console.log(' Binding user profile data');

    // Parse organization types
    const orgTypes = this.parseOrganizationTypes(user.organizationType);

    // CRITICAL: Update ALL profile data fields
    this.profileData = {
      fullName:
        user.fullName ||
        user.details?.user?.fullName ||
        this.profileData.fullName,
      phoneNumber:
        user.phoneNumber ||
        user.details?.user?.phoneNumber ||
        this.profileData.phoneNumber,
      email: user.email || this.profileData.email,
      location:
        user.location ||
        user.details?.user?.location ||
        this.profileData.location,
      scoutingPurpose:
        user.scoutingPurpose ||
        user.details?.user?.scoutingPurpose ||
        this.profileData.scoutingPurpose,
      payRange:
        user.payRange ||
        user.details?.user?.payRange ||
        this.profileData.payRange,
      organizationTypes:
        orgTypes.length > 0 ? orgTypes : this.profileData.organizationTypes,
      profileImage:
        user.profileImage ||
        user.profilePicture ||
        this.profileData.profileImage,
    };

    // Update selectedOrgTypes
    if (orgTypes.length > 0) {
      this.selectedOrgTypes = [...orgTypes];
    }

    console.log(' Profile data bound:', this.profileData);
    this.cdr.detectChanges();
  }

  private parseOrganizationTypes(orgType: any): string[] {
    if (!orgType) return [];

    try {
      if (typeof orgType === 'string') {
        const cleanString = orgType.replace(/\\"/g, '"');

        if (
          cleanString.trim().startsWith('[') &&
          cleanString.trim().endsWith(']')
        ) {
          const parsed = JSON.parse(cleanString);
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (item) => item && typeof item === 'string' && item.trim() !== '',
            );
          }
        }

        if (cleanString.includes(',')) {
          return cleanString
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== '');
        }

        return cleanString.trim() ? [cleanString.trim()] : [];
      }

      if (Array.isArray(orgType)) {
        return orgType.filter(
          (item) => item && typeof item === 'string' && item.trim() !== '',
        );
      }
    } catch (error) {
      console.error(' Error parsing organization types:', error);
    }

    return [];
  }

  private updateEditStateBasedOnProfile(profile: any): void {
    const hasCompleteProfile =
      profile.fullName && profile.phoneNumber && profile.email;

    this.isEditing = !hasCompleteProfile;
    this.saveButtonText = this.isEditing ? 'Save Profile' : 'Update Profile';

    console.log(' Edit state updated:', {
      isEditing: this.isEditing,
      hasCompleteProfile,
      fullName: !!profile.fullName,
      phoneNumber: !!profile.phoneNumber,
      email: !!profile.email,
    });

    this.cdr.detectChanges();
  }

  // ==================== PROFILE OPERATIONS ====================

  public saveProfile(): void {
    console.log('Starting profile save...');

    if (!this.scouterId) {
      this.toastService.openSnackBar('User not authenticated', 'error');
      return;
    }

    const validation = this.validateProfileData();
    if (!validation.isValid) {
      this.toastService.openSnackBar(validation.message!, 'warning');
      return;
    }

    this.isSavingProfile = true;
    this.saveButtonText = 'Saving...';
    this.cdr.detectChanges();

    // Prepare payload
    const payload = {
      fullName: this.profileData.fullName.trim(),
      phoneNumber: this.profileData.phoneNumber.trim(),
      email: this.profileData.email.trim(),
      location: this.profileData.location?.trim() || '',
      scoutingPurpose: this.profileData.scoutingPurpose?.trim() || '',
      payRange: this.profileData.payRange?.trim() || '',
      organizationType:
        Array.isArray(this.selectedOrgTypes) && this.selectedOrgTypes.length > 0
          ? this.selectedOrgTypes
          : [],
    };

    console.log(' Sending update payload:', payload);
    console.log(' Scouter ID:', this.scouterId);
    console.log(' Token available:', !!localStorage.getItem('access_token'));

    // Test the endpoint first
    this.debugEndpointWithFetch(payload);

    const saveSub = this.endpointService
      .updateScouterProfile(this.scouterId, payload)
      .subscribe({
        next: (res: any) => {
          console.log(' Save response received:', res);
          this.handleSuccessfulSave(payload, res);
          this.toastService.openSnackBar(
            'Profile updated successfully!',
            'success',
          );
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error(' Save error:', {
            name: err.name,
            message: err.message,
            status: err.status,
            error: err.error,
          });

          this.isSavingProfile = false;
          this.saveButtonText = this.isEditing
            ? 'Save Profile'
            : 'Update Profile';

          if (
            err.message?.includes('timed out') ||
            err.name === 'TimeoutError'
          ) {
            this.toastService.openSnackBar(
              'Request timed out. Please try again.',
              'warning',
            );
          } else {
            this.toastService.openSnackBar(
              err.message || 'Failed to save profile',
              'error',
            );
          }

          this.cdr.detectChanges();
        },
        complete: () => {
          console.log(' Save request completed');
        },
      });

    this.subscriptions.push(saveSub);
  }

  private debugEndpointWithFetch(payload: any): void {
    // debug helper removed in cleanup
  }

  private handleSuccessfulSave(savedPayload: any, apiResponse: any): void {
    console.log(' Handling successful save');

    // Preserve organization types
    const preservedOrganizationTypes = this.selectedOrgTypes;

    let updatedProfile;

    if (
      apiResponse &&
      (apiResponse.data || apiResponse.details || apiResponse.success)
    ) {
      const responseData =
        apiResponse.data || apiResponse.details || apiResponse;
      const responseOrgTypes = this.parseOrganizationTypes(
        responseData.organizationType,
      );
      const finalOrgTypes =
        responseOrgTypes.length > 0
          ? responseOrgTypes
          : preservedOrganizationTypes;

      updatedProfile = {
        ...this.profileData,
        fullName:
          responseData.fullName ||
          savedPayload.fullName ||
          this.profileData.fullName,
        phoneNumber:
          responseData.phoneNumber ||
          savedPayload.phoneNumber ||
          this.profileData.phoneNumber,
        email:
          responseData.email || savedPayload.email || this.profileData.email,
        location:
          responseData.location ||
          savedPayload.location ||
          this.profileData.location,
        scoutingPurpose:
          responseData.scoutingPurpose ||
          savedPayload.scoutingPurpose ||
          this.profileData.scoutingPurpose,
        payRange:
          responseData.payRange ||
          savedPayload.payRange ||
          this.profileData.payRange,
        organizationTypes: finalOrgTypes,
        profileImage: this.profileData.profileImage,
        scouterId: this.scouterId,
      };
    } else {
      updatedProfile = {
        ...this.profileData,
        ...savedPayload,
        organizationTypes: preservedOrganizationTypes,
      };
    }

    // Update services
    this.userService.updateFullProfile(updatedProfile);
    this.authService.updateCurrentUser(updatedProfile);

    // Cache the updated profile data
    this.cacheProfileData(updatedProfile);

    // Update local state
    this.profileData = { ...updatedProfile };
    this.selectedOrgTypes = [...preservedOrganizationTypes];

    // Switch to view mode
    this.isEditing = false;
    this.saveButtonText = 'Update Profile';
    this.isSavingProfile = false;

    // Reload data from backend
    setTimeout(() => {
      this.loadDataWithTracking();
    }, 1000);

    this.cdr.detectChanges();
  }

  private cacheProfileData(profileData: any): void {
    try {
      localStorage.setItem('user_profile_data', JSON.stringify(profileData));
      console.log(' Profile data cached locally');
    } catch (err) {
      console.warn('Could not cache profile data:', err);
    }
  }

  private validateProfileData(): { isValid: boolean; message?: string } {
    if (!this.profileData.fullName?.trim()) {
      return { isValid: false, message: 'Full name is required' };
    }
    if (!this.profileData.phoneNumber?.trim()) {
      return { isValid: false, message: 'Phone number is required' };
    }
    if (!this.profileData.email?.trim()) {
      return { isValid: false, message: 'Email is required' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.profileData.email.trim())) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    return { isValid: true };
  }

  // ==================== PROFILE PICTURE OPERATIONS ====================

  private loadProfilePicture(): Subscription {
    console.log(' Loading profile picture for scouterId:', this.scouterId);

    const cachedImage = localStorage.getItem('profile_image');
    if (cachedImage && this.isValidImageData(cachedImage)) {
      console.log(' Using cached profile image');
      this.profileImage = cachedImage;
      this.hasExistingProfilePicture = true;
      this.userService.setProfileImage(cachedImage);
      this.cdr.detectChanges();

      // Still fetch fresh from backend
      return new Subscription(); // Return empty subscription
    }

    return this.endpointService.getScouterPicture(this.scouterId).subscribe({
      next: (res: any) => {
        console.log(' Profile picture API response:', res);

        if (res?.data?.base64Picture) {
          const base64Image = `data:image/jpeg;base64,${res.data.base64Picture}`;
          this.applyProfilePicture(base64Image);
        } else if (res?.base64Picture) {
          const base64Image = `data:image/jpeg;base64,${res.base64Picture}`;
          this.applyProfilePicture(base64Image);
        } else {
          console.log(' No usable profile picture data');
          this.setDefaultAvatar();
        }
      },
      error: (err) => {
        console.log(' Profile picture load error:', err);
        this.setDefaultAvatar();
      },
    });
  }

  private applyProfilePicture(imageData: string): void {
    this.profileImage = imageData;
    this.hasExistingProfilePicture = true;
    this.userService.setProfileImage(imageData);
    this.storeProfileImage(imageData);
    this.cdr.detectChanges();
    console.log(' Profile picture applied');
  }

  private isValidImageData(data: string): boolean {
    if (!data) return false;
    if (data.startsWith('data:image/')) return true;
    if (data.startsWith('http')) return true;
    return false;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[1];
    if (!['jpeg', 'png'].includes(fileType)) {
      this.toastService.openSnackBar(
        'Only jpeg or png file format is acceptable',
        'error',
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.openSnackBar(
        'Image size should be less than 5MB',
        'warning',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const imageData = e.target.result;
      this.setProfilePicture(imageData);
      this.uploadProfilePicture(file);
    };
    reader.onerror = (error) => {
      console.error(' Error reading file:', error);
      this.toastService.openSnackBar('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);

    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private setProfilePicture(imageData: string): void {
    if (imageData.startsWith('data:image/')) {
      this.profileImage = imageData;
    } else {
      this.profileImage = `data:image/jpeg;base64,${imageData}`;
    }

    this.profileData.profileImage = this.profileImage;
    this.hasExistingProfilePicture = true;
    this.userService.setProfileImage(this.profileImage);
    this.cdr.detectChanges();
    console.log(' Profile picture set');
  }

  private uploadProfilePicture(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const fullDataUrl = e.target.result as string;
      const base64Image = fullDataUrl.split(',')[1];
      const payload = {
        scouterId: this.scouterId,
        base64Picture: base64Image,
      };

      console.log(' Starting profile picture upload');

      const uploadSub = this.endpointService
        .uploadScouterPicture(payload)
        .subscribe({
          next: (res: any) => {
            console.log(' Profile picture uploaded:', res);
            this.handleSuccessfulUpload(fullDataUrl);
          },
          error: (err) => {
            console.error(' Upload failed:', err);
            this.toastService.openSnackBar(
              'Failed to upload profile picture',
              'error',
            );
          },
        });

      this.subscriptions.push(uploadSub);
    };
    reader.readAsDataURL(file);
  }

  private handleSuccessfulUpload(fullImageData: string): void {
    this.hasExistingProfilePicture = true;
    this.setProfilePicture(fullImageData);
    this.storeProfileImage(fullImageData);
    this.toastService.openSnackBar(
      'Profile picture updated successfully!',
      'success',
    );
    this.cdr.detectChanges();
  }

  removeProfilePicture(): void {
    if (!this.hasExistingProfilePicture) return;

    const confirmDelete = confirm(
      'Are you sure you want to remove your profile picture?',
    );
    if (!confirmDelete) return;

    const removeSub = this.endpointService
      .removeProfilePicture(this.scouterId)
      .subscribe({
        next: (res: any) => {
          this.setDefaultAvatar();
          localStorage.removeItem('profile_image');
          this.toastService.openSnackBar('Profile picture removed', 'success');
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(' Failed to remove profile picture:', err);
          this.toastService.openSnackBar(
            'Failed to remove profile picture',
            'warning',
          );
        },
      });

    this.subscriptions.push(removeSub);
  }

  private setDefaultAvatar(): void {
    this.profileImage = null;
    this.profileData.profileImage = '';
    this.hasExistingProfilePicture = false;
    this.userService.setProfileImage('');
    this.cdr.detectChanges();
  }

  private storeProfileImage(imageData: string): void {
    try {
      localStorage.setItem('profile_image', imageData);
    } catch (err) {
      console.warn('Could not store profile image:', err);
    }
  }

  // ==================== SECURITY QUESTIONS METHODS ====================

  get securedQuestionsCount(): number {
    return this.securityQuestions.filter((q) => q.isHashed).length;
  }

  get totalQuestionsCount(): number {
    return this.securityQuestions.length;
  }

  /**
   * Test and fix security question endpoints
   */
  testAllSecurityQuestionEndpoints(): void {
    // removed: debugging helper for endpoint URLs
  }

  /**
   * Load security questions with answers
   */
  private loadSecurityQuestionsWithAnswers(): void {
    if (!this.scouterId) {
      console.error('❌ No scouterId for security questions');
      this.isLoadingSecurityQuestions = false;
      this.handleSecurityQuestionsError({ status: 400, message: 'No user ID' });
      return;
    }

    this.isLoadingSecurityQuestions = true;
    this.securityQuestionErrorMessage = '';
    this.securityQuestions = [];
    this.cdr.detectChanges();

    console.log('📝 Loading security questions for:', this.scouterId);

    // Try with answers endpoint with 30 second timeout
    const sub = this.authService
      .getMySecurityQuestionsWithAnswers(this.scouterId)
      .pipe(
        timeout(30000), // 30 second timeout for slow networks
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          console.log('✅ Security questions response received:', res);
          this.handleSecurityQuestionsResponse(res);
        },
        error: (err: any) => {
          console.error('❌ Primary endpoint failed:', err);

          // Check if timeout - if so, show empty state instead of retrying
          if (err.name === 'TimeoutError') {
            console.error('⏰ Primary endpoint timed out after 30 seconds');
            // Don't retry - just show empty state
            this.isLoadingSecurityQuestions = false;
            this.securityQuestions = [];
            this.securityQuestionErrorMessage =
              'Loading took too long. Try again or create new questions.';
            this.updateSecurityQuestionsState();
            this.cdr.detectChanges();
          } else {
            // Try fallback endpoint on other errors (404, 500, etc)
            this.loadBasicSecurityQuestions();
          }
        },
      });

    this.subscriptions.push(sub);
  }

  /**
   * Fallback to basic security questions endpoint
   */
  private loadBasicSecurityQuestions(): void {
    console.log('🔄 Retrying with fallback endpoint (30 second timeout)...');

    const fallbackSub = this.authService
      .getMySecurityQuestions(this.scouterId)
      .pipe(
        timeout(30000), // 30 second timeout for fallback too
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (res: any) => {
          console.log('✅ Fallback endpoint successful:', res);
          this.handleSecurityQuestionsResponse(res);
        },
        error: (err: any) => {
          console.error('❌ Fallback endpoint failed:', err);
          this.isLoadingSecurityQuestions = false;
          this.securityQuestions = [];

          if (err.name === 'TimeoutError') {
            this.securityQuestionErrorMessage =
              'Request timed out. Try again or create new questions.';
          } else if (err.status === 404) {
            this.securityQuestionErrorMessage =
              'No security questions found. Create some to get started.';
          } else {
            this.securityQuestionErrorMessage =
              'Unable to load security questions. Please try again later.';
          }

          this.updateSecurityQuestionsState();
          this.cdr.detectChanges();
        },
      });

    this.subscriptions.push(fallbackSub);
  }

  /**
   * Check if text looks like pure base64
   */
  private looksLikePureBase64(str: string): boolean {
    const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
    return base64Regex.test(str.trim()) && str.trim().length % 4 === 0;
  }

  /**
   * Check if string is base64
   */
  private isBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  }

  /**
   * Decode base64 string
   */
  private decodeBase64(base64String: string): any {
    try {
      // Clean the string (remove whitespace, etc.)
      const cleanString = base64String.trim();

      // Decode base64
      const decodedString = atob(cleanString);
      // Try to parse as JSON
      const parsed = JSON.parse(decodedString);

      return parsed;
    } catch (error) {
      console.error('Base64 decode/parse error:', error);

      // Try alternative decoding for malformed base64
      try {
        // Sometimes base64 might have URL encoding
        const decoded = decodeURIComponent(escape(atob(base64String)));
        // Alternative decode successful
        return JSON.parse(decoded);
      } catch (altError) {
        console.error('Alternative decode also failed:', altError);
        return null;
      }
    }
  }

  /**
   * Improved processing of security questions array
   */
  private processSecurityQuestionsWithAnswersArray(
    questionsArray: any[],
  ): void {
    if (!questionsArray || !Array.isArray(questionsArray)) {
      console.log('⚠️ No valid questions array found');
      this.securityQuestions = [];
      return;
    }

    console.log(` Processing ${questionsArray.length} security questions`);

    this.securityQuestions = questionsArray.map((item: any, index: number) => {
      // Extract question and answer
      const questionText = item.question || item.text || '';
      const answerText = item.answer || '';

      // Determine if answer is hashed
      const isHashed = this.isHashedAnswer(answerText);

      // Create question object
      const questionObj: SecurityQuestion = {
        id: item.id || `q-${Date.now()}-${index}`,
        question: questionText,
        answer: isHashed ? this.ANSWER_MASK : answerText,
        isHashed: isHashed,
        showAnswer: false,
        originalAnswer: answerText, // Store original for reference
        createdAt: item.createdAt || new Date().toISOString(),
      };

      // Log for debugging
      console.log(` Question ${index + 1}:`, {
        id: questionObj.id,
        questionPreview:
          questionText.substring(0, 30) +
          (questionText.length > 30 ? '...' : ''),
        hasAnswer: !!answerText,
        isHashed: isHashed,
        answerLength: answerText.length,
      });

      return questionObj;
    });

    console.log(` Loaded ${this.securityQuestions.length} security questions`);
  }

  /**
   * Check if answer is hashed (BCrypt format)
   */
  private isHashedAnswer(answer: string): boolean {
    if (!answer || typeof answer !== 'string') return false;

    // BCrypt hashes typically start with $2a$, $2b$, or $2y$ and are 60 chars
    const bcryptPattern = /^\$2[ayb]\$.{56}$/;

    // Check common hash patterns
    const isBCrypt = bcryptPattern.test(answer);
    const looksLikeHash =
      answer.length >= 60 && /^[a-zA-Z0-9$.+/]+$/.test(answer);

    return isBCrypt || looksLikeHash;
  }

  /**
   * Get display answer text
   */
  getDisplayAnswer(qa: SecurityQuestion): string {
    if (!qa.showAnswer) {
      return this.ANSWER_MASK;
    }

    if (qa.isHashed) {
      return '[Secured Answer]';
    }

    return qa.answer || '';
  }

  /**
   * Toggle answer visibility
   */
  toggleAnswerVisibility(index: number): void {
    const question = this.securityQuestions[index];
    if (!question) return;

    question.showAnswer = !question.showAnswer;

    // For hashed answers, we can't show the actual value
    // Just indicate it's hashed
    if (question.showAnswer && question.isHashed) {
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (question.showAnswer) {
          question.showAnswer = false;
          this.cdr.detectChanges();
        }
      }, 5000);
    }

    this.cdr.detectChanges();
  }

  /**
   * Initialize security questions for editing - ONLY 1 EMPTY INPUT
   */
  private initializeSecurityQuestions(): void {
    console.log(' Initializing security questions for editing...');

    // Start with existing questions
    this.tempSecurityQuestions = [];

    if (this.securityQuestions.length > 0) {
      // Copy existing questions
      this.tempSecurityQuestions = this.securityQuestions.map((q) => ({
        question: q.question,
        // Prefill a masked placeholder for hashed answers so the input shows something
        answer: q.isHashed ? this.ANSWER_MASK : q.answer,
        revealAttempt: '',
        revealed: false,
        verifyInProgress: false,
        showAnswer: false,
        isHashed: q.isHashed,
        // Preserve the real original answer (hash) when available; fall back to the displayed answer
        originalAnswer: q.originalAnswer ? q.originalAnswer : q.answer,
        masked: !!q.isHashed,
      }));

      // If we have space for more, add ONE empty slot
      if (this.securityQuestions.length < this.maxSecurityQuestions) {
        this.tempSecurityQuestions.push({
          question: '',
          answer: '',
          showAnswer: false,
          isHashed: false,
          originalAnswer: '',
        });
      }
    } else {
      // No existing questions - start with ONE empty question
      this.tempSecurityQuestions = [
        {
          question: '',
          answer: '',
          showAnswer: false,
          isHashed: false,
          originalAnswer: '',
        },
      ];
    }

    this.isEditingSecurityQuestions = true;
    this.updateSecurityQuestionCount();

    console.log(
      ' Initialized editing with:',
      this.tempSecurityQuestions.length,
      'questions',
    );
  }

  /**
   * Save security questions - PROFESSIONAL IMPLEMENTATION
   */
  async saveSecurityQuestions(): Promise<void> {
    console.log('💾 Saving security questions...');

    // Validate all questions
    if (!this.canSaveSecurityQuestions()) {
      this.toastService.openSnackBar(
        'Please fill in all questions and answers (minimum 5 chars for question, 3 for answer)',
        'warning',
      );
      return;
    }

    // Check for duplicates
    if (this.hasDuplicateQuestions()) {
      this.toastService.openSnackBar(
        'Duplicate questions found. Please use unique questions.',
        'warning',
      );
      return;
    }

    this.isSavingSecurityQuestions = true;
    this.securityQuestionErrorMessage = '';
    this.cdr.detectChanges();

    try {
      // Filter only filled questions
      const filledQuestions = this.tempSecurityQuestions.filter(
        (q) => q.question.trim() && q.answer.trim(),
      );

      if (filledQuestions.length === 0) {
        throw new Error('No valid questions to save');
      }

      // Hash all answers (new and existing)
      const questionsToSave = await Promise.all(
        filledQuestions.map(async (qa) => {
          // If editing existing question with hashed answer and answer wasn't changed
          if (
            qa.isHashed &&
            qa.originalAnswer &&
            (qa.answer === '' || qa.answer === this.ANSWER_MASK)
          ) {
            // Keep the original hashed answer
            return {
              question: qa.question.trim(),
              answer: qa.originalAnswer,
            };
          }

          // Hash new answer
          const hashedAnswer = await bcrypt.hash(
            qa.answer.trim().toLowerCase(),
            10,
          );
          return {
            question: qa.question.trim(),
            answer: hashedAnswer,
          };
        }),
      );

      const payload = {
        uniqueId: this.scouterId,
        securityQuestions: questionsToSave,
      };

      console.log(' Saving security questions:', {
        count: questionsToSave.length,
        scouterId: this.scouterId,
      });

      // Use update endpoint (works for both create and update)
      await this.updateSecurityQuestions(payload);
    } catch (error) {
      console.error(' Error saving security questions:', error);
      this.isSavingSecurityQuestions = false;

      let errorMessage = 'Failed to save security questions';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      this.securityQuestionErrorMessage = errorMessage;
      this.toastService.openSnackBar(errorMessage, 'error');
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle security questions response (unified)
   */
  private handleSecurityQuestionsResponse(res: any): void {
    this.isLoadingSecurityQuestions = false;
    this.securityQuestionErrorMessage = ''; // Clear any previous error
    console.log('✅ Processing security questions response:', res);

    // Clear any existing questions
    this.securityQuestions = [];

    // Try multiple possible response formats
    if (res?.data) {
      // Format 1: { data: [{question: "...", answer: "..."}] }
      if (Array.isArray(res.data)) {
        this.processSecurityQuestionsArray(res.data);
      }
      // Format 2: { data: { questions: [...] } }
      else if (res.data.questions && Array.isArray(res.data.questions)) {
        this.processSecurityQuestionsArray(res.data.questions);
      }
      // Format 3: { data: { securityQuestions: [...] } }
      else if (
        res.data.securityQuestions &&
        Array.isArray(res.data.securityQuestions)
      ) {
        this.processSecurityQuestionsArray(res.data.securityQuestions);
      }
    }
    // Format 4: Direct array
    else if (Array.isArray(res)) {
      this.processSecurityQuestionsArray(res);
    }
    // Format 5: { questions: [...] }
    else if (res?.questions && Array.isArray(res.questions)) {
      this.processSecurityQuestionsArray(res.questions);
    }
    // Format 6: { securityQuestions: [...] }
    else if (res?.securityQuestions && Array.isArray(res.securityQuestions)) {
      this.processSecurityQuestionsArray(res.securityQuestions);
    }

    // If we still have no questions, check if it's an empty array response
    if (
      this.securityQuestions.length === 0 &&
      Array.isArray(res?.data) &&
      res.data.length === 0
    ) {
      console.log('ℹ️  No security questions found (empty array)');
    }
    this.updateSecurityQuestionsState();
    console.log('✅ Security questions processed:', {
      count: this.securityQuestions.length,
      questions: this.securityQuestions,
    });
    this.cdr.detectChanges();
  }

  /**
   * Process array of security questions
   */
  private processSecurityQuestionsArray(questionsArray: any[]): void {
    if (!questionsArray || !Array.isArray(questionsArray)) {
      return;
    }

    this.securityQuestions = questionsArray.map((item: any, index: number) => {
      // Handle string items (just question text)
      if (typeof item === 'string') {
        return {
          id: `q-${index}`,
          question: item,
          answer: this.ANSWER_MASK,
          isHashed: true,
          originalAnswer: '',
          createdAt: new Date().toISOString(),
        };
      }

      // Handle object items with question property
      if (item && typeof item === 'object') {
        return {
          id: item.id || `q-${index}`,
          question: item.question || item.text || '',
          answer: item.answer ? this.ANSWER_MASK : '',
          isHashed: !!item.answer,
          originalAnswer: item.answer || '',
          createdAt:
            item.createdAt || item.dateCreated || new Date().toISOString(),
        };
      }

      // Fallback
      return {
        id: `q-${index}`,
        question: '',
        answer: '',
        isHashed: false,
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Handle security questions error
   */
  private handleSecurityQuestionsError(err: any): void {
    this.isLoadingSecurityQuestions = false;

    if (err.status === 404) {
      // 404 means no security questions exist yet (this is OK)
      console.log(' No security questions found (404 response)');
      this.securityQuestions = [];
      this.securityQuestionErrorMessage = '';
    } else {
      this.securityQuestionErrorMessage = 'Failed to load security questions';
      console.error(' Error loading security questions:', err);
    }

    this.updateSecurityQuestionsState();
    this.cdr.detectChanges();
  }

  // Update the save button text logic
  getSaveButtonText(): string {
    if (this.isSavingSecurityQuestions) {
      return 'Saving...';
    }

    if (this.securityQuestions.length > 0) {
      return 'Update All Questions';
    }

    return 'Save All Questions';
  }

  /**
   * Update security questions
   */
  private updateSecurityQuestions(payload: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const encodedScouterId = encodeURIComponent(this.scouterId);
      const url = `${environment.baseUrl}/${endpoints.updateScouterSecurityQuestions}?scouterId=${encodedScouterId}`;

      console.log(' Updating at:', url);

      const token = localStorage.getItem('access_token');

      fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const result = await response.json();
          console.log(' Update successful:', result);

          // Handle success
          this.handleSecurityQuestionsSaveSuccess(result);
          resolve();
        })
        .catch((error) => {
          console.error(' Update failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Create security questions with FULL scouter ID
   */
  private createSecurityQuestions(payload: any): void {
    // Ensure payload has the full scouter ID
    const createPayload = {
      uniqueId: this.scouterId, // FULL scouter ID
      securityQuestions: payload.securityQuestions,
    };

    console.log(' Create payload with FULL scouterId:', createPayload);

    this.authService.createScouterSecurityQuestion(createPayload).subscribe({
      next: (res: any) => {
        console.log(' Create successful:', res);
        this.handleSecurityQuestionsSaveSuccess(res);
      },
      error: (createErr) => {
        console.error(' Create failed:', createErr);

        // Handle "already exists" error specially
        if (
          createErr.status === 403 &&
          createErr.error?.message?.toLowerCase().includes('already exists')
        ) {
          console.log(' Security profile exists, retrying with update...');

          // If create says "already exists", then update should work
          this.authService
            .updateScouterSecurityQuestions(
              this.scouterId, // FULL scouter ID
              payload.securityQuestions,
            )
            .subscribe({
              next: (retryRes) => {
                console.log(' Retry update successful:', retryRes);
                this.handleSecurityQuestionsSaveSuccess(retryRes);
              },
              error: (retryErr) => {
                console.error(' Retry update failed:', retryErr);
                this.handleSecurityQuestionsSaveError(retryErr);
              },
            });
        } else {
          this.handleSecurityQuestionsSaveError(createErr);
        }
      },
    });
  }

  // profile-page.component.ts - Add a test method to verify endpoints

  testSecurityQuestionEndpoints(): void {
    // removed: helper for testing endpoints
  }

  private testEndpointWithFetch(url: string, method: string): void {
    // removed: debug fetch helper
  }

  /**
   * Check if answer should be fetchable
   */
  canFetchAnswer(qa: SecurityQuestion): boolean {
    return !!(qa.isHashed && qa.id);
  }

  /**
   * Handle security questions with answers response
   */
  private handleSecurityQuestionsWithAnswersResponse(res: any): void {
    this.isLoadingSecurityQuestions = false;
    console.log(' Processing security questions with answers:', res);

    // Clear any existing questions
    this.securityQuestions = [];

    // Check if data is a base64-encoded string
    if (res?.data && typeof res.data === 'string') {
      console.log(
        ' Data appears to be base64 encoded, attempting to decode...',
      );

      const decodedData = this.decodeBase64(res.data);

      if (decodedData && Array.isArray(decodedData)) {
        console.log(` Successfully decoded ${decodedData.length} questions`);
        this.processSecurityQuestionsWithAnswersArray(decodedData);
      } else {
        console.error(' Decoded data is not an array or is empty');
        this.securityQuestions = [];
      }
    }
    // Handle direct array format
    else if (Array.isArray(res?.data)) {
      this.processSecurityQuestionsWithAnswersArray(res.data);
    }
    // Handle direct response array
    else if (Array.isArray(res)) {
      this.processSecurityQuestionsWithAnswersArray(res);
    }
    // Handle other response formats
    else if (res?.questions && Array.isArray(res.questions)) {
      this.processSecurityQuestionsWithAnswersArray(res.questions);
    }

    this.updateSecurityQuestionsState();

    console.log(' Security questions loaded:', {
      count: this.securityQuestions.length,
      questions: this.securityQuestions.map((q, i) => ({
        index: i + 1,
        question: q.question.substring(0, 30) + '...',
        hasAnswer: !!q.answer,
        isHashed: q.isHashed,
        showAnswer: q.showAnswer,
      })),
    });

    this.cdr.detectChanges();
  }

  /**
   * Toggle answer visibility in edit mode
   */
  toggleEditAnswerVisibility(index: number): void {
    const question = this.tempSecurityQuestions[index];
    if (!question) return;

    question.showAnswer = !question.showAnswer;
    this.cdr.detectChanges();
  }

  /**
   * Verify existing hashed answer by comparing user input to stored hash
   * If verified, populate the answer field with plaintext so it can be edited
   */
  async verifyExistingAnswer(index: number): Promise<void> {
    const qa = this.tempSecurityQuestions[index];
    if (!qa || !qa.originalAnswer) return;

    const attempt = (qa.revealAttempt || '').trim();
    if (!attempt) {
      this.toastService.openSnackBar(
        'Enter your existing answer to verify',
        'warning',
      );
      return;
    }

    try {
      qa.verifyInProgress = true;
      this.cdr.detectChanges();

      // bcrypt.compare accepts plaintext and hash
      const ok = await bcrypt.compare(attempt.toLowerCase(), qa.originalAnswer);

      qa.verifyInProgress = false;
      if (ok) {
        qa.answer = attempt; // reveal plaintext entered by user
        qa.revealed = true;
        qa.masked = false;
        qa.revealAttempt = '';
        this.toastService.openSnackBar(
          'Answer verified — revealed for editing',
          'success',
        );
      } else {
        qa.revealed = false;
        this.toastService.openSnackBar(
          'Answer did not match our records',
          'error',
        );
      }
    } catch (err) {
      console.error('Error verifying existing answer', err);
      qa.verifyInProgress = false;
      qa.revealed = false;
      this.toastService.openSnackBar('Verification failed. Try again', 'error');
    } finally {
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle successful save
   */
  private handleSecurityQuestionsSaveSuccess(res: any): void {
    this.isSavingSecurityQuestions = false;

    // Update local questions from temp questions
    this.securityQuestions = this.tempSecurityQuestions
      .filter((q) => q.question.trim() && q.answer.trim())
      .map((qa, index) => ({
        id: `q-${Date.now()}-${index}`,
        question: qa.question.trim(),
        answer: '••••••••', // Hide answers
        isHashed: true,
        showAnswer: false,
        // Preserve hash if we have it; otherwise clear so next load will fetch from server
        originalAnswer: qa.originalAnswer ? qa.originalAnswer : '',
        createdAt: new Date().toISOString(),
      }));

    this.isEditingSecurityQuestions = false;
    this.updateSecurityQuestionsState();

    this.toastService.openSnackBar(
      'Security questions saved successfully!',
      'success',
    );

    // Reload from server to ensure sync
    setTimeout(() => {
      this.loadSecurityQuestionsWithAnswers();
    }, 1000);

    this.cdr.detectChanges();
  }

  /**
   * Handle error during security questions save
   */
  private handleSecurityQuestionsSaveError(err: any): void {
    this.isSavingSecurityQuestions = false;
    console.error(' Failed to save security questions:', err);

    let errorMessage = 'Failed to save security questions';

    if (err?.error?.message) {
      errorMessage = err.error.message;
    } else if (err?.message) {
      errorMessage = err.message;
    }

    // Special handling for "already exists" error
    if (
      err.status === 403 &&
      errorMessage.toLowerCase().includes('already exists')
    ) {
      errorMessage =
        'Security questions already exist. Please try editing them instead.';
    }

    this.securityQuestionErrorMessage = errorMessage;
    this.toastService.openSnackBar(errorMessage, 'error');
    this.cdr.detectChanges();
  }

  /**
   * Delete a question
   */
  async deleteQuestion(index: number): Promise<void> {
    const question = this.securityQuestions[index];
    if (!question) return;

    const confirmed = confirm(
      `Delete question: "${question.question.substring(0, 50)}..."?`,
    );
    if (!confirmed) return;

    // Remove from local array
    this.securityQuestions.splice(index, 1);
    this.updateSecurityQuestionsState();

    this.toastService.openSnackBar('Question removed', 'success');
    this.cdr.detectChanges();

    // Note: Since there's no delete endpoint, we'll need to save all remaining questions
    // This is handled when user saves
  }
  /**
   * Edit a specific question
   */
  editQuestion(index: number): void {
    this.isEditingSecurityQuestions = true;
    this.editingQuestionIndex = index;

    // Initialize with current questions
    this.initializeSecurityQuestions();

    // Scroll to the edited question
    setTimeout(() => {
      const element = document.querySelector(
        `[data-question-index="${index}"]`,
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    this.cdr.detectChanges();
  }

  /**
   * Add new question (only when in edit mode)
   */
  addNewQuestion(): void {
    if (this.tempSecurityQuestions.length >= this.maxSecurityQuestions) {
      this.toastService.openSnackBar(
        `Maximum of ${this.maxSecurityQuestions} security questions allowed`,
        'warning',
      );
      return;
    }

    // Add ONE new empty question
    this.tempSecurityQuestions.push({
      question: '',
      answer: '',
      showAnswer: false,
      isHashed: false,
      originalAnswer: '',
      masked: false,
      revealAttempt: '',
      revealed: false,
      verifyInProgress: false,
    });

    this.updateSecurityQuestionCount();

    // Scroll to new question
    setTimeout(() => {
      const lastIndex = this.tempSecurityQuestions.length - 1;
      const element = document.querySelector(
        `[data-question-index="${lastIndex}"]`,
      );
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);

    this.cdr.detectChanges();
  }

  /**
   * Remove question from temp array
   */
  removeQuestion(index: number): void {
    if (this.tempSecurityQuestions.length <= 1) {
      this.toastService.openSnackBar(
        'Must have at least one question',
        'warning',
      );
      return;
    }

    this.tempSecurityQuestions.splice(index, 1);

    if (this.editingQuestionIndex === index) {
      this.editingQuestionIndex = null;
    }

    this.updateSecurityQuestionCount();
    this.cdr.detectChanges();
  }

  /**
   * Check if can save security questions
   */
  canSaveSecurityQuestions(): boolean {
    if (this.tempSecurityQuestions.length === 0) return false;

    // Check all questions have at least 5 chars
    const allQuestionsValid = this.tempSecurityQuestions.every(
      (q) => q.question.trim().length >= 5,
    );

    // Check answers: if editing existing hashed answer, blank is OK
    const allAnswersValid = this.tempSecurityQuestions.every((q) => {
      // If editing existing hashed answer and user didn't change it
      if (q.isHashed && q.originalAnswer && q.answer === '') {
        return true; // Blank is OK (keeps existing)
      }

      // Otherwise, need at least 3 chars
      return q.answer.trim().length >= 3;
    });

    return allQuestionsValid && allAnswersValid;
  }

  /**
   * Check for duplicate questions
   */
  hasDuplicateQuestions(): boolean {
    const questions = this.tempSecurityQuestions
      .map((q) => q.question.trim().toLowerCase())
      .filter((q) => q.length > 0);

    const uniqueQuestions = new Set(questions);
    return uniqueQuestions.size !== questions.length;
  }

  /**
   * Update the security questions state after changes
   */
  private updateSecurityQuestionsState(): void {
    // Use the actual questions count, not temp
    this.securityQuestionCount = this.securityQuestions.length;

    console.log(' Security questions state updated:', {
      count: this.securityQuestionCount,
      max: this.maxSecurityQuestions,
      canAddMore: this.securityQuestionCount < this.maxSecurityQuestions,
    });

    // Update badge text
    const badge = document.querySelector('.security-questions-badge');
    if (badge) {
      badge.textContent = `${this.securityQuestionCount}/${this.maxSecurityQuestions}`;
    }
  }

  /**
   * Improved method to check if we can add more questions
   */
  canAddMoreQuestions(): boolean {
    return this.securityQuestions.length < this.maxSecurityQuestions;
  }

  /**
   * Update security question count
   */
  private updateSecurityQuestionCount(): void {
    if (this.isEditingSecurityQuestions) {
      this.securityQuestionCount = this.tempSecurityQuestions.length;
    } else {
      this.securityQuestionCount = this.securityQuestions.length;
    }
  }

  /**
   * Toggle edit mode for security questions
   */
  toggleEditSecurityQuestions(): void {
    if (this.isEditingSecurityQuestions) {
      this.cancelEditSecurityQuestions();
    } else {
      this.isEditingSecurityQuestions = true;
      this.editingQuestionIndex = null;
      this.initializeSecurityQuestions();
    }
    this.cdr.detectChanges();
  }

  /**
   * Cancel editing
   */
  cancelEditSecurityQuestions(): void {
    this.isEditingSecurityQuestions = false;
    this.editingQuestionIndex = null;
    this.securityQuestionErrorMessage = '';
    this.cdr.detectChanges();
  }

  /**
   * Improved method to add more questions
   */
  addMoreQuestions(): void {
    if (!this.canAddMoreQuestions()) {
      this.toastService.openSnackBar(
        `Maximum of ${this.maxSecurityQuestions} questions reached`,
        'warning',
      );
      return;
    }

    // Enter edit mode and initialize with current questions
    this.isEditingSecurityQuestions = true;
    this.initializeSecurityQuestions();

    // Add an empty question slot
    this.tempSecurityQuestions.push({ question: '', answer: '' });

    // Update the count display
    this.updateSecurityQuestionCount();

    this.cdr.detectChanges();
  }

  // Add these methods to your ProfilePageComponent class in the TypeScript file:

  // ==================== TEMPLATE HELPER METHODS ====================

  /**
   * Check if a question has invalid length
   */
  hasInvalidQuestion(qa: SecurityQuestion): boolean {
    return qa.question?.trim()?.length > 0 && qa.question?.trim()?.length < 5;
  }

  /**
   * Check if an answer has invalid length
   */
  hasInvalidAnswer(qa: SecurityQuestion): boolean {
    return qa.answer?.trim()?.length > 0 && qa.answer?.trim()?.length < 3;
  }

  /**
   * Get validation message for question
   */
  getQuestionValidationMessage(qa: SecurityQuestion): string {
    if (this.hasInvalidQuestion(qa)) {
      return 'Minimum 5 characters';
    }
    return '';
  }

  /**
   * Get validation message for answer
   */
  getAnswerValidationMessage(qa: SecurityQuestion): string {
    if (this.hasInvalidAnswer(qa)) {
      return 'Minimum 3 characters';
    }
    return '';
  }

  /**
   * Check if any questions are invalid
   */
  hasInvalidQuestions(): boolean {
    return this.tempSecurityQuestions.some(
      (qa) =>
        qa.question?.trim()?.length > 0 && qa.question?.trim()?.length < 5,
    );
  }

  /**
   * Check if any answers are invalid
   */
  hasInvalidAnswers(): boolean {
    return this.tempSecurityQuestions.some(
      (qa) => qa.answer?.trim()?.length > 0 && qa.answer?.trim()?.length < 3,
    );
  }

  /**
   * Check if any questions or answers have been filled
   */
  hasAnyQuestionsOrAnswers(): boolean {
    return this.tempSecurityQuestions.some(
      (qa) => qa.question?.trim() || qa.answer?.trim(),
    );
  }

  // ==================== TEMPLATE METHODS ====================

  handleImageError(event: any): void {
    console.error(' Error loading profile image');
    this.hasExistingProfilePicture = false;
    this.profileImage = null;
    this.cdr.detectChanges();
  }

  triggerFileInput(): void {
    if (this.fileInput?.nativeElement) {
      console.log(' Opening profile picture picker');
      this.fileInput.nativeElement.click();
    }
  }

  public openProfileImagePicker(): void {
    this.triggerFileInput();
  }

  focusOrgInput(): void {
    if (!this.isEditing) return;
    if (this.orgInput && this.orgInput.nativeElement) {
      this.orgInput.nativeElement.focus();
    }
  }

  trackByOrgType(index: number, org: string): string {
    return `${org}_${index}`;
  }

  onOrgTypeTyping(event: any): void {
    this.orgTypeInput = event.target.value;
  }

  async openConfirmationPopup(): Promise<void> {
    if (this.isEditing) {
      const confirmed = await this.showSaveConfirmation();
      if (confirmed) {
        this.saveProfile();
      }
    } else {
      this.toggleEdit();
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.saveButtonText = this.isEditing ? 'Save Profile' : 'Update Profile';
    this.cdr.detectChanges();
  }

  addOrgTypeFromInput(event: any): void {
    event.preventDefault();
    if (!this.isEditing) return;

    const newType = this.orgTypeInput.trim();
    if (newType && !this.selectedOrgTypes.includes(newType)) {
      this.selectedOrgTypes.push(newType);
      this.orgTypeInput = '';
      this.cdr.detectChanges();
    }
  }

  removeOrgType(index: number): void {
    if (!this.isEditing) return;
    this.selectedOrgTypes.splice(index, 1);
    this.cdr.detectChanges();
  }

  // ==================== UTILITY METHODS ====================

  private async showSaveConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      try {
        const modal = await this.modalCtrl.create({
          component: UpdateProfileConfirmationPopupModalComponent,
          cssClass: 'confirmation-modal',
          backdropDismiss: true,
        });

        await modal.present();
        const { role } = await modal.onWillDismiss();
        resolve(role === 'confirm');
      } catch (error) {
        console.error(' Error showing confirmation modal:', error);
        resolve(false);
      }
    });
  }

  private async showDeleteConfirmation(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(
        `Are you sure you want to delete this question?\n\n"${question}"`,
      );
      resolve(confirmed);
    });
  }

  // ==================== NAVIGATION & SCROLL ====================

  private redirectToLogin(): void {
    this.router.navigate(['/auth/login'], {
      replaceUrl: true,
      queryParams: {
        redirectReason: 'session_expired',
        returnUrl: this.router.url,
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  scrollToProfilePicture(): void {
    if (this.profilePicture?.nativeElement) {
      const y = this.profilePicture.nativeElement.offsetTop - 20;
      this.pageContent.scrollToPoint(0, y, 600);
    }
  }

  scrollToSecurityQuestions(): void {
    if (this.securityQuestionsSection?.nativeElement) {
      const y = this.securityQuestionsSection.nativeElement.offsetTop;
      this.pageContent.scrollToPoint(0, y, 600);
    }
  }

  // ==================== CLEANUP ====================

  reloadComponent(): void {
    console.log(' Reloading component...');

    this.clearSubscriptions();

    this.profileData = {
      fullName: '',
      phoneNumber: '',
      email: '',
      location: '',
      scoutingPurpose: '',
      payRange: '',
      organizationTypes: [],
      profileImage: '',
    };

    this.selectedOrgTypes = [];
    this.isEditing = false;
    this.isLoadingProfile = true;
    this.securityQuestions = [];
    this.tempSecurityQuestions = [{ question: '', answer: '' }];
    this.isEditingSecurityQuestions = false;

    this.initializeScouterId();

    if (this.scouterId) {
      this.loadDataWithTracking();
    }

    this.cdr.detectChanges();
    console.log(' Component reloaded');
  }

  ngOnDestroy(): void {
    console.log(' Cleaning up ProfilePageComponent...');
    this.clearSubscriptions();
    this.destroy$.next();
    this.destroy$.complete();
    console.log(' ProfilePageComponent destroyed');
  }
}
