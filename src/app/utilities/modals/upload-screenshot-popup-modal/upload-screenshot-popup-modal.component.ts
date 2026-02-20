import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { AwaitingPaymentVerificationModalComponent } from '../awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';

@Component({
  selector: 'app-upload-screenshot-popup-modal',
  templateUrl: './upload-screenshot-popup-modal.component.html',
  styleUrls: ['./upload-screenshot-popup-modal.component.scss'],
  standalone: false,
})
export class UploadScreenshotPopupModalComponent
  extends BaseModal
  implements OnInit, OnDestroy
{
  images = imageIcons;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;
  isUploading: boolean = false;

  private navSub?: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private paymentService: PaymentService,
    private toast: ToastsService,
    private scouterEndpoints: ScouterEndpointsService,
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    // auto close modal on any route navigation
    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  override ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  override dismiss() {
    super.dismiss();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async uploadReceipt() {
    if (!this.selectedFile || !this.previewUrl) {
      this.toast.openSnackBar('Please select a receipt image', 'error');
      return;
    }

    this.isUploading = true;

    try {
      // Get scouterId from localStorage
      const userData = localStorage.getItem('user_data');
      const scouterId = userData ? JSON.parse(userData).scouterId : null;
      const email = userData ? JSON.parse(userData).email : null;

      if (!scouterId || !email) {
        this.toast.openSnackBar('Unable to get scouter information', 'error');
        this.isUploading = false;
        return;
      }

      console.log('📝 Uploading receipt with:', {
        scouterId,
        email,
        hasFile: !!this.selectedFile,
      });

      // Call the backend endpoint to verify payment
      this.scouterEndpoints
        .verifyPaymentStatus({
          paymentReceipt: this.previewUrl as string,
          email,
          scouterId,
        })
        .subscribe({
          next: (response) => {
            console.log('✅ Payment verification successful:', response);
            console.log(
              '📋 Full verification response:',
              JSON.stringify(response, null, 2),
            );

            // Extract timeOfUpload if available in response
            const timeOfUpload =
              response.details?.timeOfUpload ||
              response.timeOfUpload ||
              new Date().toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              });

            console.log('📅 Extracted timeOfUpload:', timeOfUpload);

            // Update payment service with verified status
            this.paymentService.setPaymentStatus({
              isPaid: true,
              receiptUrl: this.previewUrl as string,
              transactionId:
                response.transactionId ||
                response.details?.id ||
                'INV-2025-0615-013',
              timeOfUpload: timeOfUpload,
            });

            this.toast.openSnackBar(
              'Receipt uploaded and verified successfully ✅',
              'success',
            );

            // Close current modal after brief delay
            setTimeout(async () => {
              await this.dismiss();

              // Open awaiting verification modal
              const modal = await this.modalCtrl.create({
                component: AwaitingPaymentVerificationModalComponent,
                cssClass: 'awaiting-modal',
              });
              await modal.present();
            }, 500);
          },
          error: (error) => {
            console.error('❌ Payment verification failed:', error);

            let errorMessage = 'Failed to verify payment receipt';
            if (error.status === 401) {
              errorMessage = 'Unauthorized. Please login again.';
            } else if (error.status === 400) {
              errorMessage = 'Invalid payment receipt. Please try again.';
            } else if (error.message) {
              errorMessage = error.message;
            }

            this.toast.openSnackBar(errorMessage, 'error');
            this.isUploading = false;
          },
        });
    } catch (error) {
      console.error('❌ Error uploading receipt:', error);
      this.toast.openSnackBar(
        'An error occurred while uploading receipt',
        'error',
      );
      this.isUploading = false;
    }
  }
}
