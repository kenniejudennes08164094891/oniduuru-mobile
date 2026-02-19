import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { AwaitingPaymentVerificationModalComponent } from '../awaiting-payment-verification-modal/awaiting-payment-verification-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ToastsService } from 'src/app/services/toasts.service';

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

  private navSub?: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
    private paymentService: PaymentService,
    // private toastCtrl: ToastController
    private toast: ToastsService
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

  override async dismiss() {
   await super.dismiss();
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



               this.toast.openSnackBar('Receipt uploaded successfully ✅', 'success');



      // close current modal
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
