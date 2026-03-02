// app.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { initFlowbite } from 'flowbite';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AppInitService } from './services/app-init.service';
import { EndpointService } from './services/endpoint.service';
import { WalletEventsService } from './services/wallet-events.service';
import { OverlayCleanupService } from './services/overlay-cleanup.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('appRoot') appRoot!: ElementRef;

  hasWalletProfile = false;
  private subscriptions = new Subscription();

  currentUserRole: string = '';

  // track current URL so showWalletMenu can return the right value
  currentUrl: string = '';

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private userService: UserService,
    private appInitService: AppInitService,
    private endpointService: EndpointService,
    private walletEvents: WalletEventsService,
    private overlayCleanup: OverlayCleanupService,
  ) {
    document.body.classList.remove('dark');
  }

  ngOnInit(): void {
    this.appInitService.initializeApp();
    this.userService.initializeProfileImage();
    initFlowbite();
    document.body.classList.remove('dark');

    // Handle menu closing on navigation and perform overlay cleanup
    // keep track of the current url so our showWalletMenu getter works immediately
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const isOpen = this.menuCtrl.isOpen('wallet-menu');
        isOpen.then((open) => {
          if (open) {
            this.menuCtrl.close('wallet-menu');
          }
        });

        // remove any stray overlays/backdrops before the new page loads
        this.overlayCleanup.cleanOverlays();
      }
      if (event instanceof NavigationEnd) {
        this.currentUrl = this.router.url;
        // IMPORTANT: Re-check wallet profile on every navigation for wallet pages
        // This ensures the menu buttons update correctly when transitioning
        if (this.currentUrl.includes('/wallet-page')) {
          console.log(
            '🧭 Navigation to wallet page detected, re-checking wallet profile',
          );
          setTimeout(() => this.checkWalletProfile(), 200);
        }
      }
    });

    // initialize currentUrl immediately in case the app started on a wallet page
    this.currentUrl = this.router.url;

    this.getUserRole();

    // Listen for login events
    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        console.log('✅ User logged in event detected in AppComponent');
        this.getUserRole(); // Update user role immediately
        // immediately clear and check profile
        this.hasWalletProfile = false;
        this.checkWalletProfile();
        setTimeout(() => {
          this.appInitService.onUserLogin();
          this.checkWalletProfile(); // Check wallet when user logs in again
        }, 1000);
      } else {
        console.log('❌ User logged out event detected in AppComponent');
        this.hasWalletProfile = false; // Reset when logged out
        this.currentUserRole = ''; // Reset role when logged out
        this.currentUrl = ''; // Reset URL cache
      }
    });

    // Also react to explicit user data changes (profileUpdated or currentUser)
    this.authService.currentUser$.subscribe((user) => {
      console.log('👤 currentUser$ changed, re-checking wallet');
      this.getUserRole();
      this.checkWalletProfile();
    });

    this.authService.profileUpdated$.subscribe((updated) => {
      if (updated) {
        console.log('📝 Profile updated event received in AppComponent');
        this.checkWalletProfile();
      }
    });

    // Listen for profile updates (when wallet is created or profile changes)
    this.authService.profileUpdated$.subscribe((updated) => {
      if (updated) {
        console.log('📝 Profile updated event received, re-checking wallet');
        setTimeout(() => this.checkWalletProfile(), 500);
      }
    });

    // Check wallet profile on init if user is already logged in
    const isAuthenticated = this.authService.validateStoredToken();
    if (isAuthenticated) {
      this.checkWalletProfile();
    }

    (window as any).appComponentRef = this;

    // start periodic cleanup in case a stray backdrop is left behind
    this.overlayCleanup.startPolling();

    // also add global listeners just in case an overlay is created and never
    // dismissed due to a bug (touching the screen will try to clean up).
    document.addEventListener('click', () => {
      this.overlayCleanup.cleanBackdrops();
    });
    document.addEventListener('ionPopoverDidDismiss', () => {
      this.overlayCleanup.cleanBackdrops();
    });
    document.addEventListener('ionModalDidDismiss', () => {
      this.overlayCleanup.cleanBackdrops();
    });
    document.addEventListener('ionAlertDidDismiss', () => {
      this.overlayCleanup.cleanBackdrops();
    });
    document.addEventListener('ionActionSheetDidDismiss', () => {
      this.overlayCleanup.cleanBackdrops();
    });

    // EMERGENCY: Add keyboard listener to unfreeze app if UI becomes unresponsive
    document.addEventListener(
      'keydown',
      (e) => {
        // Press ESC twice rapidly to force unfreeze
        if (e.key === 'Escape') {
          this.overlayCleanup.cleanBackdrops();
          this.overlayCleanup.cleanOverlays();
          console.log('🔆 Emergency unfreeze triggered - cleaned all overlays');
        }
      },
      true,
    );

    // Listen for wallet profile creation events
    this.walletEvents.walletProfileCreated$.subscribe(() => {
      console.log('🎯 Received wallet profile created event');
      this.hasWalletProfile = true;
      // Optionally refresh the check to ensure everything is synced
      setTimeout(() => this.checkWalletProfile(), 500);
    });
  }

  ngAfterViewInit() {
    // Force the menu visible immediately to ensure it's in DOM and clickable
    const menu = document.querySelector('ion-menu[menuId="wallet-menu"]');
    if (menu) {
      // Don't hide the menu - let [disabled] and CSS handle visibility
      menu.removeAttribute('hidden');
      if (this.currentUserRole) {
        menu.setAttribute('data-role', this.currentUserRole);
      }

      // Re-check menu status in case role was just set
      setTimeout(() => {
        if (this.showWalletMenu() && menu.hasAttribute('hidden')) {
          menu.removeAttribute('hidden');
        }
      }, 100);
    }
  }

  private getUserRole(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserRole = user.role || user.details?.user?.role || '';
        console.log('👤 Current user role:', this.currentUserRole);
      } catch (e) {
        console.warn('Error getting user role:', e);
        this.currentUserRole = '';
      }
    } else {
      this.currentUserRole = '';
      console.log('👤 No user data, clearing role');
    }
  }

  /**
   * Check wallet profile status - comprehensive check across all possible data sources
   */
  private checkWalletProfile(): void {
    console.log('🔍 === WALLET PROFILE CHECK START ===');
    try {
      // always reset before recalculating
      this.hasWalletProfile = false;

      // Prefer currentUser subject (should be up-to-date)
      const storedUser = this.authService.getCurrentUser() || null;
      let user = storedUser;

      // fall back to localStorage if needed
      if (!user) {
        const userData = localStorage.getItem('user_data');
        const userProfileData = localStorage.getItem('user_profile_data');
        const localStorageFlag = localStorage.getItem('hasWalletProfile');

        console.log('📦 Available data sources:');
        console.log('  - user_data exists:', !!userData);
        console.log('  - user_profile_data exists:', !!userProfileData);
        console.log('  - hasWalletProfile flag:', localStorageFlag);

        if (userData) {
          try {
            user = JSON.parse(userData);
          } catch (parseError) {
            console.error('❌ Error parsing user_data:', parseError);
          }
        }
        if (!user && userProfileData) {
          try {
            user = JSON.parse(userProfileData);
            console.log('ℹ️ Using user_profile_data instead of user_data');
          } catch (parseError) {
            console.error('❌ Error parsing user_profile_data:', parseError);
          }
        }

        // if still no user, check storage flag
        if (!user && localStorageFlag === 'true') {
          this.hasWalletProfile = true;
          console.log('✅ Inferred wallet from storage flag only');
          return;
        }

        if (!user) {
          console.log('❌ No user data found, abort');
          return;
        }
      }

      const userId = user?.scouterId || user?.talentId || user?.id || 'unknown';
      console.log(`👤 Checking user: ${userId}`);

      let foundWallet = false;
      const reasons: string[] = [];

      // CHECK 1: Direct hasWalletProfile property (HIGHEST PRIORITY)
      if (user.hasWalletProfile === true) {
        console.log('✅ CHECK 1: user.hasWalletProfile === true');
        foundWallet = true;
        reasons.push('direct hasWalletProfile');
      }

      // CHECK 2: Nested user object (user.details.user.hasWalletProfile)
      if (!foundWallet && user.details?.user?.hasWalletProfile === true) {
        console.log('✅ CHECK 2: user.details.user.hasWalletProfile === true');
        foundWallet = true;
        reasons.push('nested user.details.user');
      }

      // CHECK 3: Direct user property (user.user.hasWalletProfile)
      if (!foundWallet && user.user?.hasWalletProfile === true) {
        console.log('✅ CHECK 3: user.user.hasWalletProfile === true');
        foundWallet = true;
        reasons.push('nested user.user');
      }

      // CHECK 4: Wallet presence flags (paid/verified status)
      if (!foundWallet && (user.paid === true || user.paid === 'true')) {
        console.log('✅ CHECK 4: User has paid/verified status');
        foundWallet = true;
        reasons.push('paid status');
      }

      // CHECK 5: completeOnboarding with hasWalletProfile
      if (!foundWallet && user.completeOnboarding) {
        try {
          const onboarding =
            typeof user.completeOnboarding === 'string'
              ? JSON.parse(user.completeOnboarding)
              : user.completeOnboarding;
          if (onboarding?.hasWalletProfile === true) {
            console.log(
              '✅ CHECK 5: completeOnboarding.hasWalletProfile === true',
            );
            foundWallet = true;
            reasons.push('completeOnboarding');
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse completeOnboarding:', parseError);
        }
      }

      // CHECK 6: Wallet identifiers (walletId, walletAccountNumber, etc.)
      if (!foundWallet) {
        const walletIdentifiers = [
          user.walletId,
          user.walletAccountNumber,
          user.wallet?.id,
          user.wallet?.accountNumber,
          user.wallet?.walletId,
        ].filter(Boolean);
        if (walletIdentifiers.length > 0) {
          console.log('✅ CHECK 6: Found wallet identifiers');
          foundWallet = true;
          reasons.push('wallet identifiers');
        }
      }

      // CHECK 7: Simple localStorage flag (set by wallet profile creation)
      if (!foundWallet) {
        const localStorageFlag = localStorage.getItem('hasWalletProfile');
        if (localStorageFlag === 'true') {
          console.log('✅ CHECK 7: localStorage hasWalletProfile flag is true');
          foundWallet = true;
          reasons.push('localStorage flag');
        }
      }

      // Log full user object for debugging if wallet not found
      if (!foundWallet) {
        console.warn(
          '⚠️ No wallet profile detected. User object keys:',
          Object.keys(user),
        );
      }

      this.hasWalletProfile = foundWallet;
      if (foundWallet) {
        console.log(
          `✅ RESULT: Wallet profile FOUND (via: ${reasons.join(', ')})`,
        );
      } else {
        console.log('❌ RESULT: No wallet profile detected');
      }
      console.log('🔍 === WALLET PROFILE CHECK END ===\n');
    } catch (error) {
      console.error('💥 Error checking wallet profile:', error);
      this.hasWalletProfile = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    (window as any).appComponentRef = null;
  }

  /**
   * Force refresh wallet profile check
   */
  public refreshWalletProfile(): void {
    console.log('🔄 Manual refresh triggered');
    this.checkWalletProfile();
  }

  /**
   * Called when wallet menu is about to open - ensure profile is fresh
   */
  public onWalletMenuOpen(): void {
    console.log('📂 Wallet menu opening - refreshing wallet profile check');
    setTimeout(() => this.checkWalletProfile(), 100);
  }

  /**
   * Called by wallet-profile component when wallet is successfully created
   */
  public notifyWalletProfileCreated(): void {
    console.log('📢 Wallet profile creation notification received');
    this.hasWalletProfile = true;
    setTimeout(() => this.checkWalletProfile(), 500);
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('wallet-menu');

    if (
      route === '/scouter/dashboard' ||
      route === '/talent/dashboard' ||
      route === '/admin/dashboard'
    ) {
      if (!this.authService.validateStoredToken()) {
        await this.router.navigate(['/auth/login']);
        return;
      }

      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          const role = user.role || user.details?.user?.role;

          switch (role) {
            case 'scouter':
              await this.router.navigate(['/scouter/dashboard']);
              break;
            case 'talent':
              await this.router.navigate(['/talent/dashboard']);
              break;
            case 'admin':
              await this.router.navigate(['/admin/dashboard']);
              break;
            default:
              await this.router.navigate(['/auth/login']);
          }
        } catch {
          await this.router.navigate(['/auth/login']);
        }
      } else {
        await this.router.navigate(['/auth/login']);
      }
    } else {
      await this.router.navigate([route]);
    }
  }

  showWalletMenu(): boolean {
    // prefer currentUrl (kept up-to-date in router.events) to avoid false negatives
    const url = this.currentUrl || this.router.url;

    // Check if current URL is a wallet route for any role
    const walletRoutePatterns = ['/scouter/wallet-page', '/talent/wallet-page'];

    const isWalletRoute = walletRoutePatterns.some((pattern) =>
      url.startsWith(pattern),
    );

    const isAuthenticated = this.authService.validateStoredToken();
    if (!isAuthenticated) return false;

    // Only show if user has a valid role and is on a wallet route
    return isWalletRoute && !!this.currentUserRole;
  }

  // Dynamic navigation method
  async navigateToWallet(page: string) {
    await this.menuCtrl.close('wallet-menu');

    // Build route based on user role
    let baseRoute = '';
    switch (this.currentUserRole) {
      case 'scouter':
        baseRoute = '/scouter/wallet-page';
        break;
      case 'talent':
        baseRoute = '/talent/wallet-page';
        break;
      default:
        console.warn('Unknown role for wallet navigation');
        return;
    }

    // Map page to specific route
    const pageRoutes: { [key: string]: string } = {
      dashboard: baseRoute,
      profile: `${baseRoute}/wallet-profile`,
      fund: `${baseRoute}/fund-wallet`,
      withdraw: `${baseRoute}/withdraw-funds`,
      transfer: `${baseRoute}/fund-transfer`,
    };

    const route = pageRoutes[page] || baseRoute;
    await this.router.navigate([route]);
  }

  async navigateToDashboard() {
    await this.menuCtrl.close('wallet-menu');

    if (!this.authService.validateStoredToken()) {
      await this.router.navigate(['/auth/login']);
      return;
    }

    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = user.role || user.details?.user?.role;

        switch (role) {
          case 'scouter':
            await this.router.navigate(['/scouter/dashboard']);
            break;
          case 'talent':
            await this.router.navigate(['/talent/dashboard']);
            break;
          case 'admin':
            await this.router.navigate(['/admin/dashboard']);
            break;
          default:
            await this.router.navigate(['/auth/login']);
        }
      } catch {
        await this.router.navigate(['/auth/login']);
      }
    } else {
      await this.router.navigate(['/auth/login']);
    }
  }
}
