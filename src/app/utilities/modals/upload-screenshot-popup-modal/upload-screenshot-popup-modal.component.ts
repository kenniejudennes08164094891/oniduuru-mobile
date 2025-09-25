import { Component } from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { AwaitingPaymentVerificationModalComponent } from '../awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract'; // 👈 adjust path

@Component({
  selector: 'app-upload-screenshot-popup-modal',
  templateUrl: './upload-screenshot-popup-modal.component.html',
  styleUrls: ['./upload-screenshot-popup-modal.component.scss'],
  standalone: false,
})
export class UploadScreenshotPopupModalComponent extends BaseModal {
  images = imageIcons;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastCtrl: ToastController
  ) {
    super(modalCtrl, platform); // ✅ gets dismiss + back button
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

      // 👇 using BaseModal's dismiss
      await this.dismiss();

      // open awaiting verification modal
      const modal = await this.modalCtrl.create({
        component: AwaitingPaymentVerificationModalComponent,
        cssClass: 'awaiting-modal',
      });
      await modal.present();
    }
  }
}
