import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
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
export class AppComponent implements OnInit {
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform,
    private authService: AuthService,
    private userService: UserService,
    private appInitService: AppInitService
  ) {
    document.body.classList.remove('dark');
  }

  ngOnInit(): void {
    // Initialize app data
    this.appInitService.initializeApp();

    this.userService.initializeProfileImage();

    initFlowbite();
    document.body.classList.remove('dark');

    // 1️⃣ Close menu on browser back/forward navigation
    this.router.events.subscribe(async (event) => {
      if (event instanceof NavigationStart) {
        const isOpen = await this.menuCtrl.isOpen('scouter-menu');
        if (isOpen) {
          await this.menuCtrl.close('scouter-menu');
        }
      }
    });

    // 2️⃣ Handle hardware back button on devices
    this.platform.backButton.subscribeWithPriority(9999, async () => {
      const isMenuOpen = await this.menuCtrl.isOpen('scouter-menu');
      if (isMenuOpen) {
        // Close menu first
        await this.menuCtrl.close('scouter-menu');
      } else if (this.router.url !== '/scouter/dashboard') {
        // Navigate back to main dashboard
        await this.router.navigate(['/scouter/dashboard']);
      } else {
        // Exit app from main page
        await CapacitorApp.exitApp();
      }
    });

    // ✅ NEW: Listen for login events to re-initialize app data
    this.authService.userLoggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        setTimeout(() => {
          this.appInitService.onUserLogin();
        }, 1000); // Give time for data to be stored
      }
    });
  }

  toggleDarkMode() {
    document.body.classList.remove('dark');
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('scouter-menu');

    if (route === '/scouter/dashboard') {
      // ✅ Use the enhanced token validation
      if (!this.authService.validateStoredToken()) {
        await this.router.navigate(['/auth/login']);
        return;
      }

      // ✅ Get role from stored user data
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
              console.warn('⚠️ Unknown role, redirecting to login');
              await this.router.navigate(['/auth/login']);
          }
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
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
