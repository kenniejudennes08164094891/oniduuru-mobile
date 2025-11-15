import { Component, Input, NgZone, OnInit } from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { PaymentService } from 'src/app/services/payment.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { FundWalletReceiptModalComponent } from '../fund-wallet-receipt-modal/fund-wallet-receipt-modal.component';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-fund-wallet-popup-modal',
  templateUrl: './fund-wallet-popup-modal.component.html',
  styleUrls: ['./fund-wallet-popup-modal.component.scss'],
  standalone: false,
})
export class FundWalletPopupModalComponent extends BaseModal implements OnInit {
  @Input() isModalOpen: boolean = false;

  // 🔹 Form model
  fundType: 'Fund Self' | 'Fund Others' | null = null;

  walletAccNo: string = '';
  walletName: string = '';
  reason: string = '';
  agreed: boolean = false;

  copied: boolean = false;

  formSubmitted = false;

  // 🔹 Upload state
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  amount: number | null = null;
  formattedAmount: string = '';

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastService: ToastsService,
    private ngZone: NgZone,
    private endpointService: EndpointService
  ) {
    super(modalCtrl, platform);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  onAmountChange(value: string) {
    // remove non-digits
    const numericValue = value.replace(/\D/g, '');

    // convert to number
    this.amount = numericValue ? parseInt(numericValue, 10) : null;

    // format with commas & ₦
    this.formattedAmount = this.amount
      ? '₦ ' + this.amount.toLocaleString()
      : '';
  }

  // Upload handlers with validation
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // ✅ Validate file type
      const allowedTypes = [
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/gif',
        'image/svg+xml',
      ];
      if (!allowedTypes.includes(file.type)) {
        this.toastService.openSnackBar(
          'Invalid file type. Please upload an image (PNG, JPG, JPEG, GIF, SVG).',
          'danger'
        );

        this.removeScreenshot();
        return;
      }

      // ✅ Validate file size (e.g., max 2MB)
      const maxSizeInMB = 2;
      if (file.size > maxSizeInMB * 1024 * 1024) {
        this.showToast(
          `File is too large. Max size is ${maxSizeInMB}MB.`,
          'danger'
        );
        this.removeScreenshot();
        return;
      }

      this.selectedFile = file;

      // ✅ Preview using Base64
      const reader = new FileReader();
      reader.onload = () => {
        this.ngZone.run(() => {
          this.previewUrl = reader.result as string;
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // Extra input validation (for walletAcc & walletName)
  private validateForm(): boolean {
    if (!this.amount || this.amount <= 0) {
      this.showToast('Enter a valid amount greater than zero.', 'warning');
      return false;
    }

    if (!this.walletAccNo || !/^\d{10,11}$/.test(this.walletAccNo)) {
      this.showToast(
        'Enter a valid wallet account number (10–11 digits).',
        'warning'
      );
      return false;
    }

    if (!this.walletName || !/^[A-Za-z ]+$/.test(this.walletName)) {
      this.showToast(
        'Wallet name is required and must contain only letters.',
        'warning'
      );
      return false;
    }

    if (!this.selectedFile) {
      this.showToast('Please upload a valid receipt screenshot.', 'danger');
      this.toastService.openSnackBar(
        'Please upload a valid receipt screenshot.',
        'warning'
      );
      return false;
    }

    if (!this.agreed) {
      this.toastService.openSnackBar(
        'You must agree to terms & conditions.',
        'warning'
      );
      return false;
    }

    if (!this.reason || this.reason.trim().length < 3) {
      this.toastService.openSnackBar(
        'Enter a valid reason for deposit.',
        'warning'
      );

      return false;
    }

    return true;
  }

  // Submit form with validation check
  async submitDeposit() {
    this.formSubmitted = true;
    if (!this.validateForm()) return;

    const transactionId = 'INV-' + Date.now();

    const depositData = {
      amount: this.amount,
      transactionId,
      status: 'Successful',
      date: new Date(),
      fromName: 'Omosehin Kehinde Jude',
      toName: this.walletName,
      fromWalletId: 'Oniduuru Admin Wallet',
      toWalletId: this.walletAccNo,
      walletName: this.walletName,
      walletAcctNo: this.walletAccNo, // ✅ renamed to match interface
      identifier: this.fundType || 'N/A',
      receiptUrl: this.previewUrl as string,
      reason: this.reason, // ✅ add this line
    };

    // Try calling backend deposit endpoint; fallback to local dismissal on error
    try {
      this.formSubmitted = true;
      const payload = {
        amount: this.amount,
        transactionId,
        toWalletId: this.walletAccNo,
        walletName: this.walletName,
        identifier: this.fundType || 'Fund Self',
        receiptUrl: this.previewUrl,
        reason: this.reason,
      };

      this.endpointService.fundsDeposit(payload).subscribe({
        next: async (res: any) => {
          // server returned success — dismiss and show receipt
          this.modalCtrl.dismiss(res?.data ?? depositData, 'submitted');

          const receiptModal = await this.modalCtrl.create({
            component: FundWalletReceiptModalComponent,
            componentProps: {
              ...(res?.data ?? depositData),
              date: (res?.data?.date || depositData.date).toString(),
            },
            cssClass: 'fund-wallet-receipt-modal',
            initialBreakpoint: 1,
            backdropDismiss: false,
          });
          await receiptModal.present();
          this.formSubmitted = false;
        },
        error: async (err: any) => {
          console.error('fundsDeposit error', err);
          // fallback: dismiss with local data so UI still updates
          this.modalCtrl.dismiss(depositData, 'submitted');
          const receiptModal = await this.modalCtrl.create({
            component: FundWalletReceiptModalComponent,
            componentProps: {
              ...depositData,
              date: depositData.date.toISOString(),
            },
            cssClass: 'fund-wallet-receipt-modal',
            initialBreakpoint: 1,
            backdropDismiss: false,
          });
          await receiptModal.present();
          this.formSubmitted = false;
        },
      });
    } catch (err) {
      console.error('fundsDeposit catch', err);
      this.modalCtrl.dismiss(depositData, 'submitted');
    }
  }

  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;

      this.toastService.openSnackBar('Copied to clipboard ✅', 'success');

      // Reset icon back to copy after 2s
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    } catch (err) {
      this.toastService.openSnackBar('Failed to copy ❌', 'danger');
    }
  }

  private async showToast(message: string, color: string) {
    // const toast = await this.toastCtrl.create({
    //   message,
    //   duration: 2000,
    //   position: 'bottom',
    //   color,
    // });
    // await toast.present();

    this.toastService.openSnackBar(message, color);
  }
}
