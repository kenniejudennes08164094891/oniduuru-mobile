import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { imageIcons } from 'src/app/models/stores';
import { ToastsService } from 'src/app/services/toasts.service';

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
  isDownloading = false;
  currentUser: any = null;
  userName: string = '';
  receiptUrl: string | null = null;

  isLoadingReceipt: boolean = false;
  showReceiptModal: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private endpointService: EndpointService,
    private authService: AuthService,
    private toastService: ToastsService,
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
        this.userName = this.extractUserName(this.currentUser);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  private extractUserName(userData: any): string {
    if (!userData) return 'User';

    const user =
      userData.details?.user ||
      userData.user ||
      userData.data?.user ||
      userData;
    let fullName = 'User';

    if (user.firstName && user.lastName) {
      fullName = `${user.firstName} ${user.lastName}`.trim();
    } else if (user.fullName) {
      fullName = user.fullName;
    } else if (user.fullname) {
      fullName = user.fullname;
    } else if (user.name) {
      fullName = user.name;
    } else if (user.username) {
      fullName = user.username;
    } else if (user.displayName) {
      fullName = user.displayName;
    } else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      fullName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    return fullName;
  }

  loadDeposit() {
    const navState = history.state;
    const depositId = this.route.snapshot.paramMap.get('id');

    if (navState && navState.deposit) {
      this.deposit = navState.deposit;
      this.generateReferenceId();
      // Fetch receipt after deposit is loaded
      this.fetchTransactionReceipt();
    } else if (depositId && this.currentUser) {
      // Fetch from API
      this.isLoading = true;

      this.endpointService
        .fetchSingleDeposit(
          depositId,
          this.currentUser.scouterId || this.currentUser.talentId,
        )
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            if (response?.data) {
              this.deposit = {
                id: response.data.depositReferenceNumber,
                depositReferenceNumber: response.data.depositReferenceNumber,
                amount: response.data.amount,
                walletName: response.data.designatedWalletName,
                walletAcctNo: response.data.designatedWalletAcct,
                identifier: response.data.identifier || 'Fund Self',
                status: this.mapStatus(response.data.status),
                date: new Date(response.data.createdAt || response.data.date),
                reason: response.data.reasonForDeposit || '',
              };
              this.generateReferenceId();
              // Fetch receipt after deposit is loaded
              this.fetchTransactionReceipt();
            }
          },
          error: (error) => {
            this.isLoading = false;
            console.error('Error fetching deposit:', error);
            this.toastService.openSnackBar(
              'Failed to load deposit details',
              'error',
            );
          },
        });
    }
  }

  onReceiptLoaded() {
    console.log('✅ Receipt image loaded successfully');
    this.isLoadingReceipt = false;
  }

  onReceiptError() {
    console.error('❌ Failed to load receipt image');
    this.isLoadingReceipt = false;
    // Fallback to HTML receipt
    this.receiptUrl = null;
  }

  // Fetch transaction receipt from backend with proper error handling
  fetchTransactionReceipt() {
    if (!this.deposit) {
      console.warn('❌ No deposit object available');
      this.receiptUrl = null;
      return;
    }

    const referenceId = this.deposit.depositReferenceNumber || this.deposit.id;
    if (!referenceId) {
      console.warn('❌ No deposit reference ID or ID available');
      this.receiptUrl = null;
      return;
    }

    this.isLoadingReceipt = true;
    console.log('📄 Fetching receipt from backend for deposit:', referenceId);

    this.endpointService
      .fetchTransactionReceipt('deposit', referenceId)
      .subscribe({
        next: (response) => {
          console.log('✅ Receipt API response:', response);
          // Check if response has data field with URL
          if (response?.data && typeof response.data === 'string') {
            console.log('🖼️ Receipt URL received:', response.data);
            this.receiptUrl = response.data;
          } else {
            console.warn('⚠️ Receipt response missing data URL:', response);
            this.receiptUrl = null;
          }
          this.isLoadingReceipt = false;
        },
        error: (error) => {
          console.error('❌ Receipt fetch error:', {
            status: error?.status,
            message: error?.message,
            error: error?.error,
          });
          // Fall back to HTML receipt (hardcoded HTML will show)
          this.receiptUrl = null;
          this.isLoadingReceipt = false;
        },
      });
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
      // Use actual transaction reference ID if available
      if (this.deposit.depositReferenceNumber) {
        this.referenceId = this.deposit.depositReferenceNumber;
        console.log('🔖 Using actual deposit reference ID:', this.referenceId);
      } else if (this.deposit.id) {
        this.referenceId = this.deposit.id;
        console.log('🔖 Using deposit ID as reference:', this.referenceId);
      } else {
        // Fallback: generate only if no actual reference available
        const timestamp = new Date(this.deposit.date).getTime();
        const rand = Math.floor(100000 + Math.random() * 900000);
        this.referenceId = `${this.deposit.walletAcctNo || 'FUND'}-${timestamp}-${rand}`;
        console.warn(
          '⚠️ Generated fallback reference ID (no actual ID found):',
          this.referenceId,
        );
      }
    }
  }

  /**
   * Download receipt from URL or generate if not available
   */
  async downloadReceipt() {
    this.isDownloading = true;

    try {
      if (this.receiptUrl) {
        // If we have a URL from API, download the image
        await this.downloadImageFromUrl(this.receiptUrl);
        this.toastService.openSnackBar(
          'Receipt downloaded successfully',
          'success',
        );
      } else {
        // Fallback to HTML2Canvas if receipt not available from API
        await this.generateAndDownloadReceipt();
      }
    } catch (error) {
      console.error('Download error:', error);
      this.toastService.openSnackBar('Failed to download receipt', 'error');
    } finally {
      this.isDownloading = false;
    }
  }

  /**
   * Download image from URL
   */
  private async downloadImageFromUrl(url: string): Promise<void> {
    try {
      // Fetch the image as a blob
      const response = await fetch(url);
      const blob = await response.blob();

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `deposit-receipt-${this.referenceId || 'transaction'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image from URL:', error);
      throw error;
    }
  }

  /**
   * Fallback: Generate receipt using HTML2Canvas
   */
  private async generateAndDownloadReceipt(): Promise<void> {
    const element = document.getElementById('receipt');
    if (!element) {
      throw new Error('Receipt element not found');
    }

    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `deposit-receipt-${this.referenceId || 'transaction'}.png`;
    link.click();
  }
}
