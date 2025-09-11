import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { PopoverController } from '@ionic/angular';
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from 'src/app/utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
@Component({
  selector: 'app-scouter-header',
  templateUrl: './scouter-header.component.html',
  styleUrls: ['./scouter-header.component.scss'],
})
export class ScouterHeaderComponent implements OnInit {
  images = imageIcons;
  constructor(private popoverCtrl: PopoverController) {}

  ngOnInit() {}

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
