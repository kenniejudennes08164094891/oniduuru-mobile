import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TalentPage } from './talent.page';
import { LoginCredentialsComponent } from './onboarding/login-credentials/login-credentials.component';
import { OtherDetailsComponent } from './onboarding/other-details/other-details.component';
import { TalentDetailsComponent } from './onboarding/talent-details/talent-details.component';
import { VerifyCredentialsComponent } from './onboarding/verify-credentials/verify-credentials.component';


const routes: Routes = [
  {
    path: 'create-account',
    component: TalentPage,
    children: [
      { path: '', redirectTo: 'talent-details', pathMatch: 'full' }, // default tab
      { path: 'talent-details', component: TalentDetailsComponent },
      { path: 'talent-other-details', component: OtherDetailsComponent },
      { path: 'talent-login-credentials', component: LoginCredentialsComponent },
      { path: 'talent-verify-credentials', component: VerifyCredentialsComponent },
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TalentPageRoutingModule { }
