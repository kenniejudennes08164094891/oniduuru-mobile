import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-avatar-settings-popover',
  templateUrl: './avatar-settings-popover.component.html',
  styleUrls: ['./avatar-settings-popover.component.scss'],
})
export class AvatarSettingsPopoverComponent {
  constructor(
    private router: Router,
    private popoverCtrl: PopoverController
  ) {}

  navigateTo(path: string) {
    this.popoverCtrl.dismiss();
    this.router.navigate([path]);
  }

  logout() {
    this.popoverCtrl.dismiss();
    // 🔑 Clear token/session
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
