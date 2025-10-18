import { Component, OnInit } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { Router, NavigationStart } from '@angular/router';

import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-notifications-popup-modal',
  templateUrl: './notifications-popup-modal.component.html',
  styleUrls: ['./notifications-popup-modal.component.scss'],
  standalone: false,
})
export class NotificationsPopupModalComponent extends BaseModal {
  images = imageIcons;

  notifications: any[] = [];
  receiverId!: string; // current user

  // Color palette for avatar backgrounds
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
    '#F8C471',
    '#82E0AA',
    '#F1948A',
    '#85C1E9',
    '#D7BDE2',
    '#F9E79F',
    '#A9DFBF',
    '#D2B4DE',
    '#AED6F1',
    '#FAD7A0',
  ];

  constructor(
    modalCtrl: ModalController,
    protected override platform: Platform,
    private router: Router,
    private scouterService: ScouterEndpointsService,
    private toast: ToastController
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit(): void {
    super.ngOnInit?.();
    this.receiverId = this.getLoggedInUserId();
    this.loadNotifications();

    // Dismiss modal if navigating away
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) this.dismiss();
    });
  }

  getLoggedInUserId(): string {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    // Try multiple possible ID fields in order of priority
    const userId =
      userData?.uniqueId ||
      userData?.id ||
      userData?.userId ||
      userData?.scouterId ||
      userData?.talentId ||
      '';

    return userId;
  }

  // Enhanced method to get the actual logged-in user ID for API calls
  getActualLoggedInUserId(): string {
    // Try multiple sources for the actual user ID
    const sources = [
      // 1. Check localStorage user_data
      () => {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        return userData?.uniqueId || userData?.id || userData?.userId;
      },
      // 2. Check eniyan encoded data
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
      // 3. Check for specific format like "scouter/2323/4October2025"
      () => {
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (userData?.uniqueId && userData.uniqueId.includes('/')) {
          return userData.uniqueId;
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

  loadNotifications() {
    this.scouterService.fetchAllNotifications(this.receiverId).subscribe({
      next: (res) => {
        // ✅ FIX: Use 'notifications' property instead of 'data'
        this.notifications = Array.isArray(res?.notifications)
          ? res.notifications
          : [];

        // Store the count for header to use
        this.storeNotificationCount(this.notifications.length);
      },
      error: async (err) => {
        console.error('❌ Error fetching notifications:', err);
        const toast = await this.toast.create({
          message: 'Failed to load notifications',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
        // Store 0 count on error
        this.storeNotificationCount(0);
      },
    });
  }

  async clearNotifications() {
    const loggedInUniqueId = this.getActualLoggedInUserId();

    // Validate that we have a valid ID
    if (!loggedInUniqueId || loggedInUniqueId === '') {
      console.error('❌ No valid loggedInUniqueId found');
      const toast = await this.toast.create({
        message: 'Unable to identify user. Please log in again.',
        duration: 3000,
        color: 'danger',
      });
      // After clearing, update the global count
      this.storeNotificationCount(0);
      this.emitNotificationsCleared();

      console.log('✅ Notifications cleared, count updated globally');
      toast.present();
      return;
    }

    const payload = {
      receiverId: this.receiverId,
      loggedInUniqueId: loggedInUniqueId, // Use the actual logged-in user ID
    };

    this.scouterService.clearMyNotifications(payload).subscribe({
      next: async (res) => {
        this.notifications = [];
        const toast = await this.toast.create({
          message: res?.message || 'Notifications cleared successfully!',
          duration: 1500,
          color: 'success',
        });
        toast.present();

        // Store 0 count after clearing
        this.storeNotificationCount(0);
        // Emit event to update header count
        this.emitNotificationsCleared();
      },
      error: async (err) => {
        console.error('❌ Error clearing notifications:', err);

        let errorMessage = 'Failed to clear notifications';
        if (err.status === 400) {
          errorMessage = 'Invalid user identification. Please try again.';
        } else if (err.status === 401) {
          errorMessage = 'Please log in again.';
        }

        const toast = await this.toast.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger',
        });
        toast.present();
      },
    });
  }

  // Store notification count for header to use
  private storeNotificationCount(count: number) {
    localStorage.setItem('notification_count', count.toString());
    console.log('💾 Stored notification count:', count);
  }

  // Emit event to update header notification count
  private emitNotificationsCleared() {
    localStorage.setItem('notifications_cleared', Date.now().toString());
  }

  // Generate avatar text from sender or title
  getAvatarText(notification: any): string {
    const textSource = notification.tagName || notification.senderId || 'ON';

    // Extract first letters from words
    const words = textSource.split(/[\s@._-]+/);
    let initials = '';

    if (words.length === 1) {
      // Single word - take first 2 characters
      initials = words[0].substring(0, 2).toUpperCase();
    } else {
      // Multiple words - take first letter of first two words
      initials = words
        .slice(0, 2)
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase();
    }

    return initials || 'ON';
  }

  // Generate consistent color based on sender/tag name
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

  // Check if we should show avatar with initials (for security emails, etc.)
  shouldShowInitialsAvatar(notification: any): boolean {
    return (
      !notification.avatar &&
      (notification.senderId?.includes('@') ||
        notification.tagName ||
        !notification.avatar)
    );
  }

  // Main method to get avatar display
  getNotificationAvatar(notification: any): any {
    // If there's a proper avatar image, use it
    if (
      notification.avatar &&
      notification.avatar !== 'assets/default-avatar.png'
    ) {
      return notification.avatar;
    }

    // Otherwise, return null to indicate we should use initials
    return null;
  }

  onImageError(event: any) {
    event.target.style.display = 'none';
    // The parent div will show the initials avatar instead
  }

  formatNotificationDate(dateString: string): string {
    // Convert "Oct 14, 2025, 4:01 PM" to a more readable format
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
      return dateString; // Return original if parsing fails
    }
  }
}
