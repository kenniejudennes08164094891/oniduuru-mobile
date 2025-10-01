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
import { banks, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { WithdrawReceiptModalComponent } from '../withdraw-receipt-modal/withdraw-receipt-modal.component'; // <-- added

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

  images = imageIcons;
  hires = MockRecentHires;

  formSubmitted = false;

  
  walletAccNo: string = '';
  walletName: string = '';
  agreed: boolean = false;

  banks = banks;

  // User’s chosen bank (single value)
  bank: string | null = null;

  selectedBank: string | null = null;
  isBankDropdownOpen = false;

  // form fields
  // bank: string | null = null;
  accountNumber: string = '';
  amount: number | null = null;
  walletId: string = '0033392845'; // default (can be replaced)
  // agreed: boolean = false;

  // file preview
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    super(modalCtrl, platform);
  }

  toggleBankDropdown() {
    this.isBankDropdownOpen = !this.isBankDropdownOpen;
  }

  selectBank(bank: string) {
    this.selectedBank = bank;
    this.isBankDropdownOpen = false;
    this.bank = bank; // ✅ keep it as string
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

  // --------------------
  // New: submit + receipt popup
  // --------------------
  private async presentToast(message: string, color = 'danger') {
    const t = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom',
    });
    await t.present();
  }

  private validateInputs(): boolean {
    if (!this.bank) {
      this.presentToast('Please choose a bank');
      return false;
    }
    if (!this.accountNumber || !/^\d{10,11}$/.test(this.accountNumber)) {
      this.presentToast('Enter a valid account number (10–11 digits)');
      return false;
    }
    if (!this.amount || this.amount <= 0) {
      this.presentToast('Enter a valid amount greater than zero');
      return false;
    }
    // if (!this.agreed) {
    //   this.presentToast('You must agree to terms & conditions', 'warning');
    //   return false;
    // }
    return true;
  }

  async submitWithdrawal() {
    if (!this.validateInputs()) return;

    const transactionId = 'WD-' + Date.now();
    const now = new Date();

    const newWithdrawal = {
      amount: this.amount!,
      walletName: 'Current User',
      walletAcctNo: this.accountNumber,
      identifier: 'Withdraw',
      status: 'Pending' as const,
      date: now,
      bank: this.bank!,
      nubamAccNo: this.accountNumber,
      walletId: this.walletId,
      transactionId,
      receiptUrl: this.previewUrl as string | null,
      reason: 'Personal withdrawal', // 👈 you can capture reason here too
    };

    // Pass data back to parent
    this.modalCtrl.dismiss(newWithdrawal, 'submitted');

    // Also open receipt modal with same data
    const receiptModal = await this.modalCtrl.create({
      component: WithdrawReceiptModalComponent,
      componentProps: {
        ...newWithdrawal,
        date: now.toISOString(),
        fromName: 'Omosehin Kehinde Jude',
        toName: 'Olorunda Victory Chidi',
        fromWalletId: 'OniduuruAdmin Wallet',
        toWalletId: newWithdrawal.nubamAccNo,
      },
      cssClass: 'withdraw-receipt-modal',
      backdropDismiss: false,
    });
    await receiptModal.present();
  }
}
