import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { deposit as depositMocks } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { Deposit } from 'src/app/models/mocks';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-fund-wallet-request-page',
  templateUrl: './fund-wallet-request-page.component.html',
  styleUrls: ['./fund-wallet-request-page.component.scss'],
  standalone: false,
})
export class FundWalletRequestPageComponent implements OnInit {
  images = imageIcons;
  deposits: Deposit[] = depositMocks; // full list
  deposit?: Deposit; // selected deposit

  constructor(private router: Router, private route: ActivatedRoute) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.deposit = nav.extras.state['deposit'];
    }
  }

  ngOnInit(): void {
    // First try to get deposit from navigation state
    const navState = history.state;
    if (navState && navState.deposit) {
      this.deposit = navState.deposit;
    } else {
      // Fallback: fetch by ID from route params if user refreshes or comes directly
      const depositId = this.route.snapshot.paramMap.get('id');
      if (depositId) {
        // TODO: fetch from backend or local store using depositId
        console.warn('Deposit not found in state. Fetching by ID:', depositId);
      }
    }
  }

  get referenceId(): string {
    if (!this.deposit) return '';
    const timestamp = new Date(this.deposit.date).getTime();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `${this.deposit.walletAcctNo}-${timestamp}-${rand}`;
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
    pdf.save(`deposit-receipt-${this.referenceId}.pdf`);
  }
}
