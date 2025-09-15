import { Component } from '@angular/core';
import {
  PopoverController,
  ModalController,
  NavController,
} from '@ionic/angular';
import { LogComplaintsPopupModalComponent } from '../log-complaints-popup-modal/log-complaints-popup-modal.component';
// import { ProfilePageComponent } from 'src/app/scouter/profile-page/profile-page.component';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-profile-popup-settings-modal',
  templateUrl: './profile-popup-settings-modal.component.html',
  styleUrls: ['./profile-popup-settings-modal.component.scss'],
})
export class ProfilePopupSettingsModalComponent {
  constructor(
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private router: Router,
    private navCtrl: NavController,
    private location: Location
  ) {}

  get isDashboard(): boolean {
    return this.router.url.includes('/dashboard');
  }


 
  dismiss(data?: any) {
    this.popoverCtrl.dismiss(data);
  }


/** 🔙 Go back to dashboard */
async goBack() {
  await this.popoverCtrl.dismiss();
  this.router.navigate(['/scouter/dashboard']); // ✅ always route to dashboard
}

  async openComplaintModal() {
    await this.popoverCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      component: LogComplaintsPopupModalComponent,
    });
    await modal.present();
  }

  async openProfilePage() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['scouter/profile']);
  }

  async openActivationPage() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['scouter/account-activation']);
  }

  logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
}
