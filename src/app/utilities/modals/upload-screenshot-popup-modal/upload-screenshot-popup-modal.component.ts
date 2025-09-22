import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { AwaitingPaymentVerificationModalComponent } from '../awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';

@Component({
  selector: 'app-upload-screenshot-popup-modal',
  templateUrl: './upload-screenshot-popup-modal.component.html',
  styleUrls: ['./upload-screenshot-popup-modal.component.scss'],
  standalone: false,
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
    if (this.selectedFile) {
      this.paymentService.setPaymentStatus({
        isPaid: true,
        receiptUrl: this.previewUrl as string,
        transactionId: 'INV-2025-0615-013',
      });

      const toast = await this.toastCtrl.create({
        message: 'Receipt uploaded successfully ✅',
        duration: 2000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();

      await this.modalCtrl.dismiss();

      const modal = await this.modalCtrl.create({
        component: AwaitingPaymentVerificationModalComponent,
        cssClass: 'awaiting-modal',
      });
      await modal.present();
    }
  }
}
