import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { ImageConfig } from '@angular/common';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';

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

      // Show preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadReceipt() {
    if (this.selectedFile) {
      // 1. TODO: send file to backend & get back a URL
      const uploadedUrl = URL.createObjectURL(this.selectedFile); // fake for now

      // 2. Update state
      this.paymentService.setPaymentStatus({
        isPaid: true,
        // receiptUrl: uploadedUrl,
        receiptUrl: this.previewUrl as string, // from file preview or backend
        transactionId: 'INV-2025-0615-013',
      });

      // 3. Toast + Close
      const toast = await this.toastCtrl.create({
        message: 'Receipt uploaded successfully ✅',
        duration: 3000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();

      this.close();
    }
  }
}
