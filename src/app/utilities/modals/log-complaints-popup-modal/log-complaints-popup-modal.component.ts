import { Component } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
  standalone: false,
})
export class LogComplaintsPopupModalComponent extends BaseModal {
  images = imageIcons;
  complaintText = '';

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private location: Location
  ) {
    super(modalCtrl, platform);
  }

  async closeModal(): Promise<void> {
    // Add any custom logic here if needed
    console.log('Closing complaints modal');

    // Then dismiss properly
    await this.dismiss();
  }

  async submitComplaint(): Promise<void> {
    if (this.complaintText.trim().length === 0) {
      return;
    }
    console.log('Complaint submitted:', this.complaintText);

    await this.modalCtrl.dismiss({ complaint: this.complaintText }, 'confirm');
  }
}
