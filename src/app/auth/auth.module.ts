import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthPageRoutingModule } from './auth-routing.module';
import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { SignupSelectComponent } from './signup-select/signup-select.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    WelcomePageComponent,
    // SignupSelectComponent
  ],
  declarations: [AuthPage]
})
export class AuthPageModule {}
