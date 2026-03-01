import { Component, OnInit, OnDestroy } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {
  ModalController,
  MenuController,
  PopoverController,
} from '@ionic/angular';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';
import { UserService } from 'src/app/services/user.service';
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopoverComponent } from 'src/app/utilities/modals/notifications-popover.component/notifications-popover.component';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-scouter-header',
  templateUrl: './scouter-header.component.html',
  styleUrls: ['./scouter-header.component.scss'],
  standalone: false,
})
export class ScouterHeaderComponent implements OnInit, OnDestroy {
  images = imageIcons;
  profileImage: string | null = 'assets/default-avatar.jpg';
  profileData$ = this.userService.profileData$;

  private sub!: Subscription;
  private authSub!: Subscription;
  private subscriptions: Subscription = new Subscription();

  notificationCount: number = 0;

  userStatus: 'online' | 'away' | 'offline' = 'offline';

  constructor(
    private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    public userService: UserService,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService,
    public router: Router,
    private menuCtrl: MenuController,
    private overlayCleanup: OverlayCleanupService,
  ) {
    this.profileImage = this.userService.getProfileImage();
  }

  get isWallet(): boolean {
    return this.router.url.includes('wallet-page');
  }

  ngOnInit() {
    console.log('🔄 ScouterHeaderComponent initializing...');
    this.loadNotificationCount();
    this.setupNotificationListener();
    this.setupAppRefreshListener();

    this.subscriptions.add(
      this.userService.profileData$.subscribe((profile) => {
        if (profile) {
          console.log('🔄 Header: Profile data updated', profile);
        }
      }),
    );

    this.setupAuthListeners();
    this.initializeProfileImage();

    this.sub = this.userService.profileImage$.subscribe((image) => {
      this.profileImage = image || 'assets/default-avatar.png';
      console.log('📷 Header: Profile image updated:', this.profileImage);
    });

    this.userService.status$.subscribe((status) => {
      this.userStatus = status;
    });

    this.userService.setStatus('online');
  }

  private setupAppRefreshListener(): void {
    window.addEventListener('appRefresh', () => {
      console.log('🔄 Header: App refresh event received');
      this.refreshAllData();
    });
  }

  private setupAuthListeners(): void {
    this.authSub = this.authService.userLoggedIn$.subscribe(
      (loggedIn: boolean) => {
        if (loggedIn) {
          console.log('🔄 Header: User logged in, refreshing data');
          setTimeout(() => {
            this.refreshAllData();
          }, 500);
        }
      },
    );

    this.authSub.add(
      this.authService.profileUpdated$.subscribe((updated: boolean) => {
        if (updated) {
          console.log('🔄 Header: Profile updated, refreshing data');
          this.refreshAllData();
        }
      }),
    );
  }

  private refreshAllData(): void {
    console.log('🔄 Header: Refreshing all data');
    this.initializeProfileImage();
    this.loadNotificationCount();
    this.profileImage = this.userService.getProfileImage();
  }

  private initializeProfileImage(): void {
    console.log('🔄 Header: Initializing profile image');
    const imageSources = [
      () => this.userService.getProfileImage(),
      () => {
        const stored = localStorage.getItem('profile_image');
        return stored && this.isValidImage(stored) ? stored : null;
      },
      () => {
        try {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            const parsed = JSON.parse(userData);
            return parsed.profileImage || parsed.profilePicture || null;
          }
        } catch (e) {
          console.warn('Error parsing user_data for profile image:', e);
        }
        return null;
      },
    ];

