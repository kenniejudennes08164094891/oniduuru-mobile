import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  PopoverController,
  ModalController,
  NavController,
  Platform,
} from '@ionic/angular';
import { LogComplaintsPopupModalComponent } from '../log-complaints-popup-modal/log-complaints-popup-modal.component';
// import { ProfilePageComponent } from 'src/app/scouter/profile-page/profile-page.component';
import { Router, NavigationStart } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile-popup-settings-modal',
  templateUrl: './profile-popup-settings-modal.component.html',
  styleUrls: ['./profile-popup-settings-modal.component.scss'],
  standalone: false,
})
export class ProfilePopupSettingsModalComponent implements OnInit, OnDestroy {
  private backButtonSub?: Subscription;
  private routerEventsSub?: Subscription;

  constructor(
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private router: Router,
    private navCtrl: NavController,
    private location: Location,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    // Hardware back button
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(
      9999,
      async () => {
        await this.dismiss();
      }
    );

    // Browser back/forward
    this.routerEventsSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  ngOnDestroy(): void {
    this.backButtonSub?.unsubscribe();
    this.routerEventsSub?.unsubscribe();
  }

  get isDashboard(): boolean {
    return this.router.url.includes('/dashboard');
  }

  async dismiss(data?: any) {
    await this.popoverCtrl.dismiss(data);
  }

  /** 🔙 Go back to dashboard */
  async goBack() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['/scouter/dashboard']); // ✅ always route to dashboard
  }

  async openComplaintModal() {
    await this.popoverCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      component: LogComplaintsPopupModalComponent,
    });
    await modal.present();
  }

  async openProfilePage() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['scouter/profile']);
  }

  async openActivationPage() {
    await this.popoverCtrl.dismiss();
    this.router.navigate(['scouter/account-activation']);
  }

  logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
}
