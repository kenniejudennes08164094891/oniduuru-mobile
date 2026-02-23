// app.component.ts
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
import { EndpointService } from './services/endpoint.service';
import { WalletEventsService } from './services/wallet-events.service';
import { PaymentService } from './services/payment.service';

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
    private endpointService: EndpointService,
    private walletEvents: WalletEventsService,
    private paymentService: PaymentService,
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
        if (!this.showWalletMenu()) {
          this.menuCtrl.close('scouter-menu');
        }
      }
    });

    this.getUserRole();

    // Check wallet profile whenever user logs in or payment status changes
    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        setTimeout(() => {
          this.appInitService.onUserLogin();
          this.checkWalletProfileFromUserData();
        }, 1000);
      } else {
        this.hasWalletProfile = false;
      }
    });

    // Also check when payment status changes (since wallet might be created after payment)
    this.paymentService.paymentStatus$.subscribe((status) => {
      console.log('💰 Payment status changed in AppComponent:', status);
      if (status.status === 'true') {
        // If user is paid, re-check wallet profile (they might have created it)
        this.checkWalletProfileFromUserData();
      }
    });

    // Check wallet profile on init if user is already logged in
    const isAuthenticated = this.authService.validateStoredToken();
    if (isAuthenticated) {
      this.checkWalletProfileFromUserData();
    }

    (window as any).appComponentRef = this;

    // Listen for wallet profile events
    this.walletEvents.walletProfileCreated$.subscribe(() => {
      console.log('🎯 Received wallet profile created event');
      this.hasWalletProfile = true;
      // Also update user_data
      this.updateUserDataWithWalletFlag(true);
    });
  }

  ngAfterViewInit() {
    const menu = document.querySelector('ion-menu[menuId="wallet-menu"]');
    if (menu && this.currentUserRole) {
      menu.setAttribute('data-role', this.currentUserRole);
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
    }
  }

  /**
   * Check wallet profile status from user_data
   */
  private checkWalletProfileFromUserData(): void {
    try {
      const userData = localStorage.getItem('user_data');
      console.log('🔍 Checking wallet profile in user_data:', userData);
      
      if (!userData) {
        this.hasWalletProfile = false;
        return;
      }
      
      const parsed = JSON.parse(userData);
      
      // Method 1: Check completeOnboarding JSON string
      if (parsed.completeOnboarding) {
        try {
          const onboarding = JSON.parse(parsed.completeOnboarding);
          console.log('📦 Parsed completeOnboarding:', onboarding);
          
          if (onboarding.hasWalletProfile === true) {
            this.hasWalletProfile = true;
            console.log('✅ Wallet profile found in completeOnboarding');
            return;
          }
        } catch (parseError) {
          console.error('Error parsing completeOnboarding:', parseError);
        }
      }
      
      // Method 2: Check direct hasWalletProfile property
      if (parsed.hasWalletProfile !== undefined) {
        this.hasWalletProfile = parsed.hasWalletProfile === true;
        console.log('💰 Wallet profile from direct property:', this.hasWalletProfile);
        return;
      }
      
      // Method 3: Check wallet identifiers
      if (parsed.walletId || parsed.walletAccountNumber) {
        this.hasWalletProfile = true;
        console.log('💰 Wallet profile from wallet identifiers');
        return;
      }
      
      // Default to false
      this.hasWalletProfile = false;
      console.log('💰 No wallet profile found in user data');
      
    } catch (error) {
      console.error('Error checking wallet profile:', error);
      this.hasWalletProfile = false;
    }
  }

  /**
   * Update user_data with wallet profile flag
   */
  private updateUserDataWithWalletFlag(hasWallet: boolean): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        
        // Update completeOnboarding if it exists
        if (parsed.completeOnboarding) {
          try {
            const onboarding = JSON.parse(parsed.completeOnboarding);
            onboarding.hasWalletProfile = hasWallet;
            parsed.completeOnboarding = JSON.stringify(onboarding);
          } catch (e) {
            console.warn('Could not update completeOnboarding:', e);
          }
        }
        
        // Also set direct property
        parsed.hasWalletProfile = hasWallet;
        
        localStorage.setItem('user_data', JSON.stringify(parsed));
        console.log('✅ Updated user_data with wallet profile flag:', hasWallet);
      }
    } catch (error) {
      console.error('Error updating user_data with wallet flag:', error);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    (window as any).appComponentRef = null;
  }

  /**
   * Clear wallet cache and recheck
   */
  public refreshWalletProfile(): void {
    this.checkWalletProfileFromUserData();
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