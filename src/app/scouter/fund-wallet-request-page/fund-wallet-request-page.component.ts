import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { deposit as depositMocks } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { Deposit } from 'src/app/models/mocks';
// import jsPDF from 'jspdf';
import * as html2canvas from 'html2canvas';

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
  referenceId: string = '';

  isLoading = false;

  constructor(private router: Router, private route: ActivatedRoute) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.deposit = nav.extras.state['deposit'];
    }
  }

  ngOnInit(): void {
    const navState = history.state;
    if (navState && navState.deposit) {
      this.deposit = navState.deposit;
    } else {
      const depositId = this.route.snapshot.paramMap.get('id');
      if (depositId) {
        console.warn('Deposit not found in state. Fetching by ID:', depositId);
      }
    }

    if (this.deposit) {
      const timestamp = new Date(this.deposit.date).getTime();
      const rand = Math.floor(100000 + Math.random() * 900000);
      this.referenceId = `${this.deposit.walletAcctNo}-${timestamp}-${rand}`;
    }
  }

  async downloadReceipt() {
    this.isLoading = true;

    try {
      const element = document.getElementById('receipt');
      if (!element) {
        console.error('Receipt element not found');
        return;
      }

      const canvas = await (html2canvas as any)(element, {
        scale: 3,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `deposit-receipt-${this.referenceId}.png`;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      this.isLoading = false; // stop spinner
    }
  }
}
