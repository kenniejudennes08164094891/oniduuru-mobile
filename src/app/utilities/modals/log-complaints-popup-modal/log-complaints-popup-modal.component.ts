import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
})
export class LogComplaintsPopupModalComponent implements OnInit {
  images = imageIcons;
  complaintText = '';

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {}

  dismiss() {
    const savedData = {
      status: 'closed',   // ✅ make it a string
      complaintSaved: false
    };
    this.modalCtrl.dismiss(savedData); // ✅ pass data back
  }

  submitComplaint() {
    if (this.complaintText.trim().length === 0) {
      return;
    }

    console.log('Complaint submitted:', this.complaintText);

    this.modalCtrl.dismiss({
      status: 'submitted',
      complaintSaved: true,
      complaint: this.complaintText
    });
  }
}
