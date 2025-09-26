import { Component, OnInit } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { NotificationsData, Notification } from 'src/app/models/mocks';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { Router, NavigationStart } from '@angular/router';

@Component({
  selector: 'app-notifications-popup-modal',
  templateUrl: './notifications-popup-modal.component.html',
  styleUrls: ['./notifications-popup-modal.component.scss'],
  standalone: false,
})
export class NotificationsPopupModalComponent extends BaseModal {
  images = imageIcons;
  notifications: Notification[] = NotificationsData;

  constructor(
    modalCtrl: ModalController,
    protected override platform: Platform, // ✅ override
    private router: Router
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit(): void {
    // ✅ override
    super.ngOnInit?.(); // call base if needed

    // Close modal on browser navigation (back/forward)
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });

    // Hardware back button already handled by BaseModal
  }
  override dismiss() {
    super.dismiss();
  }
}
