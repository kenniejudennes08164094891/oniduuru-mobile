import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScouterPageRoutingModule } from './scouter-routing.module';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
import { ScouterHeaderComponent } from './scouter-header/scouter-header.component';
import { ProfilePopupSettingsModalComponent } from '../shared/modals/profile-popup-settings-modal/profile-popup-settings-modal.component';
import { NotificationsPopupModalComponent } from '../shared/modals/notifications-popup-modal/notifications-popup-modal.component';
import { LogComplaintsPopupModalComponent } from '../shared/modals/log-complaints-popup-modal/log-complaints-popup-modal.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { AccountActivationPageComponent } from './account-activation-page/account-activation-page.component';
import { UploadScreenshotPopupModalComponent } from '../shared/modals/upload-screenshot-popup-modal/upload-screenshot-popup-modal.component';
import { UtilitiesPageModule } from '../utilities/utilities.module';
import { SpinnerComponent } from '../utilities/spinner/spinner.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScouterPageRoutingModule,
    UtilitiesPageModule,
    SpinnerComponent
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

  ],
})
export class ScouterPageModule { }
