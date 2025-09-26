import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MarketStatsPage } from './market-stats.page';

const routes: Routes = [
  {
    path: '',
    component: MarketStatsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketStatsPageRoutingModule {}
