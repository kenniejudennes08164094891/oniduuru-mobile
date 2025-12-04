import { Component } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-verify-success',
  templateUrl: './verify-success.component.html',
  styleUrls: ['./verify-success.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VerifySuccessComponent {

  constructor(private navCtrl: NavController,  private toastCtrl: ToastController) {}

  goToLogin() {
    this.navCtrl.navigateRoot('/login');
  }
  async presentSuccessToast() {
  const toast = await this.toastCtrl.create({
    message: 'Your profile has been created successfully',
    duration: 3000,
    position: 'top',
    color: 'success',
    cssClass: 'success-toast'
  });
  await toast.present();
}

  cancel() {
    this.navCtrl.back();
  }
}
