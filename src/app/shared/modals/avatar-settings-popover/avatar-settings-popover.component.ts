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
  ) { }

  navigateTo(path: string) {
    this.popoverCtrl.dismiss();
    this.router.navigate([path]);
  }

  logout() {
    // Clear any stored auth data if needed
    localStorage.removeItem('token');
    sessionStorage.clear();

    // Navigate to welcome page
    this.router.navigate(['/auth/welcome-page']);
  }
}
