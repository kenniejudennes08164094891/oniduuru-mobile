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
import { ForgotPasswordVerifyOtpComponent } from './forgot-password-verify-otp/forgot-password-verify-otp.component';
import { LoginComponent } from './login/login.component';
import { ForgotPasswordEmailOtpComponent } from './forgot-password-email-otp/forgot-password-email-otp.component';
import { ForgotPasswordPhoneOtpComponent } from './forgot-password-phone-otp/forgot-password-phone-otp.component';
import { ForgotPasswordEmailVerifyOtpComponent } from './forgot-password-email-verify-otp/forgot-password-email-verify-otp.component';
import { ForgotPasswordPhoneVerifyOtpComponent } from './forgot-password-phone-verify-otp/forgot-password-phone-verify-otp.component';
import { ForgotPasswordResetComponent } from './forgot-password-reset/forgot-password-reset.component';
import { ForgotPasswordResetSuccessComponent } from './forgot-password-reset-success/forgot-password-reset-success.component';
import {SpinnerComponent} from "../utilities/spinner/spinner.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AuthPageRoutingModule,
    WelcomePageComponent,
    MatToolbarModule,
    ReactiveFormsModule,
    SpinnerComponent,
  ],
  declarations: [AuthPage, LoginComponent, VerifyOtpComponent, ForgotPasswordComponent, ForgotPasswordVerifyOtpComponent, ForgotPasswordEmailOtpComponent, ForgotPasswordPhoneOtpComponent, ForgotPasswordEmailVerifyOtpComponent, ForgotPasswordPhoneVerifyOtpComponent, ForgotPasswordResetComponent, ForgotPasswordResetSuccessComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], //  THIS MAKES ANGULAR ACCEPT <ion-*> TAGS
})
export class AuthPageModule {}
