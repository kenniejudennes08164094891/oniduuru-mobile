import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MarketPricePrepositionPage } from './market-price-preposition.page';
import { StatsComponent } from './stats/stats.component';
import { EngagementsComponent } from './engagements/engagements.component';

const routes: Routes = [
  {
    path: '',
    component: MarketPricePrepositionPage,
    children: [
      {
         path: '', redirectTo: 'engagements', pathMatch: 'full'
      },
      {
        path: 'engagements', component: EngagementsComponent
      },
      {
        path: 'stats', component: StatsComponent
      }
     
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MarketPricePrepositionPageRoutingModule {}
