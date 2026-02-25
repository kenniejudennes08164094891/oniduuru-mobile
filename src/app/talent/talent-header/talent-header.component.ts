// talent-header.component.ts - Complete updated version
import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { PopoverController, MenuController, IonIcon } from '@ionic/angular';
import { ProfilePopupSettingsModalComponent } from 'src/app/utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopoverComponent } from 'src/app/utilities/modals/notifications-popover.component/notifications-popover.component';
import { Router } from '@angular/router';
import { AvatarSettingsPopoverComponent } from 'src/app/shared/modals/avatar-settings-popover/avatar-settings-popover.component';
import { EmmittersService } from '../../services/emmitters.service';
import { firstValueFrom, Observable } from 'rxjs';
import { EndpointService } from '../../services/endpoint.service';

@Component({
  selector: 'app-talent-header',
  templateUrl: './talent-header.component.html',
  styleUrls: ['./talent-header.component.scss'],
  standalone: false,
})
export class TalentHeaderComponent implements OnInit {
  @Input() role: 'talent' | 'scouter' = 'talent';
  @Input() headerHidden: boolean = false;
  images = imageIcons;
  notificationCount = 21;

  constructor(
    private popoverCtrl: PopoverController,
    protected router: Router,
    private emmitterService: EmmittersService,
    private endpointService: EndpointService,
    private menuCtrl: MenuController,
  ) {}

  // Check if we're on a wallet page
  get isWalletPage(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.includes('/wallet-page');
  }

  // Add this method to open the shared wallet menu
  async openMenu() {
   await this.menuCtrl.enable(true, 'wallet-menu');
   await this.menuCtrl.open('wallet-menu');
  }

  // Add this method to close the menu
  async closeMenu() {
    await this.menuCtrl.close('wallet-menu');
  }

  async openSettingsPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: AvatarSettingsPopoverComponent,
      event: ev,
      translucent: true,
    });
    await popover.present();
  }

  async openNotificationPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: NotificationsPopoverComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
  }

  // Add profile popover method (optional)
  async openProfilePopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: ProfilePopupSettingsModalComponent,
      event: ev,
      side: 'bottom',
      translucent: true,
    });
    await popover.present();
  }

  async getUpdatedProfilePicture(): Promise<any> {
    const pictureFromLogin = localStorage.getItem('profilePicture');
    const updatedPicture = await firstValueFrom(
      this.emmitterService.getProfilePicture(),
    );
    this.images.ProfileIcon =
      updatedPicture ?? pictureFromLogin ?? this.images.ProfileIcon;
  }

  fetchProfilePicture(): void {
    this.images.ProfileIcon =
      localStorage.getItem('profilePicture') ?? this.images.ProfileIcon;
    const fetchSession =
      localStorage.getItem('user_data') ||
      localStorage.getItem('user_profile_data');
    const userData = fetchSession ? JSON.parse(fetchSession) : {};
    const uniqueId =
      userData?.role === 'scouter' ? userData?.scouterId : userData?.talentId;

    const request$: Observable<any> =
      userData?.role === 'scouter'
        ? this.endpointService.getScouterPicture(uniqueId)
        : this.endpointService.getTalentPicture(uniqueId);

    request$.subscribe({
      next: async (res) => {
        if (res?.data?.base64Picture) {
          localStorage.setItem('profilePicture', res.data.base64Picture);
          await this.getUpdatedProfilePicture();
        }
      },
      error: (err) => {
        console.error('Error fetching profile picture:', err);
      },
      complete: () => {
        console.log('Fetch completed');
      },
    });
  }

  ngOnInit() {
    this.fetchProfilePicture();
  }

  routeBack(){
    window.history.go(-1);
  }
}