    for (const source of imageSources) {
      const image = source();
      if (image && this.isValidImage(image)) {
        this.profileImage = image;
        console.log('✅ Header: Profile image initialized from source');
        return;
      }
    }
    console.log('📷 Header: Using default profile image');
  }

  handleImageError(event: any): void {
    console.error('📷 Error loading profile image in header');
    this.profileImage = null;
  }

  loadStoredNotificationCount() {
    const storedCount = localStorage.getItem('notification_count');
    if (storedCount) {
      this.notificationCount = parseInt(storedCount, 10);
      console.log(
        '📬 Header: Loaded stored notification count:',
        this.notificationCount,
      );
    } else {
      this.loadNotificationCountFromAPI();
    }
  }

  private loadNotificationCount(): void {
    const storedCount = localStorage.getItem('notification_count');
    this.notificationCount = storedCount ? parseInt(storedCount, 10) : 0;
    console.log(
      '📬 Header: Loaded notification count from storage:',
      this.notificationCount,
    );

    if (
      (this.notificationCount === 0 || !storedCount) &&
      this.authService.isAuthenticated()
    ) {
      console.log('🔄 Header: Count is 0 or not set, checking API...');
      setTimeout(() => {
        this.loadNotificationCountFromAPI();
      }, 1000);
    }
  }

  private loadNotificationCountFromAPI(): void {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const receiverId = this.extractUniqueId(userData);

    if (!receiverId) {
      console.warn('⚠️ No receiverId found for API call, user data:', userData);
      setTimeout(() => {
        const retryUserData = JSON.parse(
          localStorage.getItem('user_data') || '{}',
        );
        const retryReceiverId = this.extractUniqueId(retryUserData);
        if (retryReceiverId) {
          console.log(
            '🔄 Retrying notification API call with receiverId:',
            retryReceiverId,
          );
          this.makeNotificationAPIcall(retryReceiverId);
        } else {
          console.warn('❌ Still no receiverId after retry');
        }
      }, 2000);
      return;
    }

    console.log('🔔 Loading notification count from API for user:', receiverId);
    this.makeNotificationAPIcall(receiverId);
  }

  private extractUniqueId(userData: any): string | null {
    if (!userData) return null;
    const uniqueId =
      userData.uniqueId ||
      userData.id ||
      userData._id ||
      userData.userId ||
      userData.scouterId ||
      userData.details?.user?.uniqueId ||
      userData.details?.user?.id;
    return uniqueId || null;
  }

  private makeNotificationAPIcall(receiverId: string): void {
    this.scouterService.fetchAllNotifications(receiverId).subscribe({
      next: (res) => {
        console.log('📬 Raw notifications API response:', res);
        let notifications = [];
        if (Array.isArray(res?.notifications)) {
          notifications = res.notifications;
        } else if (Array.isArray(res?.data)) {
          notifications = res.data;
        } else if (Array.isArray(res)) {
          notifications = res;
        }
        this.notificationCount = notifications.length;
        localStorage.setItem(
          'notification_count',
          this.notificationCount.toString(),
        );
        console.log(
          '✅ Notification count updated from API:',
          this.notificationCount,
        );
      },
      error: (err) => {
        console.error('❌ Error loading notification count from API:', err);
      },
    });
  }

  private setupNotificationListener(): void {
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'notification_count') {
        const newCount = parseInt(event.newValue || '0', 10);
        console.log(
          '🔄 Storage event: notification count updated to',
          newCount,
        );
        this.notificationCount = newCount;
      }
      if (event.key === 'notifications_cleared') {
        console.log('🔄 Storage event: notifications cleared');
        this.notificationCount = 0;
      }
      if (event.key === 'app_initialized') {
        console.log('🔄 App initialized event received');
        this.refreshAllData();
      }
    };
    window.addEventListener('storage', storageHandler);
    this.subscriptions.add(() => {
      window.removeEventListener('storage', storageHandler);
    });
  }

  private isValidImage(imageData: string | null): boolean {
    if (!imageData) return false;
    if (imageData.startsWith('data:image/')) return true;
    if (imageData.startsWith('http')) return true;
    if (imageData.startsWith('assets/')) return true;
    return false;
  }

  async openNotificationPopover(event: any) {
    console.log('📬 Opening notification popover');
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopoverComponent,
      event: event,
      translucent: false,
      showBackdrop: true,
      backdropDismiss: true,
      alignment: 'end',
      side: 'bottom',
      cssClass: 'notification-popover',
      arrow: false,
      size: 'auto',
    });
    popover.onDidDismiss().then(() => {
      console.log('📬 Notification popover dismissed, checking count...');
      this.loadStoredNotificationCount();
      this.overlayCleanup.cleanBackdrops();
    });
    await popover.present();
  }

  async openProfilePopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopupSettingsModalComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
  }

  async openNotificationModal() {
    const modal = await this.modalCtrl.create({
      component: NotificationsPopoverComponent,
      cssClass: 'notification-fullscreen-modal',
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: true,
      canDismiss: true,
    });
    modal.onDidDismiss().then(() => {
      console.log('📬 Notification modal dismissed, checking count...');
      this.loadStoredNotificationCount();
    });
    await modal.present();
  }

  async openMenu() {
    await this.menuCtrl.enable(true, 'wallet-menu');
    try {
      const menu = await this.menuCtrl.get('wallet-menu');
      if (menu) {
        await this.menuCtrl.open('wallet-menu');
      } else {
        console.warn(
          '⚠️ openMenu invoked but wallet-menu element not available yet',
        );
        setTimeout(() => {
          this.menuCtrl.open('wallet-menu');
        }, 200);
      }
    } catch (e) {
      console.error('❌ error opening wallet-menu', e);
    }
  }

  async closeMenu() {
    await this.menuCtrl.close('wallet-menu');
  }

  routeBack() {
    this.router.navigate(['/scouter/dashboard']);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.authSub) this.authSub.unsubscribe();
  }
}
