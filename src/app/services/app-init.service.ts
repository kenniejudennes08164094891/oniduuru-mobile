import { Injectable, Injector } from '@angular/core';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { ScouterEndpointsService } from './scouter-endpoint.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {
  private isInitialized = false;

  constructor(
    private injector: Injector,
    private authService: AuthService,
    private userService: UserService,
    private scouterService: ScouterEndpointsService,
    private router: Router
  ) {}

  async initializeApp(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 App already initialized');
      return;
    }

    console.log('🚀 Initializing app...');

    if (this.authService.isAuthenticated()) {
      try {
        await this.initializeUserData();
        await this.initializeNotificationCount();

        // ✅ Check verification before proceeding
        await this.checkAndHandleVerificationStatus();

        this.isInitialized = true;
        this.emitAppInitializedEvent();

        console.log('✅ App initialization completed');
      } catch (error) {
        console.error('❌ App initialization failed:', error);
      }
    } else {
      console.log('🔐 User not authenticated, skipping app initialization');
      this.isInitialized = true;
    }
  }

  /** ✅ Check if user needs OTP verification before accessing dashboard */
  private async checkAndHandleVerificationStatus(): Promise<void> {
    console.log('🔍 Checking account verification status...');

    const currentUser = this.authService.getCurrentUser();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const isVerified = this.checkAccountVerificationStatus(currentUser || userData);

    if (!isVerified) {
      console.log('⚠️ Account not verified, redirecting to OTP verification');
      await this.redirectToOtpVerification(currentUser || userData);
      return;
    }

    console.log('✅ Account is verified, allowing dashboard access');
  }

  /** ✅ Determine if user is verified from different data structures */
  private checkAccountVerificationStatus(userData: any): boolean {
    if (!userData) return false;

    const verificationSources = [
      userData.details?.user?.isVerified,
      userData.details?.user?.verified,
      userData.details?.user?.emailVerified,
      userData.details?.user?.otpVerified,
      userData.user?.isVerified,
      userData.user?.verified,
      userData.user?.emailVerified,
      userData.user?.otpVerified,
      userData.isVerified,
      userData.verified,
      userData.emailVerified,
      userData.otpVerified,
      userData.data?.user?.isVerified,
      userData.data?.user?.verified,
    ];

    const isVerified = verificationSources.find(status => status === true);
    console.log('🔍 Verification check sources:', verificationSources);
    console.log('✅ Account verified status:', isVerified);
    return isVerified === true;
  }

  /** ✅ Redirects user to appropriate OTP verification page */
  private async redirectToOtpVerification(userData: any): Promise<void> {
    const email = userData.email || userData.details?.user?.email || userData.user?.email;
    const role = this.extractUserRole(userData);

    console.log('🔄 Redirecting to OTP verification:', { email, role });

    const otpData = {
      email,
      userId: userData.details?.user?.id || userData.user?.id || userData.id,
      role,
      userData,
      redirectFrom: this.router.url,
    };

    localStorage.setItem('pending_verification', JSON.stringify(otpData));

    if (role === 'scouter') {
      await this.router.navigate(['/auth/verify-otp'], {
        replaceUrl: true,
        state: { email, userData, requiresVerification: true, redirectFrom: this.router.url },
      });
    } else if (role === 'talent') {
      await this.router.navigate(['/auth/verify-otp'], {
        replaceUrl: true,
        state: { email, userData, requiresVerification: true, redirectFrom: this.router.url },
      });
    } else {
      await this.router.navigate(['/auth/verify-otp'], {
        replaceUrl: true,
        state: { email, userData, requiresVerification: true, redirectFrom: this.router.url },
      });
    }
  }

  /**  Extract user role from nested structures*/
  private extractUserRole(userData: any): string {
    if (!userData) return '';
    const roleSources = [
      userData.details?.user?.role,
      userData.user?.role,
      userData.role,
      userData.data?.user?.role,
      userData.data?.role,
    ];
    const role = roleSources.find(r => r && typeof r === 'string');
    if (!role) console.warn('⚠️ No role found in user data:', userData);
    return role || '';
  }

  /** ✅ Load user profile data */
  private async initializeUserData(): Promise<void> {
    console.log('👤 Initializing user data...');
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      this.userService.updateFullProfile(currentUser);
      this.userService.initializeProfileImage();
      console.log('✅ User data initialized:', currentUser);
    } else {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          this.userService.updateFullProfile(parsedUser);
          console.log('✅ User data loaded from localStorage');
        } catch (error) {
          console.error('❌ Error parsing user data from localStorage:', error);
        }
      }
    }
  }

  /** ✅ Initialize notifications count */
  private async initializeNotificationCount(): Promise<void> {
    console.log('🔔 Initializing notification count...');
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    const receiverId = this.extractUniqueId(userData);

    if (!receiverId) {
      console.warn('⚠️ No receiverId found, cannot load notifications');
      this.setNotificationCount(0);
      return;
    }

    try {
      const notifications = await this.loadNotificationsFromAPI(receiverId);
      const count = notifications.length;
      this.setNotificationCount(count);
      console.log('✅ Notification count initialized:', count);
    } catch (error) {
      console.error('❌ Failed to load notification count:', error);
      this.setNotificationCount(0);
    }
  }

  /** ✅ Extract uniqueId from flexible data shapes */
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

    console.log('🔍 Extracted uniqueId:', uniqueId);
    return uniqueId || null;
  }

  /** ✅ Fetch notifications using the API service */
  private loadNotificationsFromAPI(receiverId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.scouterService.fetchAllNotifications(receiverId).subscribe({
        next: (res: any) => {
          let notifications = [];
          if (Array.isArray(res?.notifications)) notifications = res.notifications;
          else if (Array.isArray(res?.data)) notifications = res.data;
          else if (Array.isArray(res)) notifications = res;
          resolve(notifications);
        },
        error: (err: any) => reject(err),
      });
    });
  }

  /** ✅ Store notification count and emit events */
  private setNotificationCount(count: number): void {
    localStorage.setItem('notification_count', count.toString());
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'notification_count',
        newValue: count.toString(),
        oldValue: localStorage.getItem('notification_count'),
        storageArea: localStorage,
        url: window.location.href,
      })
    );
    console.log('💾 Notification count set and event emitted:', count);
  }

  /** ✅ Emit global app initialization events */
  private emitAppInitializedEvent(): void {
    window.dispatchEvent(new Event('appInitialized'));
    localStorage.setItem('app_initialized', Date.now().toString());

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'app_initialized',
        newValue: Date.now().toString(),
        oldValue: null,
        storageArea: localStorage,
        url: window.location.href,
      })
    );
  }

  /** ✅ Reinitialize app after login */
  async onUserLogin(): Promise<void> {
    console.log('🔄 Re-initializing app after user login');
    this.isInitialized = false;
    await this.initializeApp();
    this.forceComponentRefresh();
  }

  /** ✅ Emit UI refresh signals for components */
  private forceComponentRefresh(): void {
    console.log('🔄 Forcing component refresh...');
    window.dispatchEvent(new Event('appRefresh'));
    window.dispatchEvent(new Event('userLoggedIn'));
    setTimeout(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'user_logged_in',
          newValue: Date.now().toString(),
          oldValue: null,
          storageArea: localStorage,
          url: window.location.href,
        })
      );
    }, 100);
  }

  /** ✅ Clear all app-related data on logout */
  onUserLogout(): void {
    console.log('🧹 Clearing app data on logout');
    this.isInitialized = false;
    this.setNotificationCount(0);
    localStorage.removeItem('notifications_cleared');
    localStorage.removeItem('pending_verification');
    window.dispatchEvent(new Event('userLoggedOut'));
  }
}
