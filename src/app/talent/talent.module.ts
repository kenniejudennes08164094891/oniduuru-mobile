import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TalentPageRoutingModule } from './talent-routing.module';
import { TalentPage } from './talent.page';
import {TalentDashboardComponent} from "./talent-dashboard/talent-dashboard.component";
import {SpinnerComponent} from "../utilities/spinner/spinner.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TalentPageRoutingModule
  ],
  exports: [
    SpinnerComponent
  ],
  declarations: [
    TalentPage, TalentDashboardComponent, SpinnerComponent
  ]
})
export class TalentPageModule { }
