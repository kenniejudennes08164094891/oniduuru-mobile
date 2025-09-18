import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TalentPageRoutingModule } from './talent-routing.module';
import { TalentPage } from './talent.page';
import { UtilitiesPageModule } from '../utilities/utilities.module';
import { TalentDashboardComponent } from './talent-dashboard/talent-dashboard.component';
import { TalentHeaderComponent } from './talent-header/talent-header.component';
import { SpinnerComponent } from '../utilities/spinner/spinner.component';
import { ProfilePageComponent } from './profile-page/profile-page.component';
import { SharedModule } from '../shared/shared.module';
import { AvatarSettingsPopoverComponent } from '../shared/modals/avatar-settings-popover/avatar-settings-popover.component';
@NgModule({
  declarations: [TalentPage,TalentDashboardComponent,ProfilePageComponent,AvatarSettingsPopoverComponent ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TalentPageRoutingModule,
    UtilitiesPageModule,
    SpinnerComponent,
    SharedModule
  ],exports: [
    TalentHeaderComponent,
    AvatarSettingsPopoverComponent  // optional: if you want to reuse elsewhere
  ]
})
export class TalentPageModule { }

