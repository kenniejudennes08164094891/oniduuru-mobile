import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-transfer-funds-request-page',
  templateUrl: './transfer-funds-request-page.component.html',
  styleUrls: ['./transfer-funds-request-page.component.scss'],
  standalone: false,
})
export class TransferFundsRequestPageComponent implements OnInit {
  images = imageIcons;
  transfer: any = null;
  referenceId: string = '';
  isDownloading = false;
  receiptUrl: string | null = null;
  currentUser: any = null;
  userName: string = '';
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
    this.loadTransfer();
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

  loadTransfer() {
    const navState = history.state;
    const transferId = this.route.snapshot.paramMap.get('id');

    if (navState && navState.transfer) {
      this.transfer = navState.transfer;
      this.generateReferenceId();
      this.fetchTransactionReceipt();
    } else if (transferId && this.currentUser) {
      // Fetch from API if needed
      this.endpointService.fetchSingleTransfer(transferId).subscribe({
        next: (response) => {
          if (response?.data) {
            this.transfer = response.data;
            this.generateReferenceId();
            this.fetchTransactionReceipt();
          }
        },
        error: (error) => {
          console.error('Error fetching transfer:', error);
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

  // Update your fetchTransactionReceipt method
  fetchTransactionReceipt() {
    if (!this.transfer) {
      console.warn('❌ No transfer object available');
      this.receiptUrl = null;
      return;
    }

    const referenceId =
      this.transfer.transferReferenceNumber || this.transfer.id;
    if (!referenceId) {
      console.warn('❌ No transfer reference ID or ID available');
      this.receiptUrl = null;
      return;
    }

    this.isLoadingReceipt = true;
    console.log('📄 Fetching receipt from backend for transfer:', referenceId);

    this.endpointService
      .fetchTransactionReceipt('transfer', referenceId)
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

  generateReferenceId() {
    if (this.transfer) {
      // Use actual transaction reference ID if available
      if (this.transfer.transferReferenceNumber) {
        this.referenceId = this.transfer.transferReferenceNumber;
        console.log('📝 Using actual transfer reference ID:', this.referenceId);
      } else if (this.transfer.id) {
        this.referenceId = this.transfer.id;
        console.log('📝 Using transfer ID as reference:', this.referenceId);
      } else {
        // Fallback: generate only if no actual reference available
        const timestamp = new Date(this.transfer.date).getTime();
        const rand = Math.floor(100000 + Math.random() * 900000);
        this.referenceId = `${this.transfer.walletAcctNo || 'TR'}-${timestamp}-${rand}`;
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
        await this.downloadImageFromUrl(this.receiptUrl);
        this.toastService.openSnackBar(
          'Receipt downloaded successfully',
          'success',
        );
      } else {
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
      const response = await fetch(url);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `transfer-receipt-${this.referenceId || 'transaction'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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
    link.download = `transfer-receipt-${this.referenceId || 'transaction'}.png`;
    link.click();
  }
}
