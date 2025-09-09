import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { UploadScreenshotPopupModalComponent } from 'src/app/shared/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
@Component({
  selector: 'app-account-activation-page',
  templateUrl: './account-activation-page.component.html',
  styleUrls: ['./account-activation-page.component.scss'],
})
export class AccountActivationPageComponent implements OnInit {
  images = imageIcons;
  headerHidden: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  async openUploadScreenshotPopup() {
    const modal = await this.modalCtrl.create({
      component: UploadScreenshotPopupModalComponent,
      cssClass: 'upload-screenshot-modal',
      backdropDismiss: true,
    });
    return await modal.present();
  }
}
