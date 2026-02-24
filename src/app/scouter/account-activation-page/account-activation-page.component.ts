// account-activation-page.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { UploadScreenshotPopupModalComponent } from 'src/app/utilities/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { PaymentService, PaymentStatus } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-activation-page',
  templateUrl: './account-activation-page.component.html',
  styleUrls: ['./account-activation-page.component.scss'],
  standalone: false,
})
export class AccountActivationPageComponent implements OnInit, OnDestroy {
  images = imageIcons;
  headerHidden: boolean = false;
  currentMonth: string = new Date().toLocaleString('en-US', { month: 'short' });
  currentYear: number = new Date().getFullYear();
  currentDate: number = new Date().getDate();
  currentTime: string = new Date().toLocaleTimeString();
  paymentStatus: PaymentStatus = { status: 'false' };
  isLoading: boolean = true;
  userName: string = 'Scouter';
  uploadTimeFormatted: string = '';
  
  private paymentSubscription: Subscription;

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private router: Router,
    private scouterEndpoints: ScouterEndpointsService,
    private toast: ToastsService,
  ) {
    this.paymentSubscription = this.paymentService.paymentStatus$.subscribe(status => {
      this.paymentStatus = status;
      this.uploadTimeFormatted = status.timeOfUpload || '';
      console.log('💰 Payment status updated in activation page:', status);
    });
  }

  ngOnInit() {
    this.extractUserName();
    
    // Fetch receipt based on payment status
    this.loadPaymentData();
  }

  ngOnDestroy() {
    if (this.paymentSubscription) {
      this.paymentSubscription.unsubscribe();
    }
  }

  private extractUserName(): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.userName =
          parsed.fullName || parsed.name || parsed.firstName || 'Scouter';
      }
    } catch (error) {
      console.warn('⚠️ Could not extract user name:', error);
      this.userName = 'Scouter';
    }
  }

  private loadPaymentData(): void {
    this.isLoading = true;
    
    // Check current payment status
    const currentStatus = this.paymentService.getPaymentStatusString();
    console.log('📋 Current payment status:', currentStatus);
    
    // Only fetch receipt if status is 'true' or 'pendingPaymentVerification'
    if (currentStatus === 'true' || currentStatus === 'pendingPaymentVerification') {
      this.fetchPaymentReceipt();
    } else {
      // For 'false', don't fetch receipt, just stop loading
      console.log('ℹ️ User is unpaid, not fetching receipt');
      this.isLoading = false;
    }
  }

  private fetchPaymentReceipt(): void {
    try {
      const userData = localStorage.getItem('user_data');
      const scouterId = userData ? JSON.parse(userData).scouterId : null;

      if (!scouterId) {
        console.error('❌ No scouterId found in user data');
        this.isLoading = false;
        return;
      }

      console.log('📋 Fetching payment receipt for scouterId:', scouterId);

      this.scouterEndpoints.fetchScouterReceipt(scouterId).subscribe({
        next: (response) => {
          console.log('✅ Receipt fetched successfully:', response);

          if (response.details && response.details.paymentReceipt) {
            const timeOfUpload = response.details.timeOfUpload || '';
            
            // Get current status from payment service
            const currentStatus = this.paymentService.getPaymentStatusString();
            
            // Update payment service with receipt details but PRESERVE the status
            // The status should come from login response, not from receipt fetch
            this.paymentService.setFullPaymentStatus({
              status: currentStatus, // Keep existing status from login
              receiptUrl: response.details.paymentReceipt,
              transactionId: response.details.id,
              timeOfUpload: timeOfUpload,
            });
          } else {
            // No receipt found, but status might be pending
            // This could happen if status is pending but receipt not yet uploaded
            console.log('⚠️ No receipt details in response');
            
            // If status is 'true' but no receipt, something is wrong
            if (this.paymentService.isPaid()) {
              console.warn('⚠️ Status is true but no receipt found');
              this.toast.openSnackBar('Receipt not found. Please contact support.', 'warning');
            }
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to fetch payment receipt:', error);

          // Handle 404 gracefully
          if (error.status === 404) {
            console.log('ℹ️ No receipt found (404)');
            
            // If status is 'true' but receipt not found, show warning
            if (this.paymentService.isPaid()) {
              this.toast.openSnackBar('Receipt not found. Please contact support.', 'warning');
            }
          } else {
            let errorMessage = 'Failed to fetch payment receipt';
            if (error.status === 401) {
              errorMessage = 'Unauthorized. Please login again.';
            } else if (error.message) {
              errorMessage = error.message;
            }
            this.toast.openSnackBar(errorMessage, 'warning');
          }

          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('❌ Error fetching receipt:', error);
      this.isLoading = false;
    }
  }

  async routeBack(): Promise<void> {
    await this.router.navigate(['/scouter/dashboard']);
  }

  async openUploadScreenshotPopup(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: UploadScreenshotPopupModalComponent,
      cssClass: 'upload-screenshot-modal',
      backdropDismiss: true,
    });

    await modal.present();

    // Refresh receipt after modal is dismissed
    const { data } = await modal.onDidDismiss();
    console.log('Modal dismissed with data:', data);
    
    // Reload payment data
    this.loadPaymentData();
  }

  downloadReceipt() {
    const url = this.paymentStatus?.receiptUrl;
    if (!url) {
      this.toast.openSnackBar('No receipt available to download', 'warning');
      return;
    }

    if (url.startsWith('data:')) {
      try {
        const mime = url.substring(5, url.indexOf(';')) || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        const safeTime = String(this.paymentStatus?.timeOfUpload || 'payment').replace(/[^a-z0-9]/gi, '_');
        const filename = `receipt-${safeTime}.${ext}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      } catch (err) {
        console.error('❌ Failed to download data URL receipt', err);
        this.toast.openSnackBar('Failed to download receipt', 'error');
      }
      return;
    }

    const token = localStorage.getItem('access_token');
    fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch receipt (status ${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const urlParts = (this.paymentStatus?.receiptUrl || url).split('?')[0].split('/');
        const lastPart = urlParts[urlParts.length - 1] || '';
        const guessedExt = (
          lastPart.split('.').pop() ||
          blob.type.split('/').pop() ||
          'png'
        ).replace(/[^a-z0-9]/gi, '');
        const safeTime = String(this.paymentStatus?.timeOfUpload || 'payment').replace(/[^a-z0-9]/gi, '_');
        const filename = `receipt-${safeTime}.${guessedExt}`;

        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
      })
      .catch((err) => {
        console.error('❌ Download receipt failed:', err);
        this.toast.openSnackBar('Failed to download receipt', 'error');
      });
  }

  get isPaid(): boolean {
    return this.paymentStatus.status === 'true';
  }

  get isPending(): boolean {
    return this.paymentStatus.status === 'pendingPaymentVerification';
  }

  get isUnpaid(): boolean {
    return this.paymentStatus.status === 'false';
  }
}