import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { PopoverController, MenuController } from '@ionic/angular';
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from 'src/app/utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
@Component({
  selector: 'app-wallet-header',
  templateUrl: './wallet-header.component.html',
  styleUrls: ['./wallet-header.component.scss'],
})
export class WalletHeaderComponent implements OnInit {
  images = imageIcons;
  constructor(
    private popoverCtrl: PopoverController,
    private menuCtrl: MenuController
  ) {}

  ngOnInit() {}

  openMenu() {
    this.menuCtrl.getMenus().then((menus) => {
      console.log('Available menus:', menus);
    });
    this.menuCtrl.enable(true, 'scouter-menu');
    this.menuCtrl.open('scouter-menu');
  }

  async openProfilePopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopupSettingsModalComponent,
      event: ev, // attaches popover to the button position
      side: 'bottom', // opens below the button
      translucent: true,
    });
    await popover.present();
  }
  async openNotificationPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopupModalComponent,
      event: ev, // attaches popover to the button position
      side: 'bottom', // opens below the button
      translucent: true,
    });
    await popover.present();
  }
}
