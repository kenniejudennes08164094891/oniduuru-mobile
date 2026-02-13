import { Component, OnInit, OnDestroy } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {
  ModalController,
  MenuController,
  PopoverController,
} from '@ionic/angular';
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
  // Add profile data observable
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
    private router: Router,
    private menuCtrl: MenuController,
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

  // ✅ NEW: Listen for app refresh events
  private setupAppRefreshListener(): void {
    window.addEventListener('appRefresh', () => {
      console.log('🔄 Header: App refresh event received');
      this.refreshAllData();
    });
  }

  // ✅ NEW: Setup authentication listeners
  private setupAuthListeners(): void {
    // Listen for login events
    this.authSub = this.authService.userLoggedIn$.subscribe(
      (loggedIn: boolean) => {
        if (loggedIn) {
          console.log('🔄 Header: User logged in, refreshing data');
          // Small delay to ensure app initialization is complete
          setTimeout(() => {
            this.refreshAllData();
          }, 500);
        }
      },
    );

    // Listen for profile update events
    this.authSub.add(
      this.authService.profileUpdated$.subscribe((updated: boolean) => {
        if (updated) {
          console.log('🔄 Header: Profile updated, refreshing data');
          this.refreshAllData();
        }
      }),
    );
  }

  // ✅ ENHANCED: Refresh all header data
  private refreshAllData(): void {
    console.log('🔄 Header: Refreshing all data');

    // Refresh profile image
    this.initializeProfileImage();

    // Refresh notification count
    this.loadNotificationCount();

    // Force reload from UserService
    this.profileImage = this.userService.getProfileImage();
  }

  // ✅ ENHANCED: Initialize profile image with better logic
  private initializeProfileImage(): void {
    console.log('🔄 Header: Initializing profile image');

    // Try multiple sources in order of priority
    const imageSources = [
      // 1. Check UserService first (reactive)
      () => this.userService.getProfileImage(),

      // 2. Check localStorage for cached image
      () => {
        const stored = localStorage.getItem('profile_image');
        return stored && this.isValidImage(stored) ? stored : null;
      },

      // 3. Check user data in localStorage
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

    // Try each source until we find a valid image
    for (const source of imageSources) {
      const image = source();
      if (image && this.isValidImage(image)) {
        this.profileImage = image;
        console.log('✅ Header: Profile image initialized from source');
        return;
      }
    }

    // Fallback to default
    // this.profileImage = 'assets/default-avatar.png';
    console.log('📷 Header: Using default profile image');
  }

  handleImageError(event: any): void {
    console.error('📷 Error loading profile image in header');
    // Set to null to show the placeholder icon
    this.profileImage = null;
  }

  // Load notification count from localStorage (set by notification modal)
  loadStoredNotificationCount() {
    const storedCount = localStorage.getItem('notification_count');
    if (storedCount) {
      this.notificationCount = parseInt(storedCount, 10);
      console.log(
        '📬 Header: Loaded stored notification count:',
        this.notificationCount,
      );
    } else {
      // If no stored count, fall back to API call
      this.loadNotificationCountFromAPI();
    }
  }

  // Load notification count from localStorage (set by notification modal)
  // loadStoredNotificationCount() {
  //   const storedCount = localStorage.getItem('notification_count');
  //   if (storedCount) {
  //     this.notificationCount = parseInt(storedCount, 10);
  //     console.log(
  //       '📬 Loaded stored notification count:',
  //       this.notificationCount
  //     );
  //   } else {
  //     // If no stored count, fall back to API call
  //     this.loadNotificationCountFromAPI();
  //   }
  // }

  // ✅ ENHANCED: Load notification count with better timing and fallbacks
  private loadNotificationCount(): void {
    // First try localStorage
    const storedCount = localStorage.getItem('notification_count');
    this.notificationCount = storedCount ? parseInt(storedCount, 10) : 0;

    console.log(
      '📬 Header: Loaded notification count from storage:',
      this.notificationCount,
    );

    // If count is 0 or not set, and we're authenticated, try to load from API
    if (
      (this.notificationCount === 0 || !storedCount) &&
      this.authService.isAuthenticated()
    ) {
      console.log('🔄 Header: Count is 0 or not set, checking API...');

      // Small delay to ensure user data is fully loaded
      setTimeout(() => {
        this.loadNotificationCountFromAPI();
      }, 1000);
    }
  }

  // ✅ ENHANCED: Load from API with better error handling and retry logic
  private loadNotificationCountFromAPI(): void {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    // ✅ Use the same extraction method as AppInitService
    const receiverId = this.extractUniqueId(userData);

    if (!receiverId) {
      console.warn('⚠️ No receiverId found for API call, user data:', userData);

      // Try again after a delay in case user data isn't fully loaded yet
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

  // ✅ NEW: Extract uniqueId (same method as AppInitService)
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

  // ✅ NEW: Separate API call method for better reusability
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
        // Store the count for future use
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
        // Don't set to 0 here, keep existing value
      },
    });
  }
  private setupNotificationListener(): void {
    // Listen for storage events (cross-tab communication)
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

    // Clean up on component destroy
    this.subscriptions.add(() => {
      window.removeEventListener('storage', storageHandler);
    });
  }

  private isValidImage(imageData: string | null): boolean {
    if (!imageData) return false;

    // Check for data URL
    if (imageData.startsWith('data:image/')) return true;

    // Check for URL
    if (imageData.startsWith('http')) return true;

    // Check for asset path
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
      alignment: 'end', // Changed from 'center' to 'end' - this aligns right edge with trigger
      side: 'bottom',
      cssClass: 'notification-popover',
      arrow: false,
      size: 'auto', // Changed from 'cover' to 'auto'
    });

    popover.onDidDismiss().then(() => {
      console.log('📬 Notification popover dismissed, checking count...');
      this.loadStoredNotificationCount();
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
      // ✅ This only handles backdrop click, not scroll
      canDismiss: true,
    });

    modal.onDidDismiss().then(() => {
      console.log('📬 Notification modal dismissed, checking count...');
      this.loadStoredNotificationCount();
    });

    await modal.present();
  }

  openMenu() {
    this.menuCtrl.enable(true, 'wallet-menu');
    this.menuCtrl.open('wallet-menu');
  }

  async closeMenu() {
    await this.menuCtrl.close('wallet-menu');
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.authSub) this.authSub.unsubscribe();
  }
}
