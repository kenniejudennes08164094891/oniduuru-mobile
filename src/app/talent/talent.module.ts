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
@NgModule({
  declarations: [TalentPage,TalentDashboardComponent,TalentHeaderComponent,  ProfilePageComponent ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TalentPageRoutingModule,
    UtilitiesPageModule,
    SpinnerComponent
  ],
})
export class TalentPageModule { }

