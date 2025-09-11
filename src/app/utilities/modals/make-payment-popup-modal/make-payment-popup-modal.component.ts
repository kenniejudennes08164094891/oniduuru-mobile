import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PaymentDetail {
  label: string;
  value: string;
  isCopy?: boolean; // flag to show copy icon
  bold?: boolean; // flag for bold text
  copied?: boolean; // flag for copied state
}

@Component({
  selector: 'app-make-payment-popup-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './make-payment-popup-modal.component.html',
  styleUrls: ['./make-payment-popup-modal.component.scss'],
})
export class MakePaymentPopupModalComponent implements OnInit {
  paymentDetails: PaymentDetail[] = [
    { label: 'Amount Payable', value: '₦ 1,000.00' },
    { label: 'Bank', value: 'Diamond (Access Bank)' },
    { label: 'Account Number', value: '0185476321', isCopy: true },
    { label: 'Account Name', value: 'Shoft Africa Inc', bold: true },
  ];

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  goToActivateAccount() {
    // close modal first
    this.modalCtrl.dismiss();

    this.router.navigate(['/scouter/account-activation']);
  }

  async openMakePaymentPopup() {
    const modal = await this.modalCtrl.create({
      component: MakePaymentPopupModalComponent,
      cssClass: 'make-payment-modal',
      backdropDismiss: true,
    });
    return await modal.present();
  }

  async copyToClipboard(item: PaymentDetail) {
    await navigator.clipboard.writeText(item.value);

    item.copied = true; // safe now

    // reset after 2s
    setTimeout(() => {
      item.copied = false;
    }, 2000);

    const toast = await this.toastCtrl.create({
      message: `Copied: ${item.value}`,
      duration: 1500,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }
}
