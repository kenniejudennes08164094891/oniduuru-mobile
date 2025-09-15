import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { MenuController, PopoverController } from '@ionic/angular';
import { UserService } from 'src/app/models/user.services'; // 👈 import service
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from 'src/app/utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-scouter-header',
  templateUrl: './scouter-header.component.html',
  styleUrls: ['./scouter-header.component.scss'],
})
export class ScouterHeaderComponent implements OnInit {
  images = imageIcons;
  profileImage!: string;

  constructor(
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

  async openNotificationPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopupModalComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
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
