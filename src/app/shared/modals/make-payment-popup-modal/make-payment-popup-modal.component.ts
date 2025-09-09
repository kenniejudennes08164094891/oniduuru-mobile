import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface PaymentDetail {
  label: string;
  value: string;
  isCopy?: boolean; // flag to show copy icon
  bold?: boolean; // flag for bold text
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

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  async openMakePaymentPopup() {
    const modal = await this.modalCtrl.create({
      component: MakePaymentPopupModalComponent,
      cssClass: 'make-payment-modal',
      backdropDismiss: true,
    });
    return await modal.present();
  }

  copyToClipboard(value: string) {
    navigator.clipboard.writeText(value);
    alert('Copied: ' + value);
  }
}
