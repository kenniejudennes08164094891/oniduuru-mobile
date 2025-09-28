import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { PaymentService } from 'src/app/services/payment.service';

@Component({
  selector: 'app-withdraw-funds-popup-modal',
  templateUrl: './withdraw-funds-popup-modal.component.html',
  styleUrls: ['./withdraw-funds-popup-modal.component.scss'],
  standalone: false,
})
export class WithdrawFundsPopupModalComponent
  extends BaseModal
  implements OnInit
{
  @Input() isModalOpen: boolean = false;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastCtrl: ToastController,
    private ngZone: NgZone
  ) {
    super(modalCtrl, platform);
  }

  // ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  //   images = imageIcons;
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;

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
        this.ngZone.run(() => {
          this.previewUrl = reader.result as string;
        });
      };
      reader.readAsDataURL(file);
    }
  }
  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }
  // THIS SHOULD BE PART OFTHE FORM SUBMIT
  // async uploadReceipt() {
  //   if (this.selectedFile) {
  //     this.paymentService.setPaymentStatus({
  //       isPaid: true,
  //       receiptUrl: this.previewUrl as string,
  //       transactionId: 'INV-2025-0615-013',
  //     });

  //     const toast = await this.toastCtrl.create({
  //       message: 'Receipt uploaded successfully ✅',
  //       duration: 2000,
  //       position: 'bottom',
  //       color: 'success',
  //     });
  //     await toast.present();

  //     // 👇 using BaseModal's dismiss
  //     // await this.dismiss();

  //     // open awaiting verification modal
  //     // const modal = await this.modalCtrl.create({
  //     //   component: AwaitingPaymentVerificationModalComponent,
  //     //   cssClass: 'awaiting-modal',
  //     // });
  //     // await modal.present();
  //   }
  // }
}
