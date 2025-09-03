import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { MaterialModule } from '../shared/material-module';
import { WelcomePageComponent } from "../auth/welcome-page/welcome-page.component";



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    MaterialModule,
    WelcomePageComponent
],
  declarations: [HomePage]
})
export class HomePageModule {}
