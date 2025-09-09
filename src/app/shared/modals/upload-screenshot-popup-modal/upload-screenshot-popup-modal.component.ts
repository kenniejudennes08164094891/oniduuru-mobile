import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-upload-screenshot-popup-modal',
  templateUrl: './upload-screenshot-popup-modal.component.html',
  styleUrls: ['./upload-screenshot-popup-modal.component.scss'],
})
export class UploadScreenshotPopupModalComponent {
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

  constructor(
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
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
      console.log('Uploading:', this.selectedFile);
      // TODO: send to backend

      const toast = await this.toastCtrl.create({
        message: 'Receipt uploaded successfully ✅',
        duration: 3000,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();

      this.close();
    } else {
      const toast = await this.toastCtrl.create({
        message: 'Please select a file first ⚠️',
        duration: 3000,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
    }
  }
}
