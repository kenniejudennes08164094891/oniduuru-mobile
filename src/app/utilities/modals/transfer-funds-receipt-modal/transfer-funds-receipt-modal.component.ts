import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-transfer-funds-receipt-modal',
  templateUrl: './transfer-funds-receipt-modal.component.html',
  styleUrls: ['./transfer-funds-receipt-modal.component.scss'],
  standalone: false,
})
export class TransferFundsReceiptModalComponent implements OnInit {
  @Input() amount!: number;
  @Input() transactionId!: string;
  @Input() status!: string;
  @Input() date!: string; // ISO string
  @Input() bank!: string;
  @Input() nubamAccNo!: string;
  @Input() walletId!: string;
  @Input() receiptUrl!: string | null;

  // 🔹 Add these for parties
  @Input() fromName!: string;
  @Input() toName!: string;
  @Input() fromWalletId!: string;
  @Input() toWalletId!: string;

  formattedDate: string = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    if (this.date) {
      this.formattedDate = this.formatDateString(this.date);
    } else {
      this.formattedDate = this.formatDateString(new Date().toISOString());
    }
  }

  closeReceipt() {
    this.modalCtrl.dismiss(null, 'close');
  }

  // exact format: Jul 13,2025, 2:30PM
  private formatDateString(dateInput: string | Date) {
    const d = new Date(dateInput);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const mon = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hour = d.getHours();
    const min = d.getMinutes().toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour === 0 ? 12 : hour;
    return `${mon} ${day},${year}, ${hour}:${min}${ampm}`;
  }
}
