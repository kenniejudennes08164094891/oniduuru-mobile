import { Injectable } from '@angular/core';

/**
 * Helper service that attempts to clean up any leftover Ionic overlays/backdrops
 * which can unexpectedly block user interaction.  We've seen situations where
 * a popover/modal/alert is removed from the DOM but its backdrop remains, or
 * where navigation leaves an orphaned backdrop sitting over the app.  The
 * result is a "frozen" UI – nothing responds to taps except elements with a
 * higher z-index (the chat bot button in particular).
 *
 * This service provides a couple of utility methods that can be called from
 * application-wide locations (app component, popovers, modals, router events)
 * to aggressively remove any stray elements.
 */
@Injectable({ providedIn: 'root' })
export class OverlayCleanupService {
  private pollIntervalId: number | null = null;

  /**
   * Remove all <ion-backdrop> elements from the document.  They are the
   * usual culprit when the UI becomes unresponsive, as they cover the entire
   * screen and intercept pointer events.
   */
  cleanBackdrops(): void {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach((b) => b.remove());

    // also remove any custom overlays we add manually (profile cards, etc.)
    const custom = document.querySelectorAll('.profile-card-overlay');
    custom.forEach((el) => el.remove());
  }

  /**
   * Remove any Ionic overlay elements that may still be attached.  This is a
   * bit more aggressive than just throwing away backdrops; it's useful when an
   * overlay was half‑created or the framework failed to clean it up.
   */
  cleanOverlays(): void {
    const overlayTags = [
      'ion-popover',
      'ion-modal',
      'ion-alert',
      'ion-action-sheet',
      'ion-picker',
    ];

    overlayTags.forEach((tag) => {
      const els = document.querySelectorAll(tag);
      els.forEach((el) => el.remove());
    });

    // backdrops are often left behind even when the above elements are gone
    this.cleanBackdrops();

    // also clear any body classes that might disable interaction
    document.body.classList.remove('popover-active', 'modal-active');
  }

  /**
   * Start a low-frequency poll that ensures stray backdrops are cleared even
   * when the user can't interact (e.g. the UI is frozen).  The interval is
   * intentionally long to avoid performance impact.
   */
  startPolling(): void {
    if (this.pollIntervalId != null) {
      return;
    }

    this.pollIntervalId = window.setInterval(() => {
      this.cleanBackdrops();
    }, 2000);
  }

  /**
   * Stop the polling timer when the app is torn down.  Typically only useful
   * in unit tests.
   */
  stopPolling(): void {
    if (this.pollIntervalId != null) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }
}
