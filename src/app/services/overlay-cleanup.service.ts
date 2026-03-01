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
    backdrops.forEach((b) => {
      // Check if backdrop is hidden or should be hidden
      const parent = b.parentElement;
      const parentHidden =
        parent?.hasAttribute('hidden') ||
        parent?.getAttribute('aria-hidden') === 'true' ||
        parent?.style.display === 'none' ||
        b.style.opacity === '0';

      // Remove orphaned or hidden backdrops
      if (
        parentHidden ||
        b.classList.contains('hidden') ||
        b.hasAttribute('hidden')
      ) {
        b.remove();
      }
    });

    // also remove any custom overlays we add manually (profile cards, etc.)
    const custom = document.querySelectorAll('.profile-card-overlay');
    custom.forEach((el) => el.remove());

    // Remove any leftover modal wrappers
    const modalWrappers = document.querySelectorAll('.modal-wrapper');
    modalWrappers.forEach((wrapper) => {
      const parent = wrapper.parentElement;
      // Only remove if parent is hidden/removed
      if (
        parent &&
        (parent.hasAttribute('hidden') || parent.style.display === 'none')
      ) {
        wrapper.remove();
      }
    });
  }

  /**
   * Force fix any backdrop that's blocking interactions by removing pointer-events
   */
  forceFixBlockingBackdrops(): void {
    const backdrops = document.querySelectorAll('ion-backdrop');
    backdrops.forEach((b) => {
      // Force pointer-events to none if backdrop is invisible
      const style = window.getComputedStyle(b);
      const opacity = parseFloat(style.opacity);
      const visibility = style.visibility;

      // If backdrop is invisible but still accepting events, fix it
      if (
        (opacity === 0 || visibility === 'hidden') &&
        style.pointerEvents !== 'none'
      ) {
        b.style.pointerEvents = 'none !important';
      }
    });
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
      this.forceFixBlockingBackdrops();
    }, 1500);
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
