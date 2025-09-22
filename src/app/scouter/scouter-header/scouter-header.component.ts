import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {
  ModalController,
  MenuController,
  PopoverController,
} from '@ionic/angular';
import { UserService } from 'src/app/models/user.services'; // 👈 import service
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from 'src/app/utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
import { Router } from '@angular/router';
import { Notification, NotificationsData } from 'src/app/models/mocks';

@Component({
  selector: 'app-scouter-header',
  templateUrl: './scouter-header.component.html',
  styleUrls: ['./scouter-header.component.scss'],
  standalone: false,
})

export class ScouterHeaderComponent implements OnInit {
  images = imageIcons;
  profileImage!: string;

  notifications: Notification[] = [];

  userStatus: 'online' | 'away' | 'offline' = 'offline';

  // Example: function to set status
  setStatus(status: 'online' | 'away' | 'offline') {
    this.userStatus = status;
  }

  constructor(
    // THIS
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    public userService: UserService,
    private router: Router,
    private menuCtrl: MenuController
  ) {
    this.profileImage = this.userService.getProfileImage(); // default fallback handled in service
  }

  get isWallet(): boolean {
    return this.router.url.includes('wallet-page');
  }

  ngOnInit() {
    this.userService.profileImage$.subscribe((img: string) => {
      this.profileImage = img;
    });
    this.notifications = NotificationsData;

    // Subscribe to status updates
    this.userService.status$.subscribe((status) => {
      this.userStatus = status;
    });

    // Example: set to online when component mounts
    this.userService.setStatus('online');
  }

  async openProfilePopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopupSettingsModalComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
  }

  // THIS
  async openNotificationModal() {
    const modal = await this.modalCtrl.create({
      component: NotificationsPopupModalComponent,
      cssClass: 'notification-fullscreen-modal',
      breakpoints: [0, 1], // allow 0 (closed) and 1 (full screen)
      initialBreakpoint: 1,
      backdropDismiss: true, // close when swiping down or tapping backdrop
    });
    await modal.present();
  }

  openMenu() {
    this.menuCtrl.getMenus().then((menus) => {
      console.log('Available menus:', menus);
    });
    this.menuCtrl.enable(true, 'scouter-menu');
    this.menuCtrl.open('scouter-menu');
  }

  // Add this method to close the menu
  async closeMenu() {
    await this.menuCtrl.close('scouter-menu');
  }
}
