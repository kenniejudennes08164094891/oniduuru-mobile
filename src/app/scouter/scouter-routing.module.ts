import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ScouterPage } from './scouter.page';
import {ScouterDashboardComponent} from "./scouter-dashboard/scouter-dashboard.component";

const routes: Routes = [
  {
    path: 'create-account',
    component: ScouterPage
  },
  {
    path: 'dashboard',
    component: ScouterDashboardComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScouterPageRoutingModule {}
