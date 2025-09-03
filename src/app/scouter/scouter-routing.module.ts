import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ScouterPage } from './scouter.page';

const routes: Routes = [
  {
    path: 'create-account',
    component: ScouterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ScouterPageRoutingModule {}
