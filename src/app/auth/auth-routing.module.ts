import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { SignupSelectComponent } from './signup-select/signup-select.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';

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
    path: 'forgot-password',
    component: ForgotPasswordComponent,
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
