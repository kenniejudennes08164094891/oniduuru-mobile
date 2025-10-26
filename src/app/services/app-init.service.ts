import { Injectable, Injector } from '@angular/core';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { ScouterEndpointsService } from './scouter-endpoints.service';

@Injectable({
  providedIn: 'root',
})
export class AppInitService {
  private isInitialized = false;

  constructor(
    private injector: Injector,
    private authService: AuthService,
    private userService: UserService,
    private scouterService: ScouterEndpointsService
  ) {}

  async initializeApp(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 App already initialized');
      return;
    }

    console.log('🚀 Initializing app...');

    // Check if user is authenticated
    if (this.authService.isAuthenticated()) {
      try {
        await this.initializeUserData();
        await this.initializeNotificationCount();
        this.isInitialized = true;

        // ✅ Emit event to notify components
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

  private async initializeUserData(): Promise<void> {
    console.log('👤 Initializing user data...');

    // Get current user from AuthService
    const currentUser = this.authService.getCurrentUser();

    if (currentUser) {
      // Update UserService with current user data
      this.userService.updateFullProfile(currentUser);

      // Load profile image
      this.userService.initializeProfileImage();

      console.log('✅ User data initialized:', currentUser);
    } else {
      // Try to load from localStorage as fallback
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

  private async initializeNotificationCount(): Promise<void> {
    console.log('🔔 Initializing notification count...');

    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    // ✅ ENHANCED: Try multiple possible locations for uniqueId
    const receiverId = this.extractUniqueId(userData);

    if (!receiverId) {
      console.warn('⚠️ No receiverId found, cannot load notifications');
      this.setNotificationCount(0);
      return;
    }

    try {
      const notifications = await this.loadNotificationsFromAPI(receiverId);
      const count = notifications.length;

      // Store in localStorage for components to use
      this.setNotificationCount(count);
      console.log('✅ Notification count initialized:', count);
    } catch (error) {
      console.error('❌ Failed to load notification count:', error);
      this.setNotificationCount(0);
    }
  }

  // ✅ NEW: Extract uniqueId from multiple possible locations
  private extractUniqueId(userData: any): string | null {
    if (!userData) return null;

    // Try different possible locations for uniqueId
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

  private loadNotificationsFromAPI(receiverId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.scouterService.fetchAllNotifications(receiverId).subscribe({
        next: (res) => {
          let notifications = [];

          if (Array.isArray(res?.notifications)) {
            notifications = res.notifications;
          } else if (Array.isArray(res?.data)) {
            notifications = res.data;
          } else if (Array.isArray(res)) {
            notifications = res;
          }

          resolve(notifications);
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }

  // ✅ ENHANCED: Centralized method to set notification count
  private setNotificationCount(count: number): void {
    localStorage.setItem('notification_count', count.toString());

    // ✅ CRITICAL: Emit a storage event to notify all listening components
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

  // ✅ NEW: Emit app initialized event
  private emitAppInitializedEvent(): void {
    window.dispatchEvent(new Event('appInitialized'));
    localStorage.setItem('app_initialized', Date.now().toString());

    // Also emit storage event for cross-tab communication
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

  // Method to re-initialize when user logs in
  async onUserLogin(): Promise<void> {
    console.log('🔄 Re-initializing app after user login');
    this.isInitialized = false;
    await this.initializeApp();

    // ✅ Force refresh all components
    this.forceComponentRefresh();
  }

  // ✅ ENHANCED: Force all components to refresh their data
  private forceComponentRefresh(): void {
    console.log('🔄 Forcing component refresh...');

    // Emit multiple events to ensure components catch them
    window.dispatchEvent(new Event('appRefresh'));
    window.dispatchEvent(new Event('userLoggedIn'));

    // Use setTimeout to ensure events are processed
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

  // Method to clear data when user logs out
  onUserLogout(): void {
    console.log('🧹 Clearing app data on logout');
    this.isInitialized = false;

    // Clear notification count and emit event
    this.setNotificationCount(0);
    localStorage.removeItem('notifications_cleared');

    // Emit logout event
    window.dispatchEvent(new Event('userLoggedOut'));
  }
}
