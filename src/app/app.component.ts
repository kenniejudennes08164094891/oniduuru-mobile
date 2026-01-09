import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router, NavigationStart } from '@angular/router';

import {
  MenuController,
  Platform,
  // IonApp,
  // IonMenu,
  // IonHeader,
  // IonToolbar,
  // IonTitle,
  // IonContent,
  // IonList,
  // IonItem,
  // IonLabel,
  // IonRouterOutlet,
} from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { initFlowbite } from 'flowbite';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AppInitService } from './services/app-init.service';

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
    private appInitService: AppInitService
  ) // private ionApp: IonApp,
  // private ionMenu: IonMenu,
  // private ionHeader: IonHeader,
  // private ionToolbar: IonToolbar,
  // private ionTitle: IonTitle,
  // private ionContent: IonContent,
  // private ionList: IonList,
  // private ionItem: IonItem,
  // private ionLabel: IonLabel,
  // private ionRouterOutlet: IonRouterOutlet
  {
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

    this.platform.backButton.subscribeWithPriority(9999, async () => {
      const isMenuOpen = await this.menuCtrl.isOpen('scouter-menu');
      if (isMenuOpen) {
        await this.menuCtrl.close('scouter-menu');
      } else if (this.router.url !== '/scouter/dashboard') {
        await this.router.navigate(['/scouter/dashboard']);
      } else {
        await CapacitorApp.exitApp();
      }
    });

    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        setTimeout(() => {
          this.appInitService.onUserLogin();
        }, 1000);
      }
    });

    // Initialize wallet profile visibility from stored user (if any)
    try {
      const stored = localStorage.getItem('user_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.hasWalletProfile = !!parsed.hasWalletProfile;
      }
    } catch (e) {
      console.warn('Could not parse stored user data for wallet visibility', e);
      this.hasWalletProfile = false;
    }

    // React to user changes (e.g., login, profile updates)
    this.subscriptions.add(
      this.authService.currentUser$.subscribe((user) => {
        this.hasWalletProfile = !!(user && user.hasWalletProfile);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleDarkMode() {
    document.body.classList.remove('dark');
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('scouhttp://localhost:4200/ter-menu');

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
}
