import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthPageRoutingModule } from './auth-routing.module';
import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    WelcomePageComponent,
    MatToolbarModule,
    ReactiveFormsModule,
  ],
  declarations: [AuthPage, VerifyOtpComponent, ForgotPasswordComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // 👈 THIS MAKES ANGULAR ACCEPT <ion-*> TAGS
})
export class AuthPageModule {}
