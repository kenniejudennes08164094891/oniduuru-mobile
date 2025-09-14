import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-awaiting-payment-verification-modal',
  templateUrl: './awaiting-payment-verification-modal.component.html',
  styleUrls: ['./awaiting-payment-verification-modal.component.scss'],
})
export class AwaitingPaymentVerificationModalComponent implements OnInit {
  images = imageIcons;

  constructor(private modalCtrl: ModalController) {}

  dismiss(role: 'cancel' | 'confirm') {
    this.modalCtrl.dismiss(null, role);
  }
  ngOnInit() {}
}
