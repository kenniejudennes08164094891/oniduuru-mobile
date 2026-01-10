import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { SignupSelectComponent } from './signup-select/signup-select.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ForgotPasswordVerifyOtpComponent } from './forgot-password-verify-otp/forgot-password-verify-otp.component';
import  { ForgotPasswordPhoneOtpComponent } from './forgot-password-phone-otp/forgot-password-phone-otp.component';
import { ForgotPasswordEmailOtpComponent } from './forgot-password-email-otp/forgot-password-email-otp.component';
import { ForgotPasswordEmailVerifyOtpComponent } from './forgot-password-email-verify-otp/forgot-password-email-verify-otp.component';
import { ForgotPasswordPhoneVerifyOtpComponent } from './forgot-password-phone-verify-otp/forgot-password-phone-verify-otp.component';
import { ForgotPasswordResetComponent } from './forgot-password-reset/forgot-password-reset.component';
import { ForgotPasswordResetSuccessComponent } from './forgot-password-reset-success/forgot-password-reset-success.component';
const routes: Routes = [
  {
    path: 'login',
    component: AuthPage,
  },
  {
    path: 'verify-otp',
    component: VerifyOtpComponent,
  },
{
  path: 'forgot-password/verify-otp',
  component: ForgotPasswordVerifyOtpComponent, 
},
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'forgot-password/verify-otp/email',
    component: ForgotPasswordEmailOtpComponent,
  },
  {
    path: 'forgot-password/verify-otp/email-verify',
    component: ForgotPasswordEmailVerifyOtpComponent,
  },
  {
    path: 'forgot-password/verify-otp/phone',
    component: ForgotPasswordPhoneOtpComponent,
  },
  {
    path: 'forgot-password/verify-otp/phone-verify',
    component: ForgotPasswordPhoneVerifyOtpComponent,
  },
  {
    path: 'forgot-password/reset',
    component: ForgotPasswordResetComponent,
  },
  {
    path: 'forgot-password/reset-success',
    component: ForgotPasswordResetSuccessComponent,
  },
  {
    path: 'welcome-page',
    component: WelcomePageComponent,
  },
  {
    path: 'signup-select',
    component: SignupSelectComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  // schemas: [CUSTOM_ELEMENTS_SCHEMA], // 👈 ADD THIS LINE HERE TOO

  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
