import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { initFlowbite } from 'flowbite';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AppInitService } from './services/app-init.service';
import { EndpointService } from './services/endpoint.service'; // Add this import

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  hasWalletProfile = false;
  private subscriptions = new Subscription();

  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private userService: UserService,
    private appInitService: AppInitService,
    private endpointService: EndpointService // Inject endpoint service
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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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
        // First check localStorage cache
        const cachedWallet = localStorage.getItem(`wallet_${uniqueId}`);
        if (cachedWallet) {
          const walletData = JSON.parse(cachedWallet);
          this.hasWalletProfile = !walletData.walletNotFound;
        } else {
          // Make API call to check wallet
          this.subscriptions.add(
            this.endpointService.fetchMyWallet(null, uniqueId).subscribe({
              next: (response) => {
                // Cache the response
                localStorage.setItem(`wallet_${uniqueId}`, JSON.stringify(response));

                // Check if wallet exists
                this.hasWalletProfile = !response.walletNotFound &&
                  response.data &&
                  !response.message?.includes('not created');
              },
              error: (error) => {
                console.error('Error checking wallet profile:', error);
                this.hasWalletProfile = false;
              }
            })
          );
        }
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

  toggleDarkMode() {
    document.body.classList.remove('dark');
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('scouter-menu');

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

    // Only show wallet menu on these routes
    const walletRoutes = [
      '/scouter/wallet-page',
      '/scouter/wallet-page/wallet-profile',
      '/scouter/wallet-page/fund-wallet',
      '/scouter/wallet-page/withdraw-funds',
      '/scouter/wallet-page/fund-transfer'
    ];

    // Also check if user is authenticated and is a scouter
    const isAuthenticated = this.authService.validateStoredToken();
    if (!isAuthenticated) return false;

    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const role = user.role || user.details?.user?.role;
        if (role !== 'scouter') return false;
      } catch {
        return false;
      }
    }

    return walletRoutes.some(route => currentUrl.startsWith(route));
  }
}