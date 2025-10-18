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
import { AuthService } from '../../../services/auth.service';

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
    private platform: Platform,
    private authService: AuthService
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
    this.routerEventsSub = this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        await this.dismiss();
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
  async goBack(): Promise<void> {
    await this.popoverCtrl.dismiss();
    await this.router.navigate(['/scouter/dashboard']); // ✅ always route to dashboard
  }

  async openComplaintModal() {
    await this.popoverCtrl.dismiss();
    const modal = await this.modalCtrl.create({
      component: LogComplaintsPopupModalComponent,
    });
    await modal.present();
  }

  async openProfilePage(): Promise<void> {
    await this.popoverCtrl.dismiss();
    await this.router.navigate(['/scouter/profile']);
  }

  async openActivationPage(): Promise<void> {
    await this.popoverCtrl.dismiss();
    await this.router.navigate(['/scouter/account-activation']);
  }

  async logoutUser(): Promise<void> {
    try {
      // Subscribe to the logout observable to ensure the HTTP call executes
      this.authService.logoutUser().subscribe({
        next: () => {
          console.log('✅ Logout successful');
          // The redirect happens in the service, so we just close the popover
          this.dismiss();
          this.forceLogout();
        },
        error: (err) => {
          console.error('❌ Logout failed:', err);
          // Even if the API call fails, clear local data and redirect
          this.forceLogout();
        },
      });
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Fallback: force logout even if something goes wrong
      this.forceLogout();
    }
  }

  // Fallback method to ensure logout happens
  private forceLogout(): void {
    // Manually clear auth data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('eniyan');
    localStorage.removeItem('registration_email');
    localStorage.removeItem('profile_image');

    // Close popover and redirect to login
    this.dismiss();
    this.router.navigate(['/auth/login']);
  }
}
