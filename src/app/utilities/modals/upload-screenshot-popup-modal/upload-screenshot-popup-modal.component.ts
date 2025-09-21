import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ImageConfig } from '@angular/common';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { AwaitingPaymentVerificationModalComponent } from '../awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';
@Component({
  selector: 'app-upload-screenshot-popup-modal',
  templateUrl: './upload-screenshot-popup-modal.component.html',
  styleUrls: ['./upload-screenshot-popup-modal.component.scss'],
})
export class UploadScreenshotPopupModalComponent {
  images = imageIcons;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private paymentService: PaymentService
  ) {}

  close() {
    this.modalCtrl.dismiss();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Convert to base64
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string; // base64 string
      };
      reader.readAsDataURL(file);
    }
  }

  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  async uploadReceipt() {
    if (this.selectedFile) {
      // Convert to base64 already done in onFileSelected
      this.paymentService.setPaymentStatus({
        isPaid: false,
        receiptUrl: this.previewUrl as string,
        transactionId: 'INV-2025-0615-013',
      });

      // Success toast
      const toast = await this.toastCtrl.create({
        message: 'Receipt uploaded successfully ✅',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();

      // 1. Close the upload screenshot modal
      await this.modalCtrl.dismiss();

      // 2. Immediately open awaiting verification modal
      const modal = await this.modalCtrl.create({
        component: AwaitingPaymentVerificationModalComponent,
        cssClass: 'awaiting-modal', // optional custom class
      });
      await modal.present();
    }
  }
}
