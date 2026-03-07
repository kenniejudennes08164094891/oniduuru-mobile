import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
// import { ViewTalentsLocationPageComponent } from './view-talents-location-page/view-talents-location-page.component';
import { AuthRedirectGuard } from '../guard/auth.guard';

const routes: Routes = [
  // default entry for the scouter segment should forward guests to the
  // signup flow; once logged in the guard on the top‑level patch will take
  // the user to the dashboard instead.
  { path: '', redirectTo: 'create-account', pathMatch: 'full' },
  {
    path: 'create-account',
    component: ScouterPage,
  },
  {
    path: 'dashboard',
    // canActivate: [AuthRedirectGuard],
    component: ScouterDashboardComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScouterPageRoutingModule {}
