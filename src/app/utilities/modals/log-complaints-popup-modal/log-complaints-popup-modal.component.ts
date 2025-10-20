import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
  standalone: false,
})
export class LogComplaintsPopupModalComponent extends BaseModal {
  images = imageIcons;
  complaintText = '';

  constructor(modalCtrl: ModalController, platform: Platform) {
    super(modalCtrl, platform); // ✅ inherit base logic
  }
  override dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
  submitComplaint() {
    if (this.complaintText.trim().length === 0) {
      return;
    }
    console.log('Complaint submitted:', this.complaintText);

    this.modalCtrl.dismiss({ complaint: this.complaintText }, 'confirm');
  }
}
