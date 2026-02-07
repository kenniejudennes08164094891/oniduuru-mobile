import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
// import * as html2canvas from 'html2canvas'; // Change this line
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-fund-wallet-request-page',
  templateUrl: './fund-wallet-request-page.component.html',
  styleUrls: ['./fund-wallet-request-page.component.scss'],
  standalone: false,
})
export class FundWalletRequestPageComponent implements OnInit {
  images = imageIcons;
  deposit: any = null;
  referenceId: string = '';
  isLoading = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private endpointService: EndpointService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadDeposit();
  }

  loadCurrentUser() {
    const userData =
      localStorage.getItem('user_data') ||
      localStorage.getItem('user_profile_data');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  loadDeposit() {
    const navState = history.state;
    const depositId = this.route.snapshot.paramMap.get('id');

    if (navState && navState.deposit) {
      this.deposit = navState.deposit;
      this.generateReferenceId();
    } else if (depositId && this.currentUser) {
      // Fetch from API
      this.isLoading = true;

      this.endpointService
        .fetchSingleDeposit(depositId, this.currentUser.scouterId)
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response?.data) {
              this.deposit = {
                id: response.data.depositReferenceNumber,
                amount: response.data.amount,
                walletName: response.data.designatedWalletName,
                walletAcctNo: response.data.designatedWalletAcct,
                identifier: response.data.identifier || 'Fund Self',
                status: this.mapStatus(response.data.status),
                date: new Date(response.data.createdAt || response.data.date),
                reason: response.data.reasonForDeposit || '',
              };
              this.generateReferenceId();
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error fetching deposit:', error);
          },
        });
    }
  }

  private mapStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      success: 'Successful',
      pending: 'Pending',
      invalid: 'Invalid',
      isReversed: 'Reversed',
      failed: 'Failed',
    };
    return statusMap[apiStatus] || apiStatus;
  }

  private generateReferenceId() {
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

      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
      } as any); // type assertion

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `deposit-receipt-${this.referenceId}.png`;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      this.isLoading = false;
    }
  }
}


