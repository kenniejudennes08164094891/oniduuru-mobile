// log-complaints-popup-modal.component.ts
import { Component, OnDestroy } from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { imageIcons } from 'src/app/models/stores';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
})
export class LogComplaintsPopupModalComponent
  extends BaseModal
  implements OnDestroy
{
  images = imageIcons;
  complaintText = '';
  private routerSub!: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private scouterEndpoints: ScouterEndpointsService,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private userService: UserService
  ) {
    super(modalCtrl, platform);
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  // Improved method to get user data dynamically
  private getUserData() {
    console.log('🔍 Debug: Extracting user data...');

    // Method 1: Get from UserService profile data
    const profileData = this.userService.getProfileData();
    console.log('📊 Profile Data:', profileData);

    if (profileData?.user) {
      const userData = {
        fullName: profileData.user.fullName || profileData.user.name || 'User',
        uniqueId:
          profileData.user.uniqueId ||
          profileData.user.id ||
          this.extractUniqueId(profileData.user),
        role: profileData.user.role || 'scouter',
      };
      console.log('✅ From Profile Data:', userData);
      return userData;
    }

    // Method 2: Get from AuthService decoded details
    const decodedDetails = this.authService.decodeScouterDetails();
    console.log('🔐 Decoded Details:', decodedDetails);

    if (decodedDetails) {
      const userData = {
        fullName: decodedDetails.fullName || decodedDetails.name || 'User',
        uniqueId:
          decodedDetails.uniqueId ||
          decodedDetails.id ||
          this.extractUniqueId(decodedDetails),
        role: decodedDetails.role || 'scouter',
      };
      console.log('✅ From Decoded Details:', userData);
      return userData;
    }

    // Method 3: Get from localStorage directly
    const userDataString = localStorage.getItem('user_data');
    console.log('💾 LocalStorage user_data:', userDataString);

    if (userDataString) {
      try {
        const parsedData = JSON.parse(userDataString);
        const userData = {
          fullName: parsedData.fullName || parsedData.name || 'User',
          uniqueId:
            parsedData.uniqueId ||
            parsedData.id ||
            this.extractUniqueId(parsedData),
          role: parsedData.role || 'scouter',
        };
        console.log('✅ From LocalStorage:', userData);
        return userData;
      } catch (e) {
        console.error('❌ Error parsing user_data:', e);
      }
    }

    // Method 4: Check for eniyan encoded data
    const eniyan = localStorage.getItem('eniyan');
    console.log('🔐 Eniyan data:', eniyan);

    if (eniyan) {
      try {
        const decodedEniyan = JSON.parse(atob(eniyan));
        const userData = {
          fullName: decodedEniyan.fullName || decodedEniyan.name || 'User',
          uniqueId:
            decodedEniyan.uniqueId ||
            decodedEniyan.id ||
            this.extractUniqueId(decodedEniyan),
          role: decodedEniyan.role || 'scouter',
        };
        console.log('✅ From Eniyan:', userData);
        return userData;
      } catch (e) {
        console.error('❌ Error decoding eniyan:', e);
      }
    }

    // Fallback: Use comprehensive extraction
    const fallbackData = {
      fullName: 'User',
      uniqueId: this.getLoggedInUserId(),
      role: 'scouter',
    };
    console.log('🔄 Fallback Data:', fallbackData);
    return fallbackData;
  }

  // Helper method to extract uniqueId from various possible formats
  private extractUniqueId(userObject: any): string {
    if (!userObject) return '';

    // Try all possible uniqueId fields
    const possibleIds = [
      userObject.uniqueId,
      userObject.id,
      userObject.userId,
      userObject.scouterId,
      userObject.talentId,
      userObject._id,
      // Check for formatted IDs like "scouter/2323/4October2025"
      userObject.scouterUniqueId,
      userObject.talentUniqueId,
    ];

    const validId = possibleIds.find(
      (id) => id && typeof id === 'string' && id.length > 0
    );

    if (validId) {
      console.log('🎯 Extracted uniqueId:', validId);
      return validId;
    }

    // If no valid ID found, try to construct one from available data
    if (userObject.role && userObject.id) {
      const constructedId = `${userObject.role}/${
        userObject.id
      }/${new Date().toDateString()}`;
      console.log('🔨 Constructed uniqueId:', constructedId);
      return constructedId;
    }

    return this.getLoggedInUserId();
  }

  // Enhanced method to get logged in user ID
  getLoggedInUserId(): string {
    // Try multiple storage locations
    const storageKeys = ['user_data', 'eniyan', 'current_user'];

    for (const key of storageKeys) {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          const userId =
            parsed.uniqueId || parsed.id || parsed.userId || parsed.scouterId;
          if (userId) {
            console.log(`✅ Found ID in ${key}:`, userId);
            return userId;
          }
        } catch (e) {
          console.warn(`⚠️ Could not parse ${key}:`, e);
        }
      }
    }

    // Final fallback
    console.warn('⚠️ No user ID found, using default');
    return 'unknown-user';
  }

  async submitComplaint() {
    if (this.complaintText.trim().length === 0) {
      const toast = await this.toastCtrl.create({
        message: 'Please describe your issue before submitting.',
        duration: 2000,
        color: 'warning',
      });
      toast.present();
      return;
    }

    // ✅ Get dynamic user data with debug logging
    const userData = this.getUserData();

    // Validate that we have a uniqueId
    if (!userData.uniqueId || userData.uniqueId === 'unknown-user') {
      const toast = await this.toastCtrl.create({
        message: 'Unable to identify user. Please log in again.',
        duration: 3000,
        color: 'danger',
      });
      toast.present();
      return;
    }

    const payload = {
      fullName: userData.fullName,
      uniqueId: userData.uniqueId,
      complaint: this.complaintText,
      role: userData.role,
    };

    console.log('📝 Final complaint payload:', payload);

    this.scouterEndpoints.logComplaint(payload).subscribe({
      next: async (res) => {
        const toast = await this.toastCtrl.create({
          message: 'Complaint logged successfully ✅',
          duration: 2000,
          color: 'success',
        });
        toast.present();
        this.modalCtrl.dismiss({ success: true });
      },
      error: async (err) => {
        console.error('❌ Complaint submission error:', err);

        let errorMessage = 'Failed to log complaint';
        if (err.status === 400) {
          errorMessage = 'Invalid request. Please check your information.';
        } else if (err.status === 401) {
          errorMessage = 'Please log in again.';
        } else if (err.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        const toast = await this.toastCtrl.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  override ngOnDestroy() {
    if (this.routerSub) this.routerSub.unsubscribe();
  }
}
