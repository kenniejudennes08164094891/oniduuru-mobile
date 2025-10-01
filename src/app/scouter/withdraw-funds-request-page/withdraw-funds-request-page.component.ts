import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { withdrawal as withdrawalMocks } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { Withdrawal } from 'src/app/models/mocks';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-withdraw-funds-request-page',
  templateUrl: './withdraw-funds-request-page.component.html',
  styleUrls: ['./withdraw-funds-request-page.component.scss'],
  standalone: false,
})
export class WithdrawFundsRequestPageComponent implements OnInit {
  images = imageIcons;
  withdrawals: Withdrawal[] = withdrawalMocks; // full list
  withdrawal?: Withdrawal; // selected withdrawal

  constructor(private router: Router, private route: ActivatedRoute) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.withdrawal = nav.extras.state['withdrawal'];
    }
  }

  ngOnInit(): void {
    const navState = history.state;
    if (navState && navState.withdrawal) {
      this.withdrawal = navState.withdrawal;
    } else {
      const withdrawalId = this.route.snapshot.paramMap.get('id');
      if (withdrawalId) {
        console.warn(
          'Withdrawal not found in state. Fetching by ID:',
          withdrawalId
        );
      }
    }
  }

  get referenceId(): string {
    if (!this.withdrawal) return '';
    const timestamp = new Date(this.withdrawal.date).getTime();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${this.withdrawal.walletAcctNo}-${timestamp}-${rand}`;
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
