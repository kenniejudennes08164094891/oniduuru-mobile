import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MarketPricePrepositionPage } from './market-price-preposition.page';

const routes: Routes = [
  {
    path: '',
    component: MarketPricePrepositionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketPricePrepositionPageRoutingModule {}
