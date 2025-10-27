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

   logout() {
    // Clear any stored auth data if needed
    this.authService.logoutUser()
  }
}
