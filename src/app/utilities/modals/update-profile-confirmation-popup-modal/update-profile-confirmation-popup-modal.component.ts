import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-update-profile-confirmation-popup-modal',
  templateUrl: './update-profile-confirmation-popup-modal.component.html',
  styleUrls: ['./update-profile-confirmation-popup-modal.component.scss'],
})
export class UpdateProfileConfirmationPopupModalComponent implements OnInit {
  images = imageIcons;

  constructor(private modalCtrl: ModalController) {}

  dismiss(role: 'cancel' | 'confirm') {
    this.modalCtrl.dismiss(null, role);
  }
  ngOnInit() {}
}
