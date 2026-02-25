// app.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {firstValueFrom, Subscription} from 'rxjs';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { initFlowbite } from 'flowbite';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AppInitService } from './services/app-init.service';
import { EndpointService } from './services/endpoint.service';
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

  walletMenuItems:any[] = [
    {
      label: 'Wallet Dashboard',
      action: () => this.navigateToWallet('dashboard'),
      show: () => true
    },
    {
      label: 'Wallet Profile',
      action: () => this.navigateToWallet('profile'),
      show: () => !this.hasWalletProfile
    },
    {
      label: 'Fund Wallet',
      action: () => this.navigateToWallet('fund'),
      show: () => true
    },
    {
      label: 'Withdraw to Bank',
      action: () => this.navigateToWallet('withdraw'),
      show: () => true
    },
    {
      label: 'Funds Transfer',
      action: () => this.navigateToWallet('transfer'),
      show: () => true
    },
    {
      label: 'Dashboard',
      action: () => this.navigateToDashboard(),
      show: () => true
    }
  ];


  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private userService: UserService,
    private appInitService: AppInitService,
    private walletService: EndpointService,
    private walletEvents: WalletEventsService,
  ) {
    document.body.classList.remove('dark');
  }

 async ngOnInit(): Promise<any> {
    this.userService.initializeProfileImage();
    initFlowbite();
    document.body.classList.remove('dark');

    // Handle menu closing on navigation
    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        const isOpen = await this.menuCtrl.isOpen('wallet-menu');
        if (isOpen) {
          await this.menuCtrl.close('wallet-menu');
        }
      }
    });

    this.getUserRole();

    // Listen for login events
    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        setTimeout(async () => {
         await this.appInitService.onUserLogin();
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

    // Listen for wallet profile creation events
    this.walletEvents.walletProfileCreated$.subscribe(() => {
      console.log('🎯 Received wallet profile created event');
      this.hasWalletProfile = true;
      // Optionally refresh the check to ensure everything is synced
      setTimeout(() => this.checkWalletProfile(), 500);
    });
  await this.appInitService.initializeApp();
  await this.handleWalletAuthorization();
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
   * Check wallet profile status from user_data only (no API calls)
   */
  private checkWalletProfile(): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (!userData) {
        this.hasWalletProfile = false;
        return;
      }

      const user = JSON.parse(userData);
      console.log('🔍 Checking wallet profile for role:', this.currentUserRole);

      // Method 1: Check completeOnboarding JSON string (primary source)
      if (user.completeOnboarding) {
        try {
          const onboardingData = JSON.parse(user.completeOnboarding);
          console.log('🔍 Parsed completeOnboarding:', onboardingData);

          if (onboardingData.hasWalletProfile === true) {
            console.log('✅ Found hasWalletProfile in completeOnboarding');
            this.hasWalletProfile = true;
            return;
          }
        } catch (parseError) {
          console.warn('Could not parse completeOnboarding:', parseError);
        }
      }

      // Method 2: Check direct hasWalletProfile property
      if (user.hasWalletProfile !== undefined) {
        this.hasWalletProfile = user.hasWalletProfile === true;
        console.log('💰 Wallet profile from direct property:', this.hasWalletProfile);
        return;
      }

      // Method 3: Check wallet identifiers
      if (user.walletId || user.walletAccountNumber) {
        console.log('✅ Found wallet identifiers in user data');
        this.hasWalletProfile = true;
        return;
      }

      // No wallet profile found
      this.hasWalletProfile = false;
      console.log('❌ No wallet profile found for user');

    } catch (error) {
      console.error('Error checking wallet profile:', error);
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
    this.checkWalletProfile();
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('wallet-menu');

    if (route === '/scouter/dashboard' || route === '/talent/dashboard' || route === '/admin/dashboard') {
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

  get filteredWalletMenuItems() {
    return this.walletMenuItems.filter(item => item.show());
  }

  async handleWalletAuthorization():Promise<void>{
    try{
      const userDetails:any = localStorage.getItem('user_data');
      const role = userDetails ? JSON.parse(userDetails)?.role : null;
      if(role === "scouter" || role === "talent"){
        const userWallet = await firstValueFrom(this.walletService.fetchMyWallet(
          undefined,
          role === 'talent' ? userDetails?.talentId : role === 'scouter' ? userDetails?.scouterId : null
        ));

        // console.clear();
        // console.log("siuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu", role)
        // console.log("userWallet>>",userWallet);

        if(userWallet?.data?.status === 'active'){
          this.walletMenuItems = this.walletMenuItems.filter((item:any) => item?.label?.toLowerCase() !== 'wallet profile');
        }else if(userWallet?.data?.status === 'awaiting_approval'){
          this.walletMenuItems = this.walletMenuItems.filter((item:any) =>
            item?.label?.toLowerCase() !== 'wallet profile' &&
            item?.label?.toLowerCase() !== 'fund wallet' &&
            item?.label?.toLowerCase() !== 'withdraw to bank' &&
            item?.label?.toLowerCase() !== 'funds transfer'
          );
        }else{
          this.walletMenuItems = this.walletMenuItems.filter((item:any) =>
            item?.label?.toLowerCase() !== 'fund wallet' &&
            item?.label?.toLowerCase() !== 'withdraw to bank' &&
            item?.label?.toLowerCase() !== 'funds transfer'
          );
        }
      }
    }catch (err:any) {
      console.error("error from handling wallets authorization>>", err);
      if(err?.error?.message === 'Wallet not found' || err?.error?.statusCode === 404){
        console.clear();
        this.walletMenuItems = this.walletMenuItems.filter((item:any) =>
          item?.label?.toLowerCase() !== 'fund wallet' &&
          item?.label?.toLowerCase() !== 'withdraw to bank' &&
          item?.label?.toLowerCase() !== 'funds transfer'
        );
      }
    }
  }

}
