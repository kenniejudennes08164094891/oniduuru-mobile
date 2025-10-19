import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: 'app-avatar-settings-popover',
  templateUrl: './avatar-settings-popover.component.html',
  styleUrls: ['./avatar-settings-popover.component.scss'],
})
export class AvatarSettingsPopoverComponent {
  constructor(
    private router: Router,
    private popoverCtrl: PopoverController,
    private authService: AuthService
  ) { }

 async navigateTo(path: string):Promise<void> {
   await this.popoverCtrl.dismiss();
   await this.router.navigate([path]);
  }

  async logout():Promise<void> {
    // Clear any stored auth data if needed
    await this.authService.logoutUser();
  // 2️⃣ Dismiss the popover
  await this.popoverCtrl.dismiss();

  // 3️⃣ Redirect to login page
  await this.router.navigateByUrl('/auth/login');
}

}
