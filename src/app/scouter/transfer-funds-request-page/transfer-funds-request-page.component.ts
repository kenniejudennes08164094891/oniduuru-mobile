import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Transfer, transfer as transferMocks } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { Withdrawal } from 'src/app/models/mocks';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-transfer-funds-request-page',
  templateUrl: './transfer-funds-request-page.component.html',
  styleUrls: ['./transfer-funds-request-page.component.scss'],
  standalone: false,
})
export class TransferFundsRequestPageComponent implements OnInit {
  images = imageIcons;
  transfers: Transfer[] = transferMocks; // full list
  transfer?: Transfer; // selected withdrawal

  constructor(private router: Router, private route: ActivatedRoute) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.transfer = nav.extras.state['transfer'];
    }
  }

  ngOnInit(): void {
    const navState = history.state;
    if (navState && navState.transfer) {
      this.transfer = navState.transfer;
    } else {
      const transferId = this.route.snapshot.paramMap.get('id');
      if (transferId) {
        console.warn(
          'Transfer not found in state. Fetching by ID:',
          transferId
        );
      }
    }
  }

  get referenceId(): string {
    if (!this.transfer) return '';
    const timestamp = new Date(this.transfer.date).getTime();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${this.transfer.walletAcctNo}-${timestamp}-${rand}`;
  }

  async downloadReceipt() {
    const element = document.getElementById('receipt');
    if (!element) {
      console.error('Receipt element not found');
      return;
    }

    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`withdrawal-receipt-${this.referenceId}.pdf`);
  }
}
