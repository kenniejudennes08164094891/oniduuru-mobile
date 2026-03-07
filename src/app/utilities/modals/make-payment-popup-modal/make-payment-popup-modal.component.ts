import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule, Platform } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { AuthService } from 'src/app/services/auth.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';

interface PaymentDetail {
  label: string;
  value: string;
  isCopy?: boolean;
  bold?: boolean;
  copied?: boolean;
}

interface BankingDetails {
  id: string;
  currency: string;
  title: string;
  amount: string;
  bank: string;
  accountName: string;
  accountNumber: string;
}

@Component({
  selector: 'app-make-payment-popup-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './make-payment-popup-modal.component.html',
  styleUrls: ['./make-payment-popup-modal.component.scss'],
})
export class MakePaymentPopupModalComponent
  extends BaseModal
  implements OnInit
{
  paymentDetails: PaymentDetail[] = [];
  userName: string = 'User';
  invoiceId: string = '';
  invoiceDate: string = '';
  isLoading: boolean = true;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private toastService: ToastsService,
    private authService: AuthService,
    private scouterEndpoints: ScouterEndpointsService,
    protected override overlayCleanup: OverlayCleanupService,
  ) {
    super(modalCtrl, platform, overlayCleanup);
  }

  override ngOnInit(): void {
    this.generateInvoiceId();
    this.getUserName();
    this.fetchBankingDetails();
  }

  /**
   * Generate unique invoice ID using the specified method
   */
  private generateInvoiceId(): void {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const sequentialNumber = String(Math.floor(Math.random() * 1000)).padStart(
      3,
      '0',
    );

    this.invoiceId = `INV-${year}-${month}${day}-${sequentialNumber}`;

    // Format invoice date
    this.invoiceDate = currentDate
      .toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
      .replace(/(\d+)(st|nd|rd|th)/, '$1');
  }

  /**
   * Fetch banking details from the API
   */
  private fetchBankingDetails(): void {
    this.isLoading = true;

    this.scouterEndpoints.fetchActivationAmount().subscribe({
      next: (response: any) => {
        console.log('✅ Banking details fetched:', response);

        if (response?.data && Array.isArray(response.data)) {
          // Find the scouter account activation charge (id: "1")
          const activationCharge = response.data.find(
            (item: BankingDetails) =>
              item.id === '1' ||
              item.title.includes('Scouter Account Activation'),
          );

          if (activationCharge) {
            this.populatePaymentDetails(activationCharge);
          } else if (response.data.length > 0) {
            // Fallback to first item if specific one not found
            this.populatePaymentDetails(response.data[0]);
          }
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Failed to fetch banking details:', error);
        this.toastService.openSnackBar(
          'Failed to load payment details. Please try again.',
          'error',
        );
        this.setFallbackPaymentDetails();
        this.isLoading = false;
      },
    });
  }

  /**
   * Populate payment details from API response
   */
  private populatePaymentDetails(bankingDetails: BankingDetails): void {
    // Format amount with currency symbol and proper thousands separator
    const formattedAmount = this.formatCurrency(
      bankingDetails.amount,
      bankingDetails.currency,
    );

    this.paymentDetails = [
      { label: 'Amount Payable', value: formattedAmount, bold: true },
      { label: 'Bank', value: bankingDetails.bank },
      {
        label: 'Account Number',
        value: bankingDetails.accountNumber,
        isCopy: true,
      },
      { label: 'Account Name', value: bankingDetails.accountName, bold: true },
    ];
  }

  /**
   * Set fallback payment details in case API fails
   */
  private setFallbackPaymentDetails(): void {
    this.paymentDetails = [
      { label: 'Amount Payable', value: '₦ 1,000.00', bold: true },
      { label: 'Bank', value: 'Moniepoint MFB' },
      { label: 'Account Number', value: '9031251953', isCopy: true },
      { label: 'Account Name', value: 'Shoft Africa Inc', bold: true },
    ];
  }

  /**
   * Format currency with proper symbol and thousands separator
   */
  private formatCurrency(amount: string, currency: string = 'naira'): string {
    if (!amount) return '₦ 0.00';

    // Remove any existing currency symbols and commas
    const cleanAmount = amount.replace(/[₦$,\s]/g, '');
    const numAmount = parseFloat(cleanAmount);

    if (isNaN(numAmount)) return amount;

    // Format with thousands separator and 2 decimal places
    const formattedNumber = numAmount
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    switch (currency.toLowerCase()) {
      case 'naira':
      case 'ngn':
        return `₦ ${formattedNumber}`;
      case 'dollar':
      case 'usd':
        return `$ ${formattedNumber}`;
      case 'euro':
      case 'eur':
        return `€ ${formattedNumber}`;
      case 'pounds':
      case 'gbp':
        return `£ ${formattedNumber}`;
      default:
        // If currency is unknown but might contain symbol in original
        if (amount.includes('₦')) return `₦ ${formattedNumber}`;
        if (amount.includes('$')) return `$ ${formattedNumber}`;
        if (amount.includes('€')) return `€ ${formattedNumber}`;
        if (amount.includes('£')) return `£ ${formattedNumber}`;
        return `₦ ${formattedNumber}`; // Default to Naira
    }
  }

  /**
   * Alternative formatter using Intl.NumberFormat (more robust)
   */
  private formatCurrencyWithIntl(
    amount: string,
    currency: string = 'NGN',
  ): string {
    if (!amount) return '₦ 0.00';

    const cleanAmount = amount.replace(/[₦$,\s]/g, '');
    const numAmount = parseFloat(cleanAmount);

    if (isNaN(numAmount)) return amount;

    // Map currency strings to ISO codes
    const currencyMap: { [key: string]: string } = {
      naira: 'NGN',
      ngn: 'NGN',
      dollar: 'USD',
      usd: 'USD',
      euro: 'EUR',
      eur: 'EUR',
      pounds: 'GBP',
      gbp: 'GBP',
    };

    const currencyCode = currencyMap[currency.toLowerCase()] || 'NGN';

    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numAmount);
    } catch (error) {
      // Fallback to manual formatting if Intl fails
      return this.formatCurrency(amount, currency);
    }
  }

  getUserName(): void {
    try {
      const currentUser = this.authService.getCurrentUser();

      if (currentUser) {
        this.extractAndSetUserName(currentUser);
        return;
      }

      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.extractAndSetUserName(parsed);
        return;
      }

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

    const user =
      userData.details?.user ||
      userData.user ||
      userData.data?.user ||
      userData;

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
    } else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      this.userName =
        emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    console.log('✅ Extracted user name:', this.userName);
  }

  async goToActivateAccount() {
    await this.dismiss();
    // Use navigateByUrl to avoid history stack issues
    this.router.navigateByUrl('/scouter/account-activation', {
      replaceUrl: true,
    });
  }

  async copyToClipboard(item: PaymentDetail) {
    try {
      await navigator.clipboard.writeText(item.value);
      item.copied = true;
      setTimeout(() => (item.copied = false), 2000);
      this.toastService.openSnackBar(`Copied: ${item.value}`, 'success');
    } catch (error) {
      console.error('Failed to copy:', error);
      this.toastService.openSnackBar('Failed to copy to clipboard', 'error');
    }
  }
}
