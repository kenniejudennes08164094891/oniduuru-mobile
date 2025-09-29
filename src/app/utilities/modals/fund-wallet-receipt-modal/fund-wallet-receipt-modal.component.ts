import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
@Component({
  selector: 'app-fund-wallet-receipt-modal',
  templateUrl: './fund-wallet-receipt-modal.component.html',
  styleUrls: ['./fund-wallet-receipt-modal.component.scss'],
  standalone: false,
})
export class FundWalletReceiptModalComponent implements OnInit {
  @Input() amount!: number;
  @Input() transactionId!: string;
  @Input() status!: string;
  @Input() date!: string;
  @Input() fromName!: string;
  @Input() toName!: string;
  @Input() fromWalletId!: string;
  @Input() toWalletId!: string;
  @Input() receiptUrl!: string;
  @Input() walletAcc!: string;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  closeReceipt() {
    this.modalCtrl.dismiss(null, 'close'); // trigger parent close
  }
}
