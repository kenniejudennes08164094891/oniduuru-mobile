import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';
import {
  ModalController,
  Platform,
  ToastController,
  LoadingController,
} from '@ionic/angular';
import { Location } from '@angular/common';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import {firstValueFrom} from "rxjs";
import {EmmittersService} from "../../services/emmitters.service";

@Component({
  selector: 'app-conclude-your-hiring-process-page-component',
  templateUrl: './conclude-your-hiring-process-page.component.html',
  styleUrls: ['./conclude-your-hiring-process-page.component.scss'],
  standalone: false,
})
export class ConcludeYourHiringProcessPageComponent
  extends BaseModal
  implements OnInit
{
  headerHidden: boolean = false;
  @Input() hire: any;
  @Input() selectedSkills: any[] = [];
  @Input() currentUser: any;
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

  images = imageIcons;
  isFormEditable = false;
  isFormDisabled = false;
  isLoading = false;
  originalFormData: any = {};

  // Form data
  formData = {
    purpose: '',
    amount: 0,
    startDate: '',
  };

  // NEW: Scouter data from localStorage
  scouterData = {
    scouterId: '',
    scouterName: '',
    scouterPhoneNumber: '',
    scouterEmail: '',
  };

  previewConfirmed = false;
  isPreviewOpen = false;

  constructor(
    private router: Router,
    private location: Location,
    private toastService: ToastsService,
    private scouterEndpointsService: ScouterEndpointsService,
    private loadingCtrl: LoadingController,
    modalCtrl: ModalController,
    platform: Platform,
    private emitterService: EmmittersService
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.hire = nav.extras.state['hire'];
      this.selectedSkills = nav.extras.state['selectedSkills'] || [];
      this.currentUser = nav.extras.state['currentUser'];
      this.formData.amount = this.totalPrice;

      console.log('Conclude Hiring Component Initialized:', {
        hire: this.hire,
        selectedSkills: this.selectedSkills,
        currentUser: this.currentUser,
        totalPrice: this.totalPrice,
      });
    }

    // NEW: Load scouter data from localStorage
    this.loadScouterDataFromLocalStorage();
  }

  // NEW: Method to load scouter data from localStorage
  private loadScouterDataFromLocalStorage() {
    try {
      // Try to get data from different possible localStorage keys
      const userProfileData = localStorage.getItem('user_profile_data');
      const userData = localStorage.getItem('user_data');
      const registrationEmail = localStorage.getItem('registration_email');

      // Parse the user data
      let parsedUserData: any = {};

      if (userProfileData) {
        parsedUserData = JSON.parse(userProfileData);
      } else if (userData) {
        parsedUserData = JSON.parse(userData);
      }

      // Set scouter data based on localStorage values
      this.scouterData = {
        scouterId: parsedUserData.id || parsedUserData.scouterId || parsedUserData.userId || '',
        scouterName: parsedUserData.name || parsedUserData.fullName || parsedUserData.username || '',
        scouterPhoneNumber: parsedUserData.phoneNumber || parsedUserData.phone || parsedUserData.contact || '',
        scouterEmail: registrationEmail || parsedUserData.email || parsedUserData.userEmail || '',
      };

      console.log('Scouter data loaded from localStorage:', this.scouterData);

      // If we still don't have email, try to get from other possible keys
      if (!this.scouterData.scouterEmail) {
        const email = localStorage.getItem('email') ||
                     localStorage.getItem('user_email') ||
                     localStorage.getItem('scouter_email');
        if (email) {
          this.scouterData.scouterEmail = email;
        }
      }

      // Log warning if any required field is missing
      const missingFields = [];
      if (!this.scouterData.scouterId) missingFields.push('scouterId');
      if (!this.scouterData.scouterName) missingFields.push('scouterName');
      if (!this.scouterData.scouterPhoneNumber) missingFields.push('scouterPhoneNumber');
      if (!this.scouterData.scouterEmail) missingFields.push('scouterEmail');

      if (missingFields.length > 0) {
        console.warn('Missing scouter data in localStorage:', missingFields);
        this.toastService.openSnackBar(
          `Some profile information is missing. Please update your profile.`,
          'warn'
        );
      }

    } catch (error) {
      console.error('Error loading scouter data from localStorage:', error);
      this.toastService.openSnackBar(
        'Unable to load your profile data. Please log in again.',
        'error'
      );
    }
  }

  // NEW: Method to validate scouter data
  private validateScouterData(): boolean {
    const errors = [];

    if (!this.scouterData.scouterId) {
      errors.push('scouterId should not be empty');
    }
    if (!this.scouterData.scouterName) {
      errors.push('scouterName should not be empty');
    }
    if (!this.scouterData.scouterPhoneNumber) {
      errors.push('scouterPhoneNumber should not be empty');
    }
    if (!this.scouterData.scouterEmail) {
      errors.push('scouterEmail should not be empty');
    }
    // Basic email validation
    if (this.scouterData.scouterEmail && !this.isValidEmail(this.scouterData.scouterEmail)) {
      errors.push('scouterEmail must be an email');
    }

    if (errors.length > 0) {
      console.error('Scouter data validation errors:', errors);
      return false;
    }

    return true;
  }

  // NEW: Helper method for email validation
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get totalPrice(): number {
    return this.selectedSkills.reduce((sum, s) => sum + (s.amount || 0), 0);
  }

  get isFormValid(): boolean {
    return (
      !!this.formData.purpose &&
      !!this.formData.amount &&
      !!this.formData.startDate
    );
  }

  onAmountChange(value: string) {
    const numericValue = value.replace(/,/g, '');
    this.formData.amount = parseInt(numericValue, 10) || 0;
  }

  previewData() {
    // Validate form before showing preview
    if (!this.validateForm()) {
      return;
    }
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
  }

  confirmPreview() {
    this.previewConfirmed = true;
    this.isFormDisabled = true;
    this.isFormEditable = false;
    this.closePreview();
  }

  enableFormEditing() {
    this.originalFormData = { ...this.formData };
    this.isFormDisabled = false;
    this.isFormEditable = true;
    this.toastService.openSnackBar('You can now edit the form', 'info');
  }

  cancelFormEditing() {
    this.formData = { ...this.originalFormData };
    this.isFormDisabled = true;
    this.isFormEditable = false;
    this.toastService.openSnackBar('Changes cancelled', 'info');
  }

  async saveUpdatedRecord() {
    if (!this.validateForm()) {
      return;
    }

    if (this.isLoading) return;

    const loading = await this.loadingCtrl.create({
      message: 'Saving changes...',
      spinner: 'crescent',
    });
    await loading.present();

    this.isLoading = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      this.isFormDisabled = true;
      this.isFormEditable = false;
      this.toastService.openSnackBar('Record updated successfully! ✅', 'success');
      this.originalFormData = {};
    } catch (error) {
      console.error('Error updating record:', error);
      this.toastService.openSnackBar('Failed to update record', 'error');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  async hireTalent() {
    // Prevent multiple clicks
    if (this.isLoading) return;

    // Validate form one more time
    if (!this.validateForm()) {
      return;
    }

    // NEW: Validate scouter data before proceeding
    if (!this.validateScouterData()) {
      this.toastService.openSnackBar(
        'Your profile information is incomplete. Please update your profile first.',
        'error'
      );
      return;
    }

    // Show loading indicator
    const loading = await this.loadingCtrl.create({
      message: 'Sending hire offer...',
      spinner: 'crescent',
    });
    await loading.present();

    this.isLoading = true;

    try {
      // Prepare the API payload with data from localStorage
      const hirePayload = {
        talentId: this.hire?.id || this.hire?.talentId || '',
        talentName: this.hire?.name || '',
        // Use scouter data from localStorage
        scouterId: this.scouterData.scouterId,
        scouterName: this.scouterData.scouterName,
        scouterPhoneNumber: this.scouterData.scouterPhoneNumber,
        talentEmail: this.hire?.email || '',
        scouterEmail: this.scouterData.scouterEmail,
        startDate: this.formData.startDate,
        amountToPay: this.formData.amount.toString(),
        jobDescription: this.formData.purpose,
      };

      console.log('Sending hire request with payload:', hirePayload);

      // Call the API endpoint
      const response = await firstValueFrom(this.scouterEndpointsService.hireTalent(hirePayload))
      if(response){
        console.log('Hire API Response:', response);

        // Show success message
        this.toastService.openSnackBar(
          'Hire offer sent successfully! ✅',
          'success',
        );
        this.emitterService.clearTalentIdForHire();

        // Navigate back after a short delay
        setTimeout(() => {
          this.location.back();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error hiring talent:', error);

      let errorMessage = 'Failed to send hire offer. Please try again.';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error?.message) {
        // Handle API error messages
        if (Array.isArray(error.error.message)) {
          errorMessage = error.error.message.join(', ');
        } else {
          errorMessage = error.error.message;
        }
      }

      this.toastService.openSnackBar(errorMessage, 'error');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  onCancel() {
    this.dismiss(null, 'cancel');
    this.router.navigate([
      '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
    ]);
  }

  onConfirm() {
    this.dismiss(null, 'confirm');
  }

  getMinDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  validateForm(): boolean {
    if (!this.formData.purpose || this.formData.purpose.trim().length < 10) {
      this.toastService.openSnackBar(
        'Please provide a detailed job description (at least 10 characters)',
        'error',
      );
      return false;
    }

    if (this.formData.amount < 1000) {
      this.toastService.openSnackBar('Amount must be at least ₦1,000', 'error');
      return false;
    }

    if (!this.formData.startDate) {
      this.toastService.openSnackBar('Please select a start date', 'error');
      return false;
    }

    const selectedDate = new Date(this.formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.toastService.openSnackBar(
        'Start date must be today or in the future',
        'error',
      );
      return false;
    }

    return true;
  }
}
