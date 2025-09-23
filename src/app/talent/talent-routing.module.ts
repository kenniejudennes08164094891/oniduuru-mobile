import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TalentPage } from './talent.page';
import { LoginCredentialsComponent } from './onboarding/login-credentials/login-credentials.component';
import { OtherDetailsComponent } from './onboarding/other-details/other-details.component';
import { TalentDetailsComponent } from './onboarding/talent-details/talent-details.component';
import { VerifyCredentialsComponent } from './onboarding/verify-credentials/verify-credentials.component';
import { TalentDashboardComponent } from "./talent-dashboard/talent-dashboard.component";
import { LogComplaintsPopupModalComponent } from 'src/app/utilities/modals/log-complaints-popup-modal/log-complaints-popup-modal.component';

// Update the import path below to the correct location of TalentProfilePageComponent
// Example: If the file is actually at './profile-page/profile-page.component'
import { ProfilePageComponent } from "./profile-page/profile-page.component";
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
  {
    path: 'dashboard',
    component: TalentDashboardComponent
  },
  {
    path: 'profile-page',
    component: ProfilePageComponent
  },
  {
    path: 'view-hires',
    loadChildren: () => import('./view-hires/view-hires.module').then(m => m.ViewHiresPageModule)
  },
  { path: 'profile-page', component: ProfilePageComponent },
  { path: 'log-complaint', component: LogComplaintsPopupModalComponent } // 👈 route to modal component
 


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TalentPageRoutingModule { }
