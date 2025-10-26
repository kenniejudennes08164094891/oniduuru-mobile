import { Component } from '@angular/core';
import {
  ModalController,
  IonicModule,
  ToastController,
  Platform,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ToastsService } from 'src/app/services/toasts.service';

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
export class MakePaymentPopupModalComponent extends BaseModal {
  paymentDetails: PaymentDetail[] = [
    { label: 'Amount Payable', value: '₦ 1,000.00' },
    { label: 'Bank', value: 'Diamond (Access Bank)' },
    { label: 'Account Number', value: '0185476321', isCopy: true },
    { label: 'Account Name', value: 'Shoft Africa Inc', bold: true },
  ];

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private toastService: ToastsService
  ) {
    super(modalCtrl, platform); // ✅ inherits dismiss + back button
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
