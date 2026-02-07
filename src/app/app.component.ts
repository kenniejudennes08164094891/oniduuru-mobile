import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { initFlowbite } from 'flowbite';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AppInitService } from './services/app-init.service';
import { EndpointService } from './services/endpoint.service'; // Add this import
import { WalletEventsService } from './services/wallet-events.service';

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

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private userService: UserService,
    private appInitService: AppInitService,
    private endpointService: EndpointService, // Inject endpoint service
    private walletEvents: WalletEventsService,
  ) {
    document.body.classList.remove('dark');
  }

  ngOnInit(): void {
    this.appInitService.initializeApp();
    this.userService.initializeProfileImage();
    initFlowbite();
    document.body.classList.remove('dark');

    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        const isOpen = await this.menuCtrl.isOpen('scouter-menu');
        if (isOpen) {
          await this.menuCtrl.close('scouter-menu');
        }
      }
    });

    // Watch for route changes to update menu visibility
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Close menu when navigating away from wallet pages
        if (!this.showWalletMenu()) {
          this.menuCtrl.close('scouter-menu');
        }
      }
    });

    this.getUserRole();

    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        setTimeout(() => {
          this.appInitService.onUserLogin();
          this.checkWalletProfile(); // Check wallet when user logs in
        }, 1000);
      } else {
        this.hasWalletProfile = false; // Reset when logged out
      }
    });

    // Check wallet profile on init if user is already logged in
    const isAuthenticated = this.authService.validateStoredToken();
    if (isAuthenticated) {
      this.checkWalletProfile();
    }

    (window as any).appComponentRef = this;

    // Listen for wallet profile events
    this.walletEvents.walletProfileCreated$.subscribe(() => {
      console.log('🎯 Received wallet profile created event');
      this.hasWalletProfile = true;
    });

    // Initial check
    this.checkWalletProfileSimplified();
  }

  ngAfterViewInit() {
    // Set role attribute on menu for CSS targeting
    const menu = document.querySelector('ion-menu[menuId="wallet-menu"]');
    if (menu && this.currentUserRole) {
      menu.setAttribute('data-role', this.currentUserRole);
    }
  }

  // Helper method to get user role
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
    }
  }

  /**
   * SIMPLIFIED: Check if wallet profile exists based on localStorage flag
   */
  private checkWalletProfileSimplified(): void {
    console.log('🔍 Checking wallet profile...');

    // FIRST: Check localStorage flag
    const walletProfileCreated =
      localStorage.getItem('walletProfileCreated') === 'true';

    if (walletProfileCreated) {
      console.log('✅ Found walletProfileCreated in localStorage');
      this.hasWalletProfile = true;
      return;
    }

    // Check if hasWalletProfile is set in localStorage
    const hasWalletProfileLocal =
      localStorage.getItem('hasWalletProfile') === 'true';
    if (hasWalletProfileLocal) {
      console.log('✅ Found hasWalletProfile in localStorage');
      this.hasWalletProfile = true;
      return;
    }

    // SECOND: Check user data - IMPORTANT: Check INSIDE completeOnboarding JSON string
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log('🔍 Parsed user data:', user);

        // Check direct property first
        if (user.hasWalletProfile === true) {
          console.log('✅ Found hasWalletProfile as direct property');
          this.hasWalletProfile = true;
          return;
        }

        // Check inside completeOnboarding JSON string
        if (user.completeOnboarding) {
          try {
            const onboardingData = JSON.parse(user.completeOnboarding);
            console.log('🔍 Parsed completeOnboarding:', onboardingData);

            if (onboardingData.hasWalletProfile === true) {
              console.log(
                '✅ Found hasWalletProfile inside completeOnboarding',
              );
              this.hasWalletProfile = true;

              // Store for future quick access
              localStorage.setItem('hasWalletProfile', 'true');
              return;
            }
          } catch (parseError) {
            console.warn('Could not parse completeOnboarding:', parseError);
          }
        }

        // Check if wallet exists in user object (maybe from previous versions)
        if (user.walletId || user.walletAccountNumber) {
          console.log('✅ Found wallet identifiers in user data');
          this.hasWalletProfile = true;
          localStorage.setItem('hasWalletProfile', 'true');
          return;
        }
      } catch (e) {
        console.warn('Error parsing user data:', e);
      }
    }

    // THIRD: Check via API if no local flags found
    console.log('🔍 No local wallet flags found, checking via API...');
    this.checkWalletProfileViaAPI();
  }

  /**
   * Enhanced API check with better logging
   */
  private checkWalletProfileViaAPI(): void {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      this.hasWalletProfile = false;
      return;
    }

    try {
      const user = JSON.parse(userData);
      const uniqueId = user.uniqueId || user.id;

      console.log('🔍 Checking wallet via API with uniqueId:', uniqueId);

      if (uniqueId) {
        this.endpointService.fetchMyWallet(null, uniqueId).subscribe({
          next: (response) => {
            console.log('🔍 Wallet API response:', response);

            // Simple check: does response contain wallet data?
            const hasWallet =
              response &&
              !response.walletNotFound &&
              response.data !== undefined;

            console.log('🔍 API indicates wallet exists:', hasWallet);
            this.hasWalletProfile = hasWallet;

            // Store result for future use
            if (hasWallet) {
              localStorage.setItem('walletProfileCreated', 'true');
              localStorage.setItem('hasWalletProfile', 'true');

              // Update user data
              if (user) {
                try {
                  // Update completeOnboarding if it exists
                  if (user.completeOnboarding) {
                    const onboardingData = JSON.parse(user.completeOnboarding);
                    onboardingData.hasWalletProfile = true;
                    user.completeOnboarding = JSON.stringify(onboardingData);
                  } else {
                    user.hasWalletProfile = true;
                  }
                  localStorage.setItem('user_data', JSON.stringify(user));
                  console.log('✅ Updated user_data with wallet profile flag');
                } catch (e) {
                  console.warn('Could not update user_data:', e);
                }
              }
            }
          },
          error: (error) => {
            console.error('❌ API check error:', error);
            this.hasWalletProfile = false;
          },
        });
      } else {
        console.warn('❌ No uniqueId found for API check');
        this.hasWalletProfile = false;
      }
    } catch (e) {
      console.error('❌ Error in API check:', e);
      this.hasWalletProfile = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    (window as any).appComponentRef = null;
  }

  /**
   * Check if user has a wallet profile
   */
  private checkWalletProfile(): void {
    const userData = localStorage.getItem('user_data');
    if (!userData) {
      this.hasWalletProfile = false;
      return;
    }

    try {
      const user = JSON.parse(userData);
      const uniqueId = user.uniqueId || user.id;

      if (uniqueId) {
        // Check if user already has wallet profile flag
        if (user.hasWalletProfile === true) {
          this.hasWalletProfile = true;
          return;
        }

        // Make API call to check wallet
        this.subscriptions.add(
          this.endpointService.fetchMyWallet(null, uniqueId).subscribe({
            next: (response) => {
              // Check if wallet exists
              const hasWallet =
                !response.walletNotFound &&
                response.data &&
                !response.message?.includes('not created');

              this.hasWalletProfile = hasWallet;

              // Update user data with wallet status
              if (hasWallet && user) {
                user.hasWalletProfile = true;
                localStorage.setItem('user_data', JSON.stringify(user));
              }
            },
            error: (error) => {
              console.error('Error checking wallet profile:', error);
              this.hasWalletProfile = false;
            },
          }),
        );
      }
    } catch (e) {
      console.warn('Error parsing user data:', e);
      this.hasWalletProfile = false;
    }
  }

  /**
   * Clear wallet cache and recheck
   */
  public refreshWalletProfile(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const uniqueId = user.uniqueId || user.id;
        if (uniqueId) {
          localStorage.removeItem(`wallet_${uniqueId}`);
          this.checkWalletProfile();
        }
      } catch (e) {
        console.warn('Error refreshing wallet profile:', e);
      }
    }
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('wallet-menu');

    if (route === '/scouter/dashboard') {
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
    const currentUrl = this.router.url;

    // Check if current URL is a wallet route for any role
    const walletRoutePatterns = ['/scouter/wallet-page', '/talent/wallet-page'];

    const isWalletRoute = walletRoutePatterns.some((pattern) =>
      currentUrl.startsWith(pattern),
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
