import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScouterPage } from './scouter.page';
import { ScouterDashboardComponent } from './scouter-dashboard/scouter-dashboard.component';
// import { ViewTalentsLocationPageComponent } from './view-talents-location-page/view-talents-location-page.component';
import { AuthRedirectGuard } from '../guard/auth.guard';

const routes: Routes = [
  {
    path: 'create-account',
    component: ScouterPage,
  },
  {
    path: 'dashboard',
    // canActivate: [AuthRedirectGuard],
    component: ScouterDashboardComponent,
  },
  //   {
  //   path: '',
  //   component: ViewTalentsLocationPageComponent,
  // },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScouterPageRoutingModule {}
