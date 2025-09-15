import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { PopoverController } from '@ionic/angular';
import { ProfilePopupSettingsModalComponent } from 'src/app/shared/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from 'src/app/shared/modals/notifications-popup-modal/notifications-popup-modal.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-talent-header',
  templateUrl: './talent-header.component.html',
  styleUrls: ['./talent-header.component.scss'],
})
export class TalentHeaderComponent implements OnInit {
  @Input() role: 'talent' | 'scouter' = 'talent';
  @Input() headerHidden: boolean = false;
  images = imageIcons;
  notificationCount = 21;



  constructor(private popoverCtrl: PopoverController,private router: Router) { }

  ngOnInit() { }

  async openProfilePopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopupSettingsModalComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
  }
  onAvatarClick(ev: any) {
    if (this.role === 'talent') {
      this.router.navigate(['/talent/profile-page']); // 👈 goes to your talent profile page
    } else {
      this.router.navigate(['/scouter/profile-page']); // fallback for scouter
    }
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
}
