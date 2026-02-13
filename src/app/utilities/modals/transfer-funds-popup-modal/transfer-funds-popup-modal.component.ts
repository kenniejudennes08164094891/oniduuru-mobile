import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { TransferFundsReceiptModalComponent } from '../transfer-funds-receipt-modal/transfer-funds-receipt-modal.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastsService } from 'src/app/services/toasts.service';
import { EndpointService } from 'src/app/services/endpoint.service';

@Component({
  selector: 'app-transfer-funds-popup-modal',
  templateUrl: './transfer-funds-popup-modal.component.html',
  styleUrls: ['./transfer-funds-popup-modal.component.scss'],
  standalone: false,
})
export class TransferFundsPopupModalComponent
  extends BaseModal
  implements OnInit
{
  @Input() isModalOpen: boolean = false;
  @Input() currentUser: any = null;
  @Input() userUniqueId: string | null = null;
  @Input() originatingWalletId: string = '0033392845'; // Source wallet ID
  @Input() userRole: string = '';

  images = imageIcons;
  hires = MockRecentHires;

  formSubmitted = false;
  transferForm!: FormGroup;

  // Transaction charge
  transactionCharge: number = 200;
  isLoadingCharge: boolean = false;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toast: ToastsService,
    private ngZone: NgZone,
    private fb: FormBuilder,
    private endpointService: EndpointService
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    this.initForm();
    console.log('📦 Transfer modal received props:', {
      currentUser: this.currentUser,
      userUniqueId: this.userUniqueId,
      originatingWalletId: this.originatingWalletId,
      userRole: this.userRole
    });
  }

  private initForm() {
    this.transferForm = this.fb.group({
      accountNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{10,11}$/), // 10-11 digits for wallet ID
        ],
      ],
      walletName: ['', [Validators.required, Validators.minLength(3)]],
      amount: [
        null,
        [Validators.required, Validators.min(100)], // Must be ≥ 100
      ],
      marketHireId: [''], // Optional
      agreeTerms: [false, Validators.requiredTrue], // Must tick checkbox
    });

    // Calculate transaction charge when amount changes
    this.transferForm.get('amount')?.valueChanges.subscribe((amount) => {
      if (amount && amount > 0) {
        this.calculateCharge(amount);
      }
    });
  }

  /**
   * Calculate transaction charge
   */
  private calculateCharge(amount: number) {
    this.isLoadingCharge = true;
    this.endpointService.calculateTransactionCharge(amount.toString()).subscribe({
      next: (response) => {
        this.isLoadingCharge = false;
        // Adjust based on actual API response structure
        this.transactionCharge = response?.data?.charge || response?.charge || 200;
        console.log('💰 Transaction charge:', this.transactionCharge);
      },
      error: (error) => {
        this.isLoadingCharge = false;
        console.error('❌ Error calculating charge:', error);
        // Use default charge
        this.transactionCharge = 200;
      }
    });
  }

  async createFundTransfer() {
    if (this.transferForm.invalid) {
      this.markFormGroupTouched(this.transferForm);
      this.toast.openSnackBar('Please fill all fields correctly.', 'error');
      return;
    }

    if (!this.originatingWalletId) {
      this.toast.openSnackBar('Source wallet ID is missing', 'error');
      return;
    }

    const formData = this.transferForm.value;

    // Format payload according to API specification
    const payload = {
      amount: formData.amount,
      designatedWalletAcct: formData.accountNumber, // The wallet ID you're sending funds to
      originatingWalletAcct: this.originatingWalletId, // Your wallet ID you're removing money from
      marketHireId: formData.marketHireId || undefined // Optional
    };

    console.log('💰 Submitting transfer with payload:', payload);

    this.endpointService.transferFunds(payload).subscribe({
      next: async (res: any) => {
        console.log('✅ Transfer successful:', res);

        const transferData = res.data || res;
        const transactionId = transferData.transferReferenceId || 'TRF-' + Date.now();

        const newTransfer = {
          amount: formData.amount,
          transactionId: transactionId,
          transferReferenceId: transactionId,
          status: 'Pending',
          date: new Date().toISOString(),
          walletId: formData.accountNumber,
          walletName: formData.walletName,
          originatingWalletId: this.originatingWalletId,
          fromName: this.currentUser?.fullName || 'My Wallet',
          toName: formData.walletName,
          fromWalletId: this.originatingWalletId,
          toWalletId: formData.accountNumber,
          charge: this.transactionCharge
        };

        // Pass data back to parent
        this.modalCtrl.dismiss(newTransfer, 'submitted');

        // Show receipt modal
        const receiptModal = await this.modalCtrl.create({
          component: TransferFundsReceiptModalComponent,
          componentProps: {
            ...newTransfer,
            date: new Date().toISOString(),
            fromName: this.currentUser?.fullName || 'My Wallet',
            toName: formData.walletName,
            fromWalletId: this.originatingWalletId,
            toWalletId: formData.accountNumber,
          },
          cssClass: 'transfer-receipt-modal',
          backdropDismiss: false,
        });
        await receiptModal.present();
      },
      error: async (err: any) => {
        console.error('❌ Transfer error:', err);
        
        const errorMessage = err.error?.message || err.message || 'Transfer failed. Please try again.';
        this.toast.openSnackBar(errorMessage, 'error');
        
        this.modalCtrl.dismiss(null, 'error');
      },
    });
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  override dismiss() {
    super.dismiss();
  }

  // Getters for form controls
  get accountNumberControl() { return this.transferForm.get('accountNumber'); }
  get walletNameControl() { return this.transferForm.get('walletName'); }
  get amountControl() { return this.transferForm.get('amount'); }
  get agreeTermsControl() { return this.transferForm.get('agreeTerms'); }
}