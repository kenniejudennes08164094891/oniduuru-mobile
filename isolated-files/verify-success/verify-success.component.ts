import { Component } from '@angular/core';
import { NavController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ToastController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-verify-success',
  templateUrl: './verify-success.component.html',
  styleUrls: ['./verify-success.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class VerifySuccessComponent {

  constructor(private navCtrl: NavController,
    // private toastCtrl: ToastController,
    private toast: ToastsService

  ) { }

  goToLogin() {
    this.navCtrl.navigateRoot('/login');
  }
  async presentSuccessToast() {
   
    this.toast.openSnackBar('Your profile has been created successfully', 'success');

  }

  cancel() {
    this.navCtrl.back();
  }
}
