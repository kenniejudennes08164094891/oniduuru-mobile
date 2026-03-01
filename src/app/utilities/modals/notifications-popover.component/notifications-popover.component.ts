import { Component, OnInit, OnDestroy } from '@angular/core';
import { PopoverController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { Router, NavigationStart } from '@angular/router';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-notifications-popover',
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
  standalone: false,
})
export class NotificationsPopoverComponent implements OnInit, OnDestroy {
  images = imageIcons;
  notifications: any[] = [];
  receiverId!: string;

  private destroy$ = new Subject<void>();
  private isDismissing = false;

  private avatarColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#BB8FCE',
    '#85C1E9',
  ];

  constructor(
    private popoverCtrl: PopoverController,
    private platform: Platform,
    private router: Router,
    private scouterService: ScouterEndpointsService,
    private toastService: ToastsService,
    private overlayCleanup: OverlayCleanupService,
  ) {}

  ngOnInit(): void {
    this.receiverId = this.getLoggedInUserId();
    this.loadNotifications();

    // Dismiss popover if navigating away
    this.router.events.pipe(takeUntil(this.destroy$)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Dismiss the popover with proper error handling
   */
  async dismiss(): Promise<void> {
    // Prevent multiple dismissal attempts
    if (this.isDismissing) {
      return;
    }

    this.isDismissing = true;

    try {
      // Check if popoverController exists
      if (!this.popoverCtrl) {
        console.warn('PopoverController not available');
        this.fallbackDismiss();
        return;
      }

      // Try to get the top popover first
      const topPopover = await this.popoverCtrl.getTop().catch(() => null);

      if (topPopover) {
        // If there's a popover on top, dismiss it
        await this.popoverCtrl.dismiss().catch((error) => {
          console.warn('Error dismissing popover:', error);
          this.fallbackDismiss();
        });
      } else {
        // No popover found, try fallback
        console.log('No popover found to dismiss');
        this.fallbackDismiss();
      }
    } catch (error) {
      console.error('Error in dismiss method:', error);
      this.fallbackDismiss();
    } finally {
      // Reset dismissing flag after a delay
      setTimeout(() => {
        this.isDismissing = false;
      }, 300);
    }
  }

  /**
   * Fallback method to dismiss popover using DOM manipulation
   */
  private fallbackDismiss(): void {
    try {
      // remove anything left over -- be aggressive because we don't want an
      // orphaned backdrop blocking the UI
      this.overlayCleanup.cleanOverlays();
    } catch (error) {
      console.warn('Fallback dismiss failed:', error);
    }
  }

  /**
   * Safe method to check if popover is still active
   */
  private async isPopoverActive(): Promise<boolean> {
    try {
      const topPopover = await this.popoverCtrl.getTop().catch(() => null);
      return !!topPopover;
    } catch {
      return false;
    }
  }

  /**
   * Get logged in user ID
   */
  getLoggedInUserId(): string {
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userId =
        userData?.uniqueId ||
        userData?.id ||
        userData?.userId ||
        userData?.scouterId ||
        userData?.talentId ||
        '';
      return userId;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return '';
    }
  }

  /**
   * Get actual logged in user ID for API calls
   */
  getActualLoggedInUserId(): string {
    const sources = [
      () => {
        try {
          const userData = JSON.parse(
            localStorage.getItem('user_data') || '{}',
          );
          return userData?.uniqueId || userData?.id || userData?.userId;
        } catch {
          return null;
        }
      },
      () => {
        const eniyan = localStorage.getItem('eniyan');
        if (eniyan) {
          try {
            const decoded = JSON.parse(atob(eniyan));
            return decoded?.uniqueId || decoded?.id || decoded?.userId;
          } catch (e) {
            return null;
          }
        }
        return null;
      },
      () => {
        try {
          const userData = JSON.parse(
            localStorage.getItem('user_data') || '{}',
          );
          if (userData?.uniqueId && userData.uniqueId.includes('/')) {
            return userData.uniqueId;
          }
        } catch {
          return null;
        }
        return null;
      },
    ];

    for (const source of sources) {
      const id = source();
      if (id && id !== '') {
        return id;
      }
    }
    return this.receiverId;
  }

  /**
   * Load notifications from API
   */
  loadNotifications() {
    if (!this.receiverId) {
      console.warn('⚠️ No receiverId found, cannot load notifications');
      return;
    }

    this.scouterService
      .fetchAllNotifications(this.receiverId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.notifications = Array.isArray(res?.notifications)
            ? res.notifications
            : [];
          this.storeNotificationCount(this.notifications.length);
        },
        error: async (err) => {
          console.error('❌ Error fetching notifications:', err);
          this.toastService.openSnackBar(
            'Failed to load notifications',
            'error',
          );
          this.storeNotificationCount(0);
        },
      });
  }

  /**
   * Clear all notifications
   */
  async clearNotifications() {
    const loggedInUniqueId = this.getActualLoggedInUserId();

    if (!loggedInUniqueId || loggedInUniqueId === '') {
      console.error('❌ No valid loggedInUniqueId found');
      this.toastService.openSnackBar(
        'Unable to identify user. Please log in again.',
        'error',
      );
      this.storeNotificationCount(0);
      this.emitNotificationsCleared();

      // Dismiss popover after clearing
      await this.dismiss();
      return;
    }

    const payload = {
      receiverId: this.receiverId,
      loggedInUniqueId: loggedInUniqueId,
    };

    this.scouterService
      .clearMyNotifications(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (res) => {
          this.notifications = [];
          this.storeNotificationCount(0);
          this.emitNotificationsCleared();
          this.toastService.openSnackBar(
            res?.message || 'Notifications cleared successfully!',
            'success',
          );

          // Dismiss popover after successful clear
          setTimeout(() => {
            this.dismiss();
          }, 500);
        },
        error: async (err) => {
          console.error('❌ Error clearing notifications:', err);
          let errorMessage = 'Failed to clear notifications';
          if (err.status === 400) {
            errorMessage = 'Invalid user identification. Please try again.';
          } else if (err.status === 401) {
            errorMessage = 'Please log in again.';
          }
          this.toastService.openSnackBar(errorMessage, 'error');
        },
      });
  }

  private storeNotificationCount(count: number) {
    localStorage.setItem('notification_count', count.toString());
    console.log('💾 Stored notification count:', count);
  }

  private emitNotificationsCleared() {
    localStorage.setItem('notifications_cleared', Date.now().toString());
  }

  // Avatar helper methods
  getAvatarText(notification: any): string {
    const textSource = notification.tagName || notification.senderId || 'ON';
    const words = textSource.split(/[\s@._-]+/);
    let initials = '';

    if (words.length === 1) {
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      initials = words
        .slice(0, 2)
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase();
    }
    return initials || 'ON';
  }

  getAvatarColor(notification: any): string {
    const textSource =
      notification.tagName || notification.senderId || 'Oniduuru';
    let hash = 0;
    for (let i = 0; i < textSource.length; i++) {
      hash = textSource.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % this.avatarColors.length;
    return this.avatarColors[index];
  }

  shouldShowInitialsAvatar(notification: any): boolean {
    return (
      !notification.avatar &&
      (notification.senderId?.includes('@') ||
        notification.tagName ||
        !notification.avatar)
    );
  }

  getNotificationAvatar(notification: any): any {
    if (
      notification.avatar &&
      notification.avatar !== 'assets/default-avatar.png'
    ) {
      return notification.avatar;
    }
    return null;
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
  }

  formatNotificationDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString() +
        ' ' +
        date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch {
      return dateString;
    }
  }
}
