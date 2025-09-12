import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScouterPageRoutingModule } from './scouter-routing.module';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
import { TalentPageModule } from '../talent/talent.module';
import { ScouterHeaderComponent } from './scouter-header/scouter-header.component';
import { ProfilePopupSettingsModalComponent } from '../utilities/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from '../utilities/modals/notifications-popup-modal/notifications-popup-modal.component';
import { LogComplaintsPopupModalComponent } from '../utilities/modals/log-complaints-popup-modal/log-complaints-popup-modal.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { AccountActivationPageComponent } from './account-activation-page/account-activation-page.component';
import { UploadScreenshotPopupModalComponent } from '../utilities/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { UpdateProfileConfirmationPopupModalComponent } from '../utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';
import { ViewAllHiresPageComponent } from './view-all-hires-page/view-all-hires-page.component';
import { HireTalentPageComponent } from './hire-talent-page/hire-talent-page.component';
import { WalletPageComponent } from './wallet-page/wallet-page.component';
import { WalletHeaderComponent } from './wallet-header/wallet-header.component';
import { WalletMenuComponent } from '../utilities/modals/wallet-menu/wallet-menu.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScouterPageRoutingModule,
    TalentPageModule,
  ],
  declarations: [
    ScouterPage,
    ScouterHeaderComponent,
    ScouterDashboardComponent,
    ProfilePopupSettingsModalComponent,
    NotificationsPopupModalComponent,
    LogComplaintsPopupModalComponent,
    ProfilePageComponent,
    AccountActivationPageComponent,
    UploadScreenshotPopupModalComponent,
    UpdateProfileConfirmationPopupModalComponent,
    ViewAllHiresPageComponent,
    HireTalentPageComponent,
    WalletPageComponent,
    WalletHeaderComponent,
    WalletMenuComponent,
  ],
})
export class ScouterPageModule {}
