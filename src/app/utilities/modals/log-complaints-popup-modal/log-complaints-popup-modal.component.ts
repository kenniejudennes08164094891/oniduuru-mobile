import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
  standalone: false,
})
export class LogComplaintsPopupModalComponent implements OnInit {
  images = imageIcons;
  complaintText = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  submitComplaint() {
    if (this.complaintText.trim().length === 0) {
      return;
    }
    // Here you could call an API to submit the complaint
    console.log('Complaint submitted:', this.complaintText);

    this.modalCtrl.dismiss({ complaint: this.complaintText });
  }
}
