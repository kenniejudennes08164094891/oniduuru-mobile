import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { UploadScreenshotPopupModalComponent } from 'src/app/utilities/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { PaymentService } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-account-activation-page',
  templateUrl: './account-activation-page.component.html',
  styleUrls: ['./account-activation-page.component.scss'],
  standalone: false,
})
export class AccountActivationPageComponent implements OnInit {
  images = imageIcons;
  headerHidden: boolean = false;
  currentMonth: string = new Date().toLocaleString('en-US', { month: 'short' });
  currentYear: number = new Date().getFullYear();
  currentDate: number = new Date().getDate();
  currentTime: string = new Date().toLocaleTimeString();
  paymentStatus: any;
  isLoading: boolean = true;
  userName: string = 'Scouter';
  uploadTimeFormatted: string = '';

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private router: Router,
    private scouterEndpoints: ScouterEndpointsService,
    private toast: ToastsService,
  ) {}

  ngOnInit() {
    this.extractUserName();
    this.fetchPaymentReceipt();
  }

  /**
   * Extract user's name from localStorage
   */
  private extractUserName(): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        this.userName =
          parsed.fullName || parsed.name || parsed.firstName || 'Scouter';
        console.log('👤 User name extracted:', this.userName);
      }
    } catch (error) {
      console.warn('⚠️ Could not extract user name:', error);
      this.userName = 'Scouter';
    }
  }

  /**
   * Fetch scouter's payment receipt from backend
   */
  private fetchPaymentReceipt(): void {
    try {
      // Get scouterId from localStorage
      const userData = localStorage.getItem('user_data');
      const scouterId = userData ? JSON.parse(userData).scouterId : null;

      if (!scouterId) {
        console.error('❌ No scouterId found in user data');
        this.isLoading = false;
        this.paymentStatus = { isPaid: false };
        return;
      }

      console.log('📋 Fetching payment receipt for scouterId:', scouterId);

      this.scouterEndpoints.fetchScouterReceipt(scouterId).subscribe({
        next: (response) => {
          console.log('✅ Receipt fetched successfully:', response);
          console.log(
            '📋 Full response details:',
            JSON.stringify(response, null, 2),
          );

          // Update payment service and component
          if (response.details && response.details.paymentReceipt) {
            // ✅ Extract timeOfUpload from API response
            const timeOfUpload = response.details.timeOfUpload || '';
            console.log('📅 Receipt upload time from API:', timeOfUpload);
            console.log(
              '🔍 All details keys:',
              Object.keys(response.details || {}),
            );

            this.paymentStatus = {
              isPaid: true,
              receiptUrl: response.details.paymentReceipt,
              transactionId: response.details.id,
              timeOfUpload: timeOfUpload,
            };

            // Store formatted time for display
            this.uploadTimeFormatted = timeOfUpload;
            console.log(
              '✅ Final uploadTimeFormatted:',
              this.uploadTimeFormatted,
            );

            // Update payment service so other components can access it
            this.paymentService.setPaymentStatus(this.paymentStatus);
          } else {
            this.paymentStatus = { isPaid: false };
          }

          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Failed to fetch payment receipt:', error);

          // Treat 404 as "not paid yet" rather than an error
          if (error.status === 404) {
            console.log('⚠️ Payment receipt not found - user has not paid yet');
            this.paymentStatus = { isPaid: false };
          } else {
            // For other errors, show toast and set unpaid state
            let errorMessage = 'Failed to fetch payment receipt';
            if (error.status === 401) {
              errorMessage = 'Unauthorized. Please login again.';
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.toast.openSnackBar(errorMessage, 'warning');
            this.paymentStatus = { isPaid: false };
          }

          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('❌ Error fetching receipt:', error);
      this.isLoading = false;
      this.paymentStatus = { isPaid: false };
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
    await modal.onDidDismiss();
    this.isLoading = true;
    this.fetchPaymentReceipt();
  }

  downloadReceipt() {
    const url: string | undefined = this.paymentStatus?.receiptUrl;
    if (!url) {
      this.toast.openSnackBar('No receipt available to download', 'warning');
      return;
    }

    // If it's a data URL, download directly
    if (url.startsWith('data:')) {
      try {
        const mime = url.substring(5, url.indexOf(';')) || 'image/png';
        const ext = mime.split('/')[1] || 'png';
        const safeTime = String(
          this.paymentStatus?.timeOfUpload || 'payment',
        ).replace(/[^a-z0-9]/gi, '_');
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

    // Otherwise fetch the file as a blob (handles CORS + auth) and download
    const token = localStorage.getItem('access_token');

    fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch receipt (status ${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const urlParts = (this.paymentStatus?.receiptUrl || url)
          .split('?')[0]
          .split('/');
        const lastPart = urlParts[urlParts.length - 1] || '';
        const guessedExt = (
          lastPart.split('.').pop() ||
          blob.type.split('/').pop() ||
          'png'
        ).replace(/[^a-z0-9]/gi, '');
        const safeTime = String(
          this.paymentStatus?.timeOfUpload || 'payment',
        ).replace(/[^a-z0-9]/gi, '_');
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
}
