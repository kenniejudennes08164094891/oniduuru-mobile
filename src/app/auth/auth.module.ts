import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthPageRoutingModule } from './auth-routing.module';
import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import {MatToolbarModule} from "@angular/material/toolbar";



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    WelcomePageComponent,
    MatToolbarModule,
    ReactiveFormsModule
  ],
  declarations: [AuthPage]
})
export class AuthPageModule {}
