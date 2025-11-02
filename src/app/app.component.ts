import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { App as CapacitorApp } from '@capacitor/app';
import { initFlowbite } from 'flowbite';
import {AuthService} from "./services/auth.service";

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
    private authService: AuthService
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
       await this.router.navigate(['/scouter/dashboard']);
      } else {
        // Exit app from main page
       await CapacitorApp.exitApp();
      }
    });
  }

  toggleDarkMode() {
    document.body.classList.remove('dark');
  }

  async navigateAndCloseMenu(route: string) {
    if(route === "/scouter/dashboard"){
      const isScouter = this.authService.decodeScouterDetails()?.scouterId ?? null;
      const isTalent = this.authService.decodeTalentDetails()?.talentId ?? null;
      console.log({isScouter, isTalent});
      await this.menuCtrl.close('scouter-menu');
      await this.router.navigate(
        isScouter?.includes('scouter') ? [route] :
          isTalent?.includes('talent') ? ['/talent/dashboard'] : ['/auth/login']
      );

    }else{
      await this.menuCtrl.close('scouter-menu');
      await this.router.navigate([route]);
    }

  }

}
