import { Component, OnInit } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';

@Component({
  selector: 'app-awaiting-payment-verification-modal',
  templateUrl: './awaiting-payment-verification-modal.component.html',
  styleUrls: ['./awaiting-payment-verification-modal.component.scss'],
  standalone: false,
})
export class AwaitingPaymentVerificationModalComponent extends BaseModal {
  images = imageIcons;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    protected override overlayCleanup: OverlayCleanupService,
  ) {
    super(modalCtrl, platform, overlayCleanup); // ✅ gives you back-button + dismiss
  }
  // Optional: override dismiss to add role support
  override async dismiss(role: 'cancel' | 'confirm' = 'cancel') {
    await super.dismiss(null, role);
  }
}
