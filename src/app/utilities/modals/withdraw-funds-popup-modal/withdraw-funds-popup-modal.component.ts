import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';
import { banks, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { WithdrawReceiptModalComponent } from '../withdraw-receipt-modal/withdraw-receipt-modal.component';
import { ToastsService } from 'src/app/services/toasts.service';

interface Bank {
  bankName: string;
  cbnCode?: string;
  bankCode?: string;
}

@Component({
  selector: 'app-withdraw-funds-popup-modal',
  templateUrl: './withdraw-funds-popup-modal.component.html',
  styleUrls: ['./withdraw-funds-popup-modal.component.scss'],
  standalone: false,
})
export class WithdrawFundsPopupModalComponent
  extends BaseModal
  implements OnInit
{
  @Input() isModalOpen: boolean = false;

  // Add these Input properties to receive data from parent component
  @Input() currentUser: any = null;
  @Input() userUniqueId: string | null = null;
  @Input() walletId: string = '0033392845';
  @Input() userRole: string = '';

  images = imageIcons;
  hires = MockRecentHires;

  formSubmitted = false;

  walletAccNo: string = '';
  walletName: string = '';
  agreed: boolean = false;

  // Banks from API
  banks: Bank[] = [];
  bankNames: string[] = []; // For display in dropdown
  isLoadingBanks: boolean = false;

  // User's chosen bank
  bank: string | null = null;
  selectedBank: string | null = null;
  isBankDropdownOpen = false;

  // form fields
  accountNumber: string = '';
  amount: number | null = null;

  // file preview
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toast: ToastsService,
    private ngZone: NgZone,
    private endpointService: EndpointService,
    protected override overlayCleanup: OverlayCleanupService,
  ) {
    super(modalCtrl, platform, overlayCleanup);
  }

  override ngOnInit() {
    // Log received user data for debugging
    console.log('📦 Withdraw modal received props:', {
      currentUser: this.currentUser,
      userUniqueId: this.userUniqueId,
      walletId: this.walletId,
      userRole: this.userRole,
    });

    // Load banks from API
    this.loadBanks();
  }

  /**
   * Load Nigerian banks from API
   */
  loadBanks() {
    this.isLoadingBanks = true;

    this.endpointService.getNigerianBanks().subscribe({
      next: (response) => {
        this.isLoadingBanks = false;
        console.log('🏦 Banks loaded:', response);

        // Store the full bank objects
        this.banks = response;

        // Extract bank names for dropdown display
        this.bankNames = response.map((bank: Bank) => bank.bankName);

        console.log('🏦 Bank names extracted:', this.bankNames.length);
      },
      error: (error) => {
        this.isLoadingBanks = false;
        console.error('❌ Error loading banks:', error);

        // Fallback to mock banks if API fails
        this.bankNames = banks;
        this.banks = banks.map((name: string) => ({ bankName: name }));

        this.toast.openSnackBar('Using offline bank list', 'info');
      },
    });
  }

  toggleBankDropdown() {
    this.isBankDropdownOpen = !this.isBankDropdownOpen;
  }

  selectBank(bankName: string) {
    this.selectedBank = bankName;
    this.isBankDropdownOpen = false;
    this.bank = bankName;

    // Find the full bank object if needed
    const selectedBankObj = this.banks.find((b) => b.bankName === bankName);
    console.log('🏦 Selected bank:', selectedBankObj);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.ngZone.run(() => {
          this.previewUrl = reader.result as string;
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  private validateInputs(): boolean {
    if (!this.bank) {
      this.toast.openSnackBar('Please choose a bank', 'error');
      return false;
    }
    if (!this.accountNumber || !/^\d{10,11}$/.test(this.accountNumber)) {
      this.toast.openSnackBar(
        'Enter a valid account number (10–11 digits)',
        'error',
      );
      return false;
    }
    if (!this.amount || this.amount <= 0) {
      this.toast.openSnackBar(
        'Enter a valid amount greater than zero',
        'error',
      );
      return false;
    }
    if (!this.agreed) {
      this.toast.openSnackBar('You must agree to terms & conditions', 'error');
      return false;
    }
    return true;
  }

  async submitWithdrawal() {
    if (!this.validateInputs()) return;

    const transactionId = 'WD-' + Date.now();
    const now = new Date();

    // Use the walletId passed from parent component
    const walletId = this.walletId || '0033392845';

    // Check if we have the required user data
    if (!this.userUniqueId) {
      this.toast.openSnackBar(
        'User information missing. Please try again.',
        'error',
      );
      console.error('❌ Missing userUniqueId in withdraw modal');
      return;
    }

    // Format payload according to API specification
    const payload = {
      amount: this.amount!,
      designatedNubanBank: this.bank!,
      designatedNubanAcctNo: this.accountNumber,
      wallet_id: walletId,
      isTermsAgreed: String(this.agreed), // Must be "true" as string
      bankAccountName: this.selectedBank || this.bank || '', // Optional
    };

    console.log('💰 Submitting withdrawal with payload:', payload);
    console.log('👤 User unique ID for withdrawal:', this.userUniqueId);

    this.endpointService.withdrawFunds(payload).subscribe({
      next: async (res: any) => {
        console.log('✅ Withdrawal successful:', res);

        // Transform response to match component structure
        const withdrawalData = res.data || res;
        const newWithdrawal = {
          id: withdrawalData.withdrawalReferenceNumber || transactionId,
          transactionId:
            withdrawalData.withdrawalReferenceNumber || transactionId,
          amount: this.amount!,
          bank: this.bank!,
          nubamAccNo: this.accountNumber,
          walletId: walletId,
          status: 'Pending',
          date: now,
          receiptUrl: this.previewUrl as string | null,
          withdrawalReferenceNumber: withdrawalData.withdrawalReferenceNumber,
        };

        this.modalCtrl.dismiss(newWithdrawal, 'submitted');

        // Show receipt modal
        const receiptModal = await this.modalCtrl.create({
          component: WithdrawReceiptModalComponent,
          componentProps: {
            ...newWithdrawal,
            date: now.toISOString(),
            fromName: this.currentUser?.fullName || 'My Wallet',
            toName: this.bank,
            fromWalletId: walletId,
            toWalletId: this.accountNumber,
          },
          cssClass: 'withdraw-receipt-modal',
          backdropDismiss: false,
        });
        await receiptModal.present();
      },
      error: async (err: any) => {
        console.error('❌ Withdrawal error:', err);

        // Show error toast with specific message
        const errorMessage =
          err.error?.message ||
          err.message ||
          'Withdrawal failed. Please try again.';
        this.toast.openSnackBar(errorMessage, 'error');

        // Still dismiss but with error status
        this.modalCtrl.dismiss(null, 'error');
      },
    });
  }
}
