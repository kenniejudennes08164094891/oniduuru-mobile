import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract'; // 👈 adjust path

@Component({
  selector: 'app-update-profile-confirmation-popup-modal',
  templateUrl: './update-profile-confirmation-popup-modal.component.html',
  styleUrls: ['./update-profile-confirmation-popup-modal.component.scss'],
  standalone: false,
})
export class UpdateProfileConfirmationPopupModalComponent extends BaseModal {
  images = imageIcons;

  constructor(modalCtrl: ModalController, platform: Platform) {
    super(modalCtrl, platform); // ✅ gets dismiss + back button
  }

  onCancel() {
    this.dismiss(null, 'cancel');
  }

  onConfirm() {
    this.dismiss(null, 'confirm');
  }
}
