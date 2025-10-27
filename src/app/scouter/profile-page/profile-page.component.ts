import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular';
import { UpdateProfileConfirmationPopupModalComponent } from 'src/app/utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';
import { UserService } from 'src/app/services/user.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { Subject, Subscription } from 'rxjs';
import * as bcrypt from 'bcryptjs';
import { filter, takeUntil } from 'rxjs/operators';

interface SecurityQuestion {
  question: string;
  answer: string;
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

  // Component State - SIMPLIFIED like working component
  isEditingSecurityQuestions = false;
  tempSecurityQuestions: SecurityQuestion[] = [{ question: '', answer: '' }];
  currentYear: number = new Date().getFullYear();
  headerHidden = false;

  profileImage: string | null = null;
  selectedFile: File | null = null;
  scouterId: string = ''; // CHANGED: Use string like working component
  isEditing = false; // CHANGED: Default to false (view mode)
  saveButtonText = 'Update Profile'; // CHANGED: Default to Update
  hasExistingProfilePicture = false;
  isLoadingSecurityQuestions = false;
  editingQuestionIndex: number | null = null;
  orgTypeInput = '';
  selectedOrgTypes: string[] = [];
  securityQuestions: SecurityQuestion[] = [];
  showQuestions = false;
  isLoadingProfile = false;
  isSavingProfile = false;

  // Profile Data - SIMPLIFIED like working component
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

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private location: Location,
    private modalCtrl: ModalController,
    private toastService: ToastsService,
    public userService: UserService,
    private endpointService: ScouterEndpointsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Simple debug first
    this.simpleDebug();

    // Get scouterId FIRST like working component
    this.initializeScouterId();

    // Debug profile picture state
    this.debugProfilePicture();

    // Load data immediately after getting scouterId
    this.loadInitialData();

