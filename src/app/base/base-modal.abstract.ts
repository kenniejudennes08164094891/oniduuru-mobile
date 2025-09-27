import { Directive, OnInit, OnDestroy } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';

@Directive()
export abstract class BaseModal implements OnInit, OnDestroy {
  private backButtonListener: any;

  constructor(
    protected modalCtrl: ModalController,
    protected platform: Platform
  ) {}

  ngOnInit() {
    this.backButtonListener = this.platform.backButton.subscribeWithPriority(
      10,
      () => {
        this.dismiss();
      }
    );
  }

  ngOnDestroy() {
    if (this.backButtonListener) {
      this.backButtonListener.unsubscribe();
    }
  }

  dismiss(data?: any, role?: string) {
    this.modalCtrl.dismiss(data, role);
  }
}
