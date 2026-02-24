import { Component, OnInit } from '@angular/core';
import {
  ModalController,
  IonicModule,
  Platform,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ToastsService } from 'src/app/services/toasts.service';
import { AuthService } from 'src/app/services/auth.service';

interface PaymentDetail {
  label: string;
  value: string;
  isCopy?: boolean;
  bold?: boolean;
  copied?: boolean;
}

@Component({
  selector: 'app-make-payment-popup-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './make-payment-popup-modal.component.html',
  styleUrls: ['./make-payment-popup-modal.component.scss'],
})
export class MakePaymentPopupModalComponent extends BaseModal implements OnInit {
  paymentDetails: PaymentDetail[] = [
    { label: 'Amount Payable', value: '₦ 1,000.00' },
    { label: 'Bank', value: 'Diamond (Access Bank)' },
    { label: 'Account Number', value: '0185476321', isCopy: true },
    { label: 'Account Name', value: 'Shoft Africa Inc', bold: true },
  ];

  userName: string = 'User';

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private toastService: ToastsService,
    private authService: AuthService
  ) {
    super(modalCtrl, platform); // ✅ inherits dismiss + back button
  }

  override ngOnInit(): void {
    this.getUserName();
  }

  getUserName(): void {
    try {
      // Method 1: Try to get from AuthService first
      const currentUser = this.authService.getCurrentUser();
      
      if (currentUser) {
        this.extractAndSetUserName(currentUser);
        return;
      }
      
      // Method 2: Fallback to localStorage
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.extractAndSetUserName(parsed);
        return;
      }
      
      // Method 3: Try user_profile_data as last resort
      const profileData = localStorage.getItem('user_profile_data');
      if (profileData) {
        const parsed = JSON.parse(profileData);
        this.extractAndSetUserName(parsed);
        return;
      }
      
    } catch (error) {
      console.error('Error getting user name:', error);
      this.userName = 'User';
    }
  }

  private extractAndSetUserName(userData: any): void {
    if (!userData) {
      this.userName = 'User';
      return;
    }

    console.log('🔍 Extracting user name from:', userData);

    // Try different possible structures and property names
    const user = userData.details?.user || userData.user || userData.data?.user || userData;

    // Try multiple possible property names for full name
    if (user.fullName) {
      this.userName = user.fullName;
    } else if (user.fullname) {
      this.userName = user.fullname;
    } else if (user.name) {
      this.userName = user.name;
    } else if (user.firstName && user.lastName) {
      this.userName = `${user.firstName} ${user.lastName}`.trim();
    } else if (user.firstName) {
      this.userName = user.firstName;
    } else if (user.lastName) {
      this.userName = user.lastName;
    } else if (user.username) {
      this.userName = user.username;
    } else if (user.displayName) {
      this.userName = user.displayName;
    }
    // Try email as last resort
    else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      // Capitalize first letter
      this.userName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    console.log('✅ Extracted user name:', this.userName);
  }

  goToActivateAccount() {
    this.dismiss(); // ✅ inherited from BaseModal
    this.router.navigate(['/scouter/account-activation']);
  }

  async copyToClipboard(item: PaymentDetail) {
    await navigator.clipboard.writeText(item.value);

    item.copied = true;
    setTimeout(() => (item.copied = false), 2000);

    this.toastService.openSnackBar(`Copied: ${item.value}`, 'success');
  }
}