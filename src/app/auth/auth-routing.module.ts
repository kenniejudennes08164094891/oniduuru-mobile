import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AuthPage } from './auth.page';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { SignupSelectComponent } from './signup-select/signup-select.component';


const routes: Routes = [
  {
    path: 'login',
    component: AuthPage
  },
    {
    path: 'welcome-page',
    component: WelcomePageComponent
  },
     {
    path: 'signup-select',
    component: SignupSelectComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthPageRoutingModule {}
