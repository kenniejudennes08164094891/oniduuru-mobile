import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-make-payment-popup-modal',
  standalone: true, // ✅ Angular 15+ standalone
  imports: [CommonModule, IonicModule], // ✅ pull in Ionic components
  templateUrl: './make-payment-popup-modal.component.html',
  styleUrls: ['./make-payment-popup-modal.component.scss'],
})
export class MakePaymentPopupModalComponent implements OnInit {
  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  close() {
    this.modalCtrl.dismiss();
  }

  async openMakePaymentPopup() {
    const modal = await this.modalCtrl.create({
      component: MakePaymentPopupModalComponent,
      cssClass: 'make-payment-modal',
      backdropDismiss: true,
    });
    return await modal.present();
  }
}