    // Subscribe to profile data updates
    this.userService.profileData$
      .pipe(takeUntil(this.destroy$))
      .subscribe((profile) => {
        if (profile) {
          this.bindUserProfile(profile);
        }
      });
  }

  // Add this method to debug the actual backend response
  private debugBackendResponse(apiResponse: any): void {
    // console.log('🔍 DEBUG BACKEND RESPONSE STRUCTURE:');
    // console.log('Full response:', apiResponse);
    // console.log('Response keys:', Object.keys(apiResponse || {}));
    // console.log('Has data:', !!apiResponse?.data);
    // console.log('Has details:', !!apiResponse?.details);
    // console.log('Has organizationType:', !!apiResponse?.organizationType);
    // console.log('organizationType value:', apiResponse?.organizationType);
    // console.log('organizationType type:', typeof apiResponse?.organizationType);
    //
    // if (apiResponse?.data) {
    //   console.log('Data keys:', Object.keys(apiResponse.data));
    //   console.log('Data organizationType:', apiResponse.data?.organizationType);
    // }
    //
    // if (apiResponse?.details) {
    //   console.log('Details keys:', Object.keys(apiResponse.details));
    //   console.log(
    //     'Details organizationType:',
    //     apiResponse.details?.organizationType
    //   );
    // }
  }

  // Add this method to debug current form state
  debugFormState(): void {
    // console.log('🐛 CURRENT FORM STATE:');
    // console.log('profileData:', this.profileData);
    // console.log('selectedOrgTypes:', this.selectedOrgTypes);
    // console.log('isEditing:', this.isEditing);
    // console.log('isSavingProfile:', this.isSavingProfile);

    // Check if form fields have the right values
    const formFields = [
      'fullName',
      'phoneNumber',
      'email',
      'location',
      'scoutingPurpose',
      'payRange',
      'organizationTypes',
    ];

    formFields.forEach((field) => {
      // console.log(
      //   `📝 ${field}:`,
      //   this.profileData[field as keyof typeof this.profileData]
      // );
    });
  }

  // Debug profile picture state
  private debugProfilePicture(): void {
    // console.log('🐛 PROFILE PICTURE DEBUG:');

    // Check localStorage
    const cachedImage = localStorage.getItem('profile_image');
    // console.log('📦 Cached image in localStorage:', !!cachedImage);
    if (cachedImage) {
      // console.log('📦 Cached image length:', cachedImage.length);
      // console.log(
      //   '📦 Cached image starts with:',
      //   cachedImage.substring(0, 50) + '...'
      // );
    }

    // Check current state
    // console.log('🖼️ Current profileImage:', !!this.profileImage);
    // console.log(
    //   '📸 hasExistingProfilePicture:',
    //   this.hasExistingProfilePicture
    // );
    //console.log('🆔 scouterId:', this.scouterId);

    // Check UserService state
    // console.log(
    //   '👤 UserService profile image:',
    //   !!this.userService.getProfileImage()
    // );
  }

  // Simple debug without JSON parsing issues
  private simpleDebug(): void {
    //console.log('🔍 SIMPLE AUTH DEBUG:');

    // Check user_data only
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // console.log('💾 user_data found:', {
        //   email: parsed?.email,
        //   'details.email': parsed?.details?.email,
        //   'details.user.email': parsed?.details?.user?.email,
        //   'details.session.email': parsed?.details?.session?.email,
        // });
      } catch (e) {
        console.log('💾 user_data (raw):', userData);
      }
    } else {
      console.log('💾 user_data: Not found');
    }

    // Check auth service
    const userDetails = this.authService.decodeScouterDetails();
    // console.log('🔐 Auth Service:', {
    //   email: userDetails?.email,
    //   'details.email': userDetails?.details?.email,
    //   'details.user.email': userDetails?.details?.user?.email,
    //   'details.session.email': userDetails?.details?.session?.email,
    // });

    // Check registration email
    const regEmail = localStorage.getItem('registration_email');
    console.log('📧 Registration email:', regEmail);
  }

  // Direct method to get email - no debugging
  private getEmailDirectly(): string {
    // 1. Try localStorage user_data first
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        const userData = JSON.parse(userDataStr);
        const email =
          userData?.email ||
          userData?.details?.email ||
          userData?.details?.user?.email ||
          userData?.details?.session?.email;
        if (email) {
          console.log('✅ Email found in localStorage:', email);
          return email;
        }
      } catch (e) {
        console.log('❌ Could not parse user_data');
      }
    }

    // 2. Try auth service
    const userDetails = this.authService.decodeScouterDetails();
    if (userDetails) {
      const email =
        userDetails?.email ||
        userDetails?.details?.email ||
        userDetails?.details?.user?.email ||
        userDetails?.details?.session?.email;
      if (email) {
        console.log('✅ Email found in auth service:', email);
        return email;
      }
    }

    // 3. Try registration email
    const regEmail = localStorage.getItem('registration_email');
    if (regEmail) {
      console.log('✅ Email found in registration:', regEmail);
      return regEmail;
    }

    console.log('❌ No email found in any source');
    return '';
  }

  // Test the update endpoint
  testEndpoint(): void {
    if (!this.scouterId) {
      console.error('❌ No scouterId for testing');
      return;
    }

    const testPayload = {
      fullName: 'Test User ' + Date.now(),
      phoneNumber: '08012345678',
      email: this.profileData.email || 'test@example.com',
      location: 'Test Location',
      scoutingPurpose: 'Testing',
      organizationType: ['TEST'], // send array
      payRange: '50k',
    };

    console.log('🧪 TESTING ENDPOINT WITH:', testPayload);

    this.endpointService
      .updateScouterProfile(this.scouterId, testPayload)
      .subscribe({
        next: (res) => {
          console.log('✅ TEST SUCCESS:', res);
          this.toastService.openSnackBar(
            'Endpoint test successful!',
            'success'
          );
        },
        error: (err) => {
          console.error('❌ TEST FAILED:', err);
          this.toastService.openSnackBar(
            'Endpoint test failed: ' + err.message,
            'error'
          );
        },
      });
  }

  // Add this method to test the backend directly
  testBackendEndpointDirectly(): void {
    if (!this.scouterId) return;

    const testPayload = {
      fullName: 'TEST USER ' + Date.now(),
      phoneNumber: '08000000000',
      email: this.profileData.email,
      location: 'Test Location',
      scoutingPurpose: 'Testing',
      organizationType: ['TEST'], // send array
      payRange: '100k',
    };

    console.log('🧪 DIRECT BACKEND TEST:', testPayload);

    // Use fetch API to see raw response
    fetch(
      `https://oniduuru-staging.shoftafrica.com/scouters/v1/edit-scouter-profile/${encodeURIComponent(
        this.scouterId
      )}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(testPayload),
      }
    )
      .then((response) => {
        console.log('🔍 RAW RESPONSE STATUS:', response.status);
        console.log('🔍 RAW RESPONSE HEADERS:', response.headers);
        return response.text(); // Get raw text to see what's actually returned
      })
      .then((text) => {
        console.log('🔍 RAW RESPONSE BODY:', text);
        try {
          const json = JSON.parse(text);
          console.log('🔍 PARSED RESPONSE:', json);
        } catch (e) {
          console.log('🔍 RESPONSE IS NOT JSON:', text);
        }
      })
      .catch((error) => {
        console.error('🔍 FETCH ERROR:', error);
      });
  }

  // ==================== CORE METHODS - MATCHING WORKING FLOW ====================

  private initializeScouterId(): void {
    // MATCHING: Use the same approach as working component
    const userDetails = this.authService.decodeScouterDetails();
    this.scouterId =
      userDetails?.details?.user?.scouterId || userDetails?.scouterId || '';

    console.log('✅ ScouterId initialized:', this.scouterId);

    if (!this.scouterId) {
      console.error('❌ No scouterId found');
      this.redirectToLogin();
      return;
    }
  }

  private loadInitialData(): void {
    if (!this.scouterId) {
      console.error('❌ Cannot load data: No scouterId');
      return;
    }

    this.isLoadingProfile = true;

    // Load all data in parallel like working component
    this.loadUserProfileData();
    this.loadProfilePicture();
    this.loadSecurityQuestions();
  }

  private loadUserProfileData(): void {
    this.endpointService.fetchScouterProfile(this.scouterId).subscribe({
      next: (res: any) => {
        this.isLoadingProfile = false;
        console.log('📥 Profile response:', res);

        // MATCHING: Extract data like working component
        const userData = res?.details || res?.data?.details || res?.data || res;

        if (userData) {
          // If backend doesn't return email, inject it from auth sources
          if (!userData.email) {
            const authEmail = this.extractEmailFromAllSources();
            userData.email = authEmail;
            console.log('📧 Injected email from auth sources:', authEmail);
          }

          this.bindUserProfile(userData);
          this.updateEditStateBasedOnProfile(userData);
        } else {
          this.initializeWithUserProfileData();
        }
      },
      error: (err) => {
        this.isLoadingProfile = false;
        console.error('❌ Profile load error:', err);
        this.initializeWithUserProfileData();

        if (err.status === 401) {
          this.toastService.openSnackBar(
            'Session expired. Please login again.',
            'error'
          );
          this.redirectToLogin();
        }
      },
    });
  }

  // Helper method to extract email from all possible sources
  private extractEmailFromAllSources(): string {
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
        if (email) return email;
      } catch (e) {
        console.error('❌ Error parsing user_data:', e);
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
      if (email) return email;
    }

    // 3. User Service
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.email) return currentUser.email;

    // 4. Registration email
    const regEmail = localStorage.getItem('registration_email');
    if (regEmail) return regEmail;

    return '';
  }

  // ==================== FIXED EMAIL EXTRACTION ====================

  // Add this method to test email extraction
  testEmailExtraction(): void {
    console.log('🧪 TESTING EMAIL EXTRACTION FROM ALL SOURCES:');

    // 1. localStorage user_data
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      try {
        const parsed = JSON.parse(storedUserData);
        console.log('📧 From localStorage user_data:');
        console.log('- Direct email:', parsed?.email);
        console.log('- details.email:', parsed?.details?.email);
        console.log('- details.user.email:', parsed?.details?.user?.email);
        console.log(
          '- details.session.email:',
          parsed?.details?.session?.email
        );
      } catch (e) {
        console.error('❌ Error parsing user_data:', e);
      }
    }

    // 2. Auth Service
    const userDetails = this.authService.decodeScouterDetails();
    console.log('📧 From Auth Service:');
    console.log('- Direct email:', userDetails?.email);
    console.log('- details.email:', userDetails?.details?.email);
    console.log('- details.user.email:', userDetails?.details?.user?.email);
    console.log(
      '- details.session.email:',
      userDetails?.details?.session?.email
    );

    // 3. User Service
    const currentUser = this.authService.getCurrentUser();
    console.log('📧 From User Service:', currentUser?.email);

    // 4. Registration email
    const regEmail = localStorage.getItem('registration_email');
    console.log('📧 Registration email:', regEmail);
  }

  // MATCHING: Initialize with user profile data like working component
  private initializeWithUserProfileData(): void {
    console.log('🔄 Initializing with user profile data...');

    // Use direct email extraction
    const email = this.getEmailDirectly();
    console.log('📧 FINAL EXTRACTED EMAIL:', email);

    // Try to get user data structure
    let userData = null;
    const userDataStr = localStorage.getItem('user_data');
    if (userDataStr) {
      try {
        userData = JSON.parse(userDataStr);
      } catch (e) {
        console.log('❌ Could not parse user_data for profile');
      }
    }

    // If no userData from localStorage, try auth service
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

  // Add this to your component as a fallback
  private getEmailFromUserService(): string {
    const currentUser = this.authService.getCurrentUser();
    return currentUser?.email || '';
  }

  private bindUserProfile(user: any): void {
    console.log('🔍 Binding user profile:', user);

    // Parse organization types exactly like working component
    const orgTypes = this.parseOrganizationTypes(user.organizationType);

    // Extract email from multiple possible locations
    const email =
      user?.email ||
      user?.details?.email ||
      user?.details?.session?.email ||
      user?.details?.user?.email ||
      this.getEmailFromUserService() ||
      '';

    console.log('📧 FINAL Email extraction:', email);

    // CRITICAL FIX: Update ALL profile data fields, not just some
    this.profileData = {
      fullName:
        user.fullName ||
        user.details?.user?.fullName ||
        this.profileData.fullName,
      phoneNumber:
        user.phoneNumber ||
        user.details?.user?.phoneNumber ||
        this.profileData.phoneNumber,
      email: email || this.profileData.email,
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

    // Update selectedOrgTypes only if we have valid new data
    if (orgTypes.length > 0) {
      this.selectedOrgTypes = [...orgTypes];
    }

    console.log('✅ Profile data bound:', this.profileData);
    console.log('✅ Selected org types:', this.selectedOrgTypes);
    this.cdr.detectChanges();
  }

  private parseOrganizationTypes(orgType: any): string[] {
    console.log('🔍 PARSING ORGANIZATION TYPES - RAW INPUT:', orgType);

    if (!orgType) return [];

    try {
      // If it's a string that looks like JSON, parse it
      if (typeof orgType === 'string') {
        // Remove any extra quotes or escaping
        const cleanString = orgType.replace(/\\"/g, '"');

        if (
          cleanString.trim().startsWith('[') &&
          cleanString.trim().endsWith(']')
        ) {
          const parsed = JSON.parse(cleanString);
          if (Array.isArray(parsed)) {
            return parsed.filter(
              (item) => item && typeof item === 'string' && item.trim() !== ''
            );
          }
        }

        // Handle comma-separated string
        if (cleanString.includes(',')) {
          return cleanString
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item !== '');
        }

        // Single value
        return cleanString.trim() ? [cleanString.trim()] : [];
      }

      // If it's already an array
      if (Array.isArray(orgType)) {
        return orgType.filter(
          (item) => item && typeof item === 'string' && item.trim() !== ''
        );
      }
    } catch (error) {
      console.error('❌ Error parsing organization types:', error);
    }

    return [];
  }

  private tryDecodeString(str: string): string {
    try {
      // Try URL decoding first
      return decodeURIComponent(escape(atob(str)));
    } catch {
      return str;
    }
  }

  private updateEditStateBasedOnProfile(profile: any): void {
    // MATCHING: Determine edit state based on profile completeness
    const hasCompleteProfile =
      profile.fullName && profile.phoneNumber && profile.email;

    // Default to view mode if profile is complete, edit mode if incomplete
    this.isEditing = !hasCompleteProfile;
    this.saveButtonText = this.isEditing ? 'Save Profile' : 'Update Profile';

    console.log('🔄 Edit state:', {
      isEditing: this.isEditing,
      hasCompleteProfile,
    });
  }

  // ==================== PROFILE OPERATIONS - MATCHING WORKING FLOW ====================

  public saveProfile(): void {
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

    // FIX: Ensure organizationType is sent as an array (backend expects an array)
    console.log('📦 Organization Types to send:', this.selectedOrgTypes);

    const payload = {
      fullName: this.profileData.fullName.trim(),
      phoneNumber: this.profileData.phoneNumber.trim(),
      email: this.profileData.email.trim(),
      location: this.profileData.location?.trim() || '',
      scoutingPurpose: this.profileData.scoutingPurpose?.trim() || '',
      payRange: this.profileData.payRange?.trim() || '',
      organizationType: this.selectedOrgTypes || [], // Send real array; backend expects array
    };

    console.log('🚀 FINAL UPDATE PAYLOAD:', payload);

    console.log('🔍 FORM STATE BEFORE SAVE:');
    this.debugFormState();

    this.endpointService
      .updateScouterProfile(this.scouterId, payload)
      .subscribe({
        next: (res: any) => {
          console.log('✅ BACKEND RESPONSE:', res);
          this.handleSuccessfulSave(payload, res);

          console.log('🔍 FORM STATE AFTER SAVE:');
          this.debugFormState();

          // Verify the update worked
          setTimeout(() => {
            this.verifyBackendUpdate();
          }, 1000);
        },
        error: (err: any) => {
          console.error('❌ SAVE ERROR:', err);
          this.isSavingProfile = false;
          this.saveButtonText = this.isEditing
            ? 'Save Profile'
            : 'Update Profile';

          let errorMessage = 'Failed to save profile';
          if (err?.error?.message) errorMessage = err.error.message;
          else if (err?.message) errorMessage = err.message;

          this.toastService.openSnackBar(errorMessage, 'error');
          this.cdr.detectChanges();
        },
      });
  }

  // Debug method for save state
  debugSaveState(): void {
    console.log('🐛 SAVE STATE DEBUG:');
    console.log('- selectedOrgTypes:', this.selectedOrgTypes);
    console.log(
      '- profileData.organizationTypes:',
      this.profileData.organizationTypes
    );
    console.log('- isSavingProfile:', this.isSavingProfile);
    console.log('- isEditing:', this.isEditing);
    console.log('- scouterId:', this.scouterId);

    const savedData = localStorage.getItem('user_profile_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log(
          '- localStorage organizationTypes:',
          parsed.organizationTypes
        );
      } catch (e) {
        console.error('Error parsing saved data:', e);
      }
    }
  }

  // Force refresh method
  forceRefresh(): void {
    console.log('🔄 Forcing data refresh...');
    this.loadUserProfileData();
  }

  private handleSuccessfulSave(savedPayload: any, apiResponse: any): void {
    console.log('🎯 HANDLING SUCCESSFUL SAVE');

    // DEBUG: See what the backend actually returned
    this.debugBackendResponse(apiResponse);

    // CRITICAL FIX: Always preserve the organization types we just sent
    const preservedOrganizationTypes = this.selectedOrgTypes;

    let updatedProfile;

    if (
      apiResponse &&
      (apiResponse.data || apiResponse.details || apiResponse.success)
    ) {
      // Use the data from backend response
      const responseData =
        apiResponse.data || apiResponse.details || apiResponse;

      // Parse organization types from response, but fallback to what we sent
      const responseOrgTypes = this.parseOrganizationTypes(
        responseData.organizationType
      );
      const finalOrgTypes =
        responseOrgTypes.length > 0
          ? responseOrgTypes
          : preservedOrganizationTypes;

      // CRITICAL FIX: Properly merge ALL data including organization types
      updatedProfile = {
        ...this.profileData, // Keep existing profile data
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
        organizationTypes: finalOrgTypes, // USE THE PRESERVED TYPES
        profileImage: this.profileData.profileImage, // Preserve profile image
        scouterId: this.scouterId,
      };
    } else {
      // Fallback to payload data if no response, but PRESERVE ALL DATA
      console.warn(
        '⚠️ No response data from backend, using local data with preserved org types'
      );
      updatedProfile = {
        ...this.profileData, // Keep ALL existing profile data
        ...savedPayload, // Add the saved payload
        organizationTypes: preservedOrganizationTypes, // CRITICAL: Use the types we just sent
      };
    }

    console.log('✅ UPDATED PROFILE DATA FROM BACKEND:', updatedProfile);
    console.log('✅ PRESERVED ORGANIZATION TYPES:', preservedOrganizationTypes);

    // Update services
    this.userService.updateFullProfile(updatedProfile);
    this.authService.updateCurrentUser(updatedProfile);

    // Cache the updated profile data
    this.cacheProfileData(updatedProfile);

    // CRITICAL FIX: Update ALL local state including form fields
    this.profileData = { ...updatedProfile };
    this.selectedOrgTypes = [...preservedOrganizationTypes]; // Ensure UI reflects the saved types

    // Switch to view mode
    this.isEditing = false;
    this.saveButtonText = 'Update Profile';
    this.isSavingProfile = false;

    this.toastService.openSnackBar('Profile updated successfully!', 'success');
    this.cdr.detectChanges();

    // Force reload from backend to ensure sync
    setTimeout(() => {
      this.loadUserProfileData();
    }, 1000);
  }

  // Add this method to your component
  verifyBackendUpdate(): void {
    if (!this.scouterId) return;

    console.log('🔍 VERIFYING BACKEND STATE');

    // Fetch fresh data from backend to see current state
    this.endpointService.fetchScouterProfile(this.scouterId).subscribe({
      next: (currentData: any) => {
        console.log('📊 CURRENT BACKEND DATA:', currentData);
        console.log('📊 CURRENT LOCAL DATA:', this.profileData);

        const backendOrgTypes = this.parseOrganizationTypes(
          currentData?.organizationType
        );
        console.log('🔄 ORGANIZATION TYPES COMPARISON:');
        console.log(' - Backend:', backendOrgTypes);
        console.log(' - Local:', this.selectedOrgTypes);
      },
      error: (err) => {
        console.error('❌ Failed to verify backend state:', err);
      },
    });
  }

  private cacheProfileData(profileData: any): void {
    try {
      localStorage.setItem('user_profile_data', JSON.stringify(profileData));
      console.log('💾 Profile data cached locally');
    } catch (err) {
      console.warn('Could not cache profile data:', err);
    }
  }

  // ==================== PROFILE PICTURE OPERATIONS - MATCHING WORKING FLOW ====================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // MATCHING: Validate file type like working component
    const fileType = file.type.split('/')[1];
    if (!['jpeg', 'png'].includes(fileType)) {
      this.toastService.openSnackBar(
        'Only jpeg or png file format is acceptable',
        'error'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.openSnackBar(
        'Image size should be less than 5MB',
        'warning'
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
      console.error('📷 Error reading file:', error);
      this.toastService.openSnackBar('Error reading image file', 'error');
    };
    reader.readAsDataURL(file);

    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  private uploadProfilePicture(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const fullDataUrl = e.target.result as string;
      const base64Image = fullDataUrl.split(',')[1]; // Get base64 string only
      const payload = {
        scouterId: this.scouterId,
        base64Picture: base64Image,
      };

      console.log(
        '📷 Starting profile picture flow. scouterId:',
        this.scouterId
      );

      // First check if backend already has a picture for this scouter to avoid
      // sending a create request that the server rejects when a picture exists.
      this.endpointService.getScouterPicture(this.scouterId).subscribe({
        next: (existing: any) => {
          const exists =
            !!existing &&
            (existing?.data?.base64Picture ||
              existing?.base64Picture ||
              typeof existing === 'string');
          console.log('📷 Backend picture exists:', exists);

          if (exists) {
            console.log(
              '📷 Replacing existing profile picture via replace endpoint'
            );
            this.endpointService.replaceScouterPicture(payload).subscribe({
              next: (res: any) => {
                console.log('✅ Profile picture replaced successfully:', res);
                this.handleSuccessfulUpload(fullDataUrl); // Pass the full data URL
              },
              error: (err) => {
                console.error('❌ Replace picture failed:', err);
                this.toastService.openSnackBar(
                  'Failed to update profile picture',
                  'error'
                );
                // Still show the image locally even if upload fails
                this.setProfilePicture(fullDataUrl);
              },
            });
          } else {
            console.log(
              '📷 Uploading new profile picture (no existing picture)'
            );
            console.log(
              '📷 Upload payload size:',
              payload.base64Picture?.length
            );
            console.log(
              '📷 Upload payload preview:',
              payload.base64Picture
                ? payload.base64Picture.substring(0, 60) + '...'
                : 'n/a'
            );

            this.endpointService.uploadScouterPicture(payload).subscribe({
              next: (res: any) => {
                console.log('✅ Profile picture uploaded successfully:', res);
                this.handleSuccessfulUpload(fullDataUrl); // Pass the full data URL
              },
              error: (err) => {
                console.error('❌ Upload picture failed:', err);

                // If the server says you can only replace an existing picture, try replace endpoint
                const serverMessage = err?.error?.message || err?.message || '';
                if (
                  typeof serverMessage === 'string' &&
                  serverMessage.toLowerCase().includes('replace')
                ) {
                  console.log(
                    '🔁 Server requires replace - attempting replace call'
                  );
                  this.endpointService
                    .replaceScouterPicture(payload)
                    .subscribe({
                      next: (res2: any) => {
                        console.log(
                          '✅ Replace after upload fallback succeeded:',
                          res2
                        );
                        this.handleSuccessfulUpload(fullDataUrl);
                      },
                      error: (err2) => {
                        console.error('❌ Replace fallback failed:', err2);
                        this.toastService.openSnackBar(
                          'Failed to upload profile picture',
                          'error'
                        );
                        this.setProfilePicture(fullDataUrl);
                      },
                    });
                  return;
                }

                this.toastService.openSnackBar(
                  'Failed to upload profile picture',
                  'error'
                );
                // Still show the image locally even if upload fails
                this.setProfilePicture(fullDataUrl);
              },
            });
          }
        },
        error: (err) => {
          console.warn(
            '⚠️ Could not determine existing picture state, proceeding to upload:',
            err
          );
          // If we cannot determine, attempt upload then fallback to replace
          this.endpointService.uploadScouterPicture(payload).subscribe({
            next: (res: any) => {
              console.log(
                '✅ Profile picture uploaded successfully (fallback):',
                res
              );
              this.handleSuccessfulUpload(fullDataUrl);
            },
            error: (err2) => {
              console.error('❌ Upload picture failed (fallback):', err2);
              const serverMessage = err2?.error?.message || err2?.message || '';
              if (
                typeof serverMessage === 'string' &&
                serverMessage.toLowerCase().includes('replace')
              ) {
                this.endpointService.replaceScouterPicture(payload).subscribe({
                  next: (res3: any) => {
                    console.log('✅ Replace after fallback succeeded:', res3);
                    this.handleSuccessfulUpload(fullDataUrl);
                  },
                  error: (err3) => {
                    console.error('❌ Replace fallback failed (final):', err3);
                    this.toastService.openSnackBar(
                      'Failed to upload profile picture',
                      'error'
                    );
                    this.setProfilePicture(fullDataUrl);
                  },
                });
                return;
              }
              this.toastService.openSnackBar(
                'Failed to upload profile picture',
                'error'
              );
              this.setProfilePicture(fullDataUrl);
            },
          });
        },
      });
    };
    reader.readAsDataURL(file);
  }

  private handleSuccessfulUpload(fullImageData: string): void {
    this.hasExistingProfilePicture = true;
    this.setProfilePicture(fullImageData);
    this.storeProfileImage(fullImageData);
    this.toastService.openSnackBar(
      'Profile picture updated successfully!',
      'success'
    );
    this.cdr.detectChanges();
  }

  // Update setProfilePicture to handle both full data URLs and base64 strings
  private setProfilePicture(imageData: string): void {
    // Ensure we have the full data URL format
    if (imageData.startsWith('data:image/')) {
      this.profileImage = imageData;
    } else {
      // If it's just base64, convert to data URL
      this.profileImage = `data:image/jpeg;base64,${imageData}`;
    }

    this.profileData.profileImage = this.profileImage;
    this.hasExistingProfilePicture = true;
    this.userService.setProfileImage(this.profileImage);
    this.cdr.detectChanges();

    console.log('✅ Profile picture set successfully');
  }

  removeProfilePicture(): void {
    if (!this.hasExistingProfilePicture) return;

    const confirmDelete = confirm(
      'Are you sure you want to remove your profile picture?'
    );
    if (!confirmDelete) return;

    this.endpointService.removeProfilePicture(this.scouterId).subscribe({
      next: (res: any) => {
        // After server reports deletion, verify by attempting to fetch the picture.
        // Some backends return 200 even when deletion is not fully processed,
        // so confirm before clearing local cache/UI.
        this.endpointService.getScouterPicture(this.scouterId).subscribe({
          next: (check: any) => {
            const exists =
              !!check &&
              (check?.data?.base64Picture ||
                check?.base64Picture ||
                typeof check === 'string');

            if (!exists) {
              this.setDefaultAvatar();
              localStorage.removeItem('profile_image');
              this.toastService.openSnackBar(
                'Profile picture removed',
                'success'
              );
            } else {
              console.warn(
                '⚠️ Delete reported success but picture still exists on backend'
              );
              this.toastService.openSnackBar(
                'Picture deletion reported but still present on server',
                'warning'
              );
              // Refresh UI with backend image
              this.loadProfilePicture();
            }
          },
          error: (err) => {
            // If we can't verify, conservatively clear cache and let next load reconcile
            this.setDefaultAvatar();
            localStorage.removeItem('profile_image');
            this.toastService.openSnackBar(
              'Profile picture removed',
              'success'
            );
          },
        });
      },
      error: (err) => {
        console.error('❌ Failed to remove profile picture:', err);
        this.toastService.openSnackBar(
          'Failed to remove profile picture',
          'warning'
        );
      },
    });
  }

  // ==================== SECURITY QUESTIONS - MATCHING WORKING FLOW ====================

  private loadSecurityQuestions(): void {
    if (!this.scouterId) return;

    this.isLoadingSecurityQuestions = true;
    this.authService.getMySecurityQuestions(this.scouterId).subscribe({
      next: (res: any) => {
        this.isLoadingSecurityQuestions = false;

        // MATCHING: Handle security questions response
        let loadedQuestions: SecurityQuestion[] = [];

        if (res?.data?.questions) {
          loadedQuestions = res.data.questions.map((q: any) => ({
            question: q.question || '',
            answer: q.answer || '••••••••',
          }));
        }

        this.securityQuestions = loadedQuestions;
        this.updateSecurityQuestionsState();
      },
      error: (err) => {
        this.isLoadingSecurityQuestions = false;
        console.error('❌ Failed to load security questions:', err);
      },
    });
  }

  async saveSecurityQuestions(): Promise<void> {
    if (!this.canSaveSecurityQuestions()) {
      this.toastService.openSnackBar(
        'Please fill in all questions and answers',
        'warning'
      );
      return;
    }

    if (!this.scouterId) {
      this.toastService.openSnackBar('User not authenticated', 'error');
      return;
    }

    this.isLoadingSecurityQuestions = true;

    try {
      // MATCHING: Hash answers like working component
      const hashedQuestions = await Promise.all(
        this.tempSecurityQuestions.map(async (qa) => ({
          question: qa.question.trim().toLowerCase(), // MATCHING: Lowercase like working component
          answer: await bcrypt.hash(qa.answer.trim().toLowerCase(), 10), // MATCHING: Lowercase + hash
        }))
      );

      const payload = {
        uniqueId: this.scouterId, // MATCHING: Use uniqueId like working component
        securityQuestions: hashedQuestions,
      };

      this.authService.createScouterSecurityQuestion(payload).subscribe({
        next: (res: any) => {
          this.isLoadingSecurityQuestions = false;

          // Update local state
          const savedQuestions = this.tempSecurityQuestions.map((qa) => ({
            question: qa.question.trim(),
            answer: '••••••••',
          }));

          this.securityQuestions = savedQuestions;
          this.isEditingSecurityQuestions = false;
          this.editingQuestionIndex = null;

          this.toastService.openSnackBar(
            'Security questions saved successfully!',
            'success'
          );

          // Reload after success
          setTimeout(() => {
            this.loadSecurityQuestions();
          }, 1000);
        },
        error: (err) => {
          console.error('❌ Failed to save security questions:', err);

          // If server responds that a security profile already exists, merge
          // new questions into existing ones (up to max of 5) using update API.
          const serverMsg = (err?.error?.message || err?.message || '')
            .toString()
            .toLowerCase();

          if (
            err?.status === 403 &&
            serverMsg.includes('security profile already exists')
          ) {
            console.log('ℹ️ Security profile exists — attempting merge flow');

            // Fetch existing questions with answers (server-side hashed answers)
            this.authService
              .getMySecurityQuestionsWithAnswers(this.scouterId)
              .subscribe({
                next: async (existingRes: any) => {
                  try {
                    const existing =
                      existingRes?.data?.questions ||
                      existingRes?.questions ||
                      [];

                    // Normalize existing to { question, answer } where answer is hashed
                    const existingNormalized = existing.map((q: any) => ({
                      question: String(
                        q.question || q.questionText || q.q || ''
                      ).trim(),
                      answer: q.answer || q.hashedAnswer || q.ans || '',
                    }));

                    // Prepare new hashed entries (we already hashed them above)
                    const newHashed = hashedQuestions.map((q: any) => ({
                      question: String(q.question).trim(),
                      answer: q.answer,
                    }));

                    // Merge while avoiding duplicate questions (case-insensitive)
                    const mergedMap = new Map<string, any>();
                    for (const e of existingNormalized) {
                      const key = e.question.toLowerCase();
                      if (key) mergedMap.set(key, e);
                    }
                    for (const n of newHashed) {
                      const key = n.question.toLowerCase();
                      if (!mergedMap.has(key)) mergedMap.set(key, n);
                    }

                    // Enforce max of 5 questions; keep existing order by preferring
                    // existing questions first then newly added ones
                    const finalArray: any[] = [];
                    // add existing in original order
                    for (const e of existingNormalized) {
                      if (finalArray.length >= 5) break;
                      const key = e.question.toLowerCase();
                      if (mergedMap.has(key)) {
                        finalArray.push(mergedMap.get(key));
                        mergedMap.delete(key);
                      }
                    }
                    // then add remaining new ones
                    for (const [k, v] of mergedMap) {
                      if (finalArray.length >= 5) break;
                      finalArray.push(v);
                    }

                    // If nothing to update
                    if (finalArray.length === 0) {
                      this.isLoadingSecurityQuestions = false;
                      this.toastService.openSnackBar(
                        'No questions to update',
                        'warning'
                      );
                      return;
                    }

                    // Call update endpoint with merged questions
                    this.authService
                      .updateScouterSecurityQuestions(
                        this.scouterId,
                        finalArray
                      )
                      .subscribe({
                        next: (uRes: any) => {
                          this.isLoadingSecurityQuestions = false;
                          this.toastService.openSnackBar(
                            'Security questions merged successfully',
                            'success'
                          );
                          // update UI masked answers
                          this.securityQuestions = finalArray.map((q) => ({
                            question: q.question,
                            answer: '••••••••',
                          }));
                          this.isEditingSecurityQuestions = false;
                          this.editingQuestionIndex = null;
                          setTimeout(() => this.loadSecurityQuestions(), 800);
                        },
                        error: (uErr) => {
                          this.isLoadingSecurityQuestions = false;
                          console.error(
                            '❌ Failed to merge security questions:',
                            uErr
                          );
                          this.toastService.openSnackBar(
                            'Failed to merge security questions',
                            'error'
                          );
                        },
                      });
                  } catch (mergeErr) {
                    this.isLoadingSecurityQuestions = false;
                    console.error('❌ Merge flow failed:', mergeErr);
                    this.toastService.openSnackBar(
                      'Failed to merge security questions',
                      'error'
                    );
                  }
                },
                error: (fetchErr) => {
                  this.isLoadingSecurityQuestions = false;
                  console.error(
                    '❌ Could not fetch existing questions:',
                    fetchErr
                  );
                  this.toastService.openSnackBar(
                    'Unable to fetch existing security questions. Please refresh and try again.',
                    'error'
                  );
                },
              });

            return;
          }

          // Generic error path
          this.isLoadingSecurityQuestions = false;
          this.toastService.openSnackBar(
            err?.error?.message || 'Failed to save security questions',
            'error'
          );
        },
      });
    } catch (err) {
      this.isLoadingSecurityQuestions = false;
      console.error('❌ Hashing error:', err);
      this.toastService.openSnackBar('Error securing your data', 'error');
    }
  }

  // ==================== MISSING TEMPLATE METHODS ====================

  handleImageError(event: any): void {
    console.error('📷 Error loading profile image');
    this.hasExistingProfilePicture = false;
    this.profileImage = null;
    this.cdr.detectChanges();
  }

  triggerFileInput(): void {
    // Allow opening the file picker regardless of edit mode so users can
    // update their profile picture without entering form edit state.
    if (this.fileInput?.nativeElement) {
      console.log('📁 Opening profile picture picker (standalone)');
      this.fileInput.nativeElement.click();
    }
  }

  // Public alias for templates: makes intention clearer in HTML bindings
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

  editQuestion(index: number): void {
    this.editingQuestionIndex = index;
    this.isEditingSecurityQuestions = true;
    this.tempSecurityQuestions = JSON.parse(
      JSON.stringify(this.securityQuestions)
    );
  }

  async deleteQuestion(index: number): Promise<void> {
    const questionToDelete = this.securityQuestions[index];
    const confirmed = await this.showDeleteConfirmation(
      questionToDelete.question
    );
    if (!confirmed) return;

    this.securityQuestions.splice(index, 1);
    this.updateSecurityQuestionsOnBackend();
    this.toastService.openSnackBar('Question deleted successfully', 'success');
  }

  addMoreQuestions(): void {
    this.addNewQuestion();
  }

  // ==================== UI INTERACTIONS - SIMPLIFIED ====================

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

  private setDefaultAvatar(): void {
    this.profileImage = null;
    this.profileData.profileImage = '';
    this.hasExistingProfilePicture = false;
    this.userService.setProfileImage('');
    this.cdr.detectChanges();
  }

  private loadProfilePicture(): void {
    console.log('📷 Loading profile picture for scouterId:', this.scouterId);

    // First check if we have a cached image in localStorage
    const cachedImage = localStorage.getItem('profile_image');
    if (cachedImage && this.isValidImageData(cachedImage)) {
      console.log('✅ Using cached profile image from localStorage');
      this.profileImage = cachedImage;
      this.hasExistingProfilePicture = true;
      this.userService.setProfileImage(cachedImage);
      this.cdr.detectChanges();
      return;
    }

    // If no cached image, fetch from backend. Be tolerant of different response shapes.
    this.endpointService.getScouterPicture(this.scouterId).subscribe({
      next: (res: any) => {
        console.log('📷 Profile picture API response:', res);

        // Helper to apply and cache image
        const applyImage = (imgSrc: string) => {
          this.profileImage = imgSrc;
          this.hasExistingProfilePicture = true;
          this.userService.setProfileImage(imgSrc);
          this.storeProfileImage(imgSrc);
          this.cdr.detectChanges();
          console.log('✅ Profile picture applied');
        };

        // Case A: expected shape { data: { base64Picture: '...' } }
        if (res?.data && res.data.base64Picture) {
          const base64Image = `data:image/jpeg;base64,${res.data.base64Picture}`;
          console.log(
            '✅ Profile picture loaded from backend (data.base64Picture)'
          );
          applyImage(base64Image);
          return;
        }

        // Case B: response contains base64 at top-level
        if (res?.base64Picture) {
          const base64Image = `data:image/jpeg;base64,${res.base64Picture}`;
          console.log('✅ Profile picture loaded from backend (base64Picture)');
          applyImage(base64Image);
          return;
        }

        // Case C: API returns a direct URL or data string in res or res.data
        const candidate =
          (res && typeof res === 'string' ? res : null) ||
          (res?.data && typeof res.data === 'string' ? res.data : null) ||
          (res?.data?.pictureUrl && res.data.pictureUrl) ||
          (res?.pictureUrl && res.pictureUrl) ||
          null;

        if (candidate) {
          const trimmed = String(candidate).trim();

          // If it's a URL, use it directly
          if (trimmed.startsWith('http')) {
            console.log('✅ Profile picture is a URL, using as-is');
            applyImage(trimmed);
            return;
          }

          // If it looks like base64 payload, convert to data URL
          const base64Only = trimmed.replace(
            /^data:image\/[a-zA-Z]+;base64,/,
            ''
          );
          if (this.isProbableBase64(base64Only)) {
            const dataUrl = `data:image/jpeg;base64,${base64Only}`;
            console.log('✅ Profile picture looks like base64 string');
            applyImage(dataUrl);
            return;
          }
        }

        // No usable picture found
        console.log('📷 No usable profile picture data in response');
        this.setDefaultAvatar();
      },
      error: (err) => {
        console.log('📷 Profile picture load error:', err);

        // Check if it's a 404 (no picture) or other error
        if (err?.status === 404) {
          console.log('📷 No profile picture exists for this user');
        } else if (err?.status === 401) {
          console.log('📷 Unauthorized - might need to refresh token');
        } else {
          console.log(
            '📷 Other error loading profile picture:',
            err?.message || err
          );
        }

        this.setDefaultAvatar();
      },
    });
  }

  // Add this helper method to validate image data
  private isValidImageData(data: string): boolean {
    if (!data) return false;

    // Data URL is always valid
    if (data.startsWith('data:image/')) return true;

    // URL looks valid
    if (data.startsWith('http')) return true;

    // If it's a base64-like string, accept shorter lengths (images may be small)
    const base64 = data.replace(/^data:image\/[a-zA-Z]+;base64,/, '').trim();
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (base64.length >= 20 && base64Regex.test(base64)) return true;

    return false;
  }

  // New helper to guess if a string is probably base64 (lenient)
  private isProbableBase64(str: string): boolean {
    if (!str) return false;
    const s = str.trim();
    if (s.length < 20) return false;
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    return base64Regex.test(s);
  }

  private storeProfileImage(imageData: string): void {
    try {
      localStorage.setItem('profile_image', imageData);
    } catch (err) {
      console.warn('Could not store profile image:', err);
    }
  }

  private updateSecurityQuestionsState(): void {
    if (this.securityQuestions.length === 0) {
      this.isEditingSecurityQuestions = true;
    }
    this.tempSecurityQuestions =
      this.securityQuestions.length > 0
        ? JSON.parse(JSON.stringify(this.securityQuestions))
        : [{ question: '', answer: '' }];
  }

  private redirectToLogin(): void {
    this.router.navigate(['/auth/login'], {
      replaceUrl: true,
      queryParams: {
        redirectReason: 'session_expired',
        returnUrl: this.router.url,
      },
    });
  }

  // Security Questions UI Methods
  toggleEditSecurityQuestions(): void {
    this.isEditingSecurityQuestions = !this.isEditingSecurityQuestions;
    this.editingQuestionIndex = null;
    if (this.isEditingSecurityQuestions) {
      this.tempSecurityQuestions =
        this.securityQuestions.length > 0
          ? JSON.parse(JSON.stringify(this.securityQuestions))
          : [{ question: '', answer: '' }];
    }
  }

  addNewQuestion(): void {
    if (this.tempSecurityQuestions.length < 5) {
      this.tempSecurityQuestions.push({ question: '', answer: '' });
    } else {
      this.toastService.openSnackBar(
        'Maximum of 5 security questions allowed',
        'warning'
      );
    }
  }

  removeQuestion(index: number): void {
    if (this.tempSecurityQuestions.length > 1) {
      this.tempSecurityQuestions.splice(index, 1);
    } else {
      this.toastService.openSnackBar(
        'At least one security question is required',
        'warning'
      );
    }
  }

  canSaveSecurityQuestions(): boolean {
    return (
      this.tempSecurityQuestions.length > 0 &&
      this.tempSecurityQuestions.every(
        (q) => q.question?.trim() !== '' && q.answer?.trim() !== ''
      )
    );
  }

  // ==================== SUPPORTING PRIVATE METHODS ====================

  private async showSaveConfirmation(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const modal = await this.modalCtrl.create({
        component: UpdateProfileConfirmationPopupModalComponent,
        cssClass: 'confirmation-modal',
        backdropDismiss: true,
      });
      await modal.present();
      const { data, role } = await modal.onWillDismiss();
      resolve(role === 'confirm');
    });
  }

  private async showDeleteConfirmation(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmed = confirm(
        `Are you sure you want to delete this question?\n\n"${question}"`
      );
      resolve(confirmed);
    });
  }

  private updateSecurityQuestionsOnBackend(): void {
    if (!this.scouterId) return;

    const payload = this.securityQuestions
      .filter((q) => q.question.trim() !== '')
      .map((q) => ({ question: q.question, answer: q.answer }));

    this.authService
      .updateScouterSecurityQuestions(this.scouterId, payload)
      .subscribe({
        next: (res: any) => {
          this.tempSecurityQuestions = [...this.securityQuestions];
          this.toastService.openSnackBar(
            'Security questions updated successfully',
            'success'
          );
        },
        error: (err) => {
          console.error('❌ Failed to update security questions:', err);
          this.toastService.openSnackBar(
            'Failed to update security questions',
            'error'
          );
          this.loadSecurityQuestions();
        },
      });
  }

  // Navigation
  goBack() {
    this.location.back();
  }

  // Scroll methods
  scrollToProfilePicture() {
    if (this.profilePicture?.nativeElement) {
      const y = this.profilePicture.nativeElement.offsetTop - 20;
      this.pageContent.scrollToPoint(0, y, 600);
    }
  }

  scrollToSecurityQuestions() {
    if (this.securityQuestionsSection?.nativeElement) {
      const y = this.securityQuestionsSection.nativeElement.offsetTop;
      this.pageContent.scrollToPoint(0, y, 600);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
