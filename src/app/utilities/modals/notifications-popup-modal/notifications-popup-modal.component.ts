// notifications-popup-modal.component.ts
import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { NotificationsData, Notification } from 'src/app/models/mocks';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-notifications-popup-modal',
  templateUrl: './notifications-popup-modal.component.html',
  styleUrls: ['./notifications-popup-modal.component.scss'],
  standalone: false,
})
export class NotificationsPopupModalComponent extends BaseModal {
  images = imageIcons;
  notifications: Notification[] = NotificationsData;

  constructor(modalCtrl: ModalController, platform: Platform) {
    super(modalCtrl, platform); // ✅ back button + dismiss handled
  }

  // Optional override to customize dismiss
  override dismiss() {
    super.dismiss();
  }
}
