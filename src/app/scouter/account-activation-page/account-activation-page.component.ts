import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { UploadScreenshotPopupModalComponent } from 'src/app/utilities/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { PaymentService } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
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
  // 👉 "Sep"
  currentYear: number = new Date().getFullYear();
  currentDate: number = new Date().getDay(); // 👈 add this
  currentTime: string = new Date().toLocaleTimeString(); // 👉 "10:32:05 AM"
  paymentStatus: any;

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit() {
    this.paymentService.paymentStatus$.subscribe((status) => {
      this.paymentStatus = status;
    });
  }

 async routeBack():Promise<void> {
   await this.router.navigate(['/scouter/dashboard']);
  }

  async openUploadScreenshotPopup() {
    const modal = await this.modalCtrl.create({
      component: UploadScreenshotPopupModalComponent,
      cssClass: 'upload-screenshot-modal',
      backdropDismiss: true,
    });
    return await modal.present();
  }

  downloadReceipt() {
    if (this.paymentStatus?.receiptUrl) {
      const link = document.createElement('a');
      link.href = this.paymentStatus.receiptUrl;
      link.download = 'receipt.png'; // 👈 customize filename
      link.click();
    }
  }
}
