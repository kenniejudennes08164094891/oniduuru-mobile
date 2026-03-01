import { Directive, OnInit, OnDestroy } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { OverlayCleanupService } from '../services/overlay-cleanup.service';

@Directive()
export abstract class BaseModal implements OnInit, OnDestroy {
  private backButtonListener: any;

  constructor(
    protected modalCtrl: ModalController,
    protected platform: Platform,
    protected overlayCleanup: OverlayCleanupService,
  ) {}

  ngOnInit() {
    this.backButtonListener = this.platform.backButton.subscribeWithPriority(
      10,
      () => {
        this.dismiss();
      },
    );
  }

  ngOnDestroy() {
    if (this.backButtonListener) {
      this.backButtonListener.unsubscribe();
    }
    // ensure any backdrop left by this modal is cleared
    this.overlayCleanup.cleanBackdrops();
  }

  async dismiss(data?: any, role?: string) {
    // Don't call window.history.go(-1) as it causes unwanted navigation back
    await this.modalCtrl.dismiss(data, role);
    // after dismissing, also run a quick cleanup in case the framework left a
    // backdrop behind (seen on older Ionic versions in Android webview)
    this.overlayCleanup.cleanBackdrops();
  }
}
