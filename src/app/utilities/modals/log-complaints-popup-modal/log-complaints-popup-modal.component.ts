import { Component, OnDestroy } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Router, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-log-complaints-popup-modal',
  templateUrl: './log-complaints-popup-modal.component.html',
  styleUrls: ['./log-complaints-popup-modal.component.scss'],
  standalone: false,
})
export class LogComplaintsPopupModalComponent
  extends BaseModal
  implements OnDestroy
{
  images = imageIcons;
  complaintText = '';
  private routerSub!: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router
  ) {
    super(modalCtrl, platform);

    // ✅ dismiss modal whenever navigation starts
    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  submitComplaint() {
    if (this.complaintText.trim().length === 0) {
      return;
    }
    console.log('Complaint submitted:', this.complaintText);

    this.modalCtrl.dismiss({ complaint: this.complaintText }, 'confirm');
  }

override  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }
}
