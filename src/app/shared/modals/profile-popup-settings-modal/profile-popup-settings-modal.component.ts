import { Component } from '@angular/core';
import { PopoverController, ModalController } from '@ionic/angular';
import { LogComplaintsPopupModalComponent } from '../log-complaints-popup-modal/log-complaints-popup-modal.component';
// import { ProfilePageComponent } from 'src/app/scouter/profile-page/profile-page.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-popup-settings-modal',
  templateUrl: './profile-popup-settings-modal.component.html',
  styleUrls: ['./profile-popup-settings-modal.component.scss'],
})
export class ProfilePopupSettingsModalComponent {
  constructor(
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private router: Router
  ) {}

  dismiss(data?: any) {
    this.popoverCtrl.dismiss(data);
  }

  async openComplaintModal() {
    // close popover first
    await this.popoverCtrl.dismiss();

    const modal = await this.modalCtrl.create({
      component: LogComplaintsPopupModalComponent,
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.complaint) {
      console.log('User complaint:', data.complaint);
      // You can forward this to an API
    }
  }

  async openProfilePage() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['scouter/profile']); // ✅ this will load ProfilePageComponent

    // const modal = await this.modalCtrl.create({
    //   // component: ProfilePageComponent,
    // });
    // await modal.present();
  }

  async openActivationPage() {
    await this.popoverCtrl.dismiss();

    // TODO: replace with your activation component
    // const modal = await this.modalCtrl.create({
    //   // component: ProfilePageComponent, // placeholder for now
    // });
    // await modal.present();
  }

  logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
}
