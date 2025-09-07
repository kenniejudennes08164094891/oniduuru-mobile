import { Component } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-profile-popup-settings-modal',
  templateUrl: './profile-popup-settings-modal.component.html',
  styleUrls: ['./profile-popup-settings-modal.component.scss'],
})
export class ProfilePopupSettingsModalComponent {
  constructor(private popoverCtrl: PopoverController) {}

  dismiss(data?: any) {
    this.popoverCtrl.dismiss(data);
  }

  logoutUser() {
    // Clear local storage / tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');

    // // You can also clear sessionStorage if you’re storing session data
    // sessionStorage.clear();

    // // Close the popover and pass an action back to parent if needed
    // this.popoverCtrl.dismiss({ action: 'logout' });

    // Optionally, redirect to login page
    window.location.href = '/auth/login';
  }
}
