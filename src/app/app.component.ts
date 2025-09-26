import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { initFlowbite } from 'flowbite';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(
    private menuCtrl: MenuController,
    private router: Router,
    private platform: Platform
  ) {
    document.body.classList.remove('dark');
  }

  ngOnInit(): void {
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
        this.router.navigate(['/scouter/dashboard']);
      } else {
        // Exit app from main page
        CapacitorApp.exitApp();
      }
    });
  }

  toggleDarkMode() {
    document.body.classList.remove('dark');
  }

  async navigateAndCloseMenu(route: string) {
    await this.menuCtrl.close('scouter-menu');
    this.router.navigate([route]);
  }
}
