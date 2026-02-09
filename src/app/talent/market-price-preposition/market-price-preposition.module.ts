import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EvaluationPageModule } from 'src/app/components/evaluation-page/evaluation-page.module';
import { RouterModule } from '@angular/router';

import { MarketPricePrepositionPageRoutingModule } from './market-price-preposition-routing.module';
import { MarketPricePrepositionPage } from './market-price-preposition.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { UtilitiesPageModule } from '../../utilities/utilities.module';
import { StatsComponent } from './stats/stats.component';
// import { EngagementsComponent } from './engagements/engagements.component';
import { NgChartsModule } from 'ng2-charts';
import { HiresTableComponent } from 'src/app/shared/hires-table/hires-table.component';
import { AcceptOrRejectComponent } from './accept-or-reject/accept-or-reject.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MarketPricePrepositionPageRoutingModule,
    SharedModule,
    UtilitiesPageModule,
    NgChartsModule,
    EvaluationPageModule,
    RouterModule.forChild([
      {
        path: '',
        component: MarketPricePrepositionPage,
      },
    ]),
    AcceptOrRejectComponent, // Make sure it's declared here
  ],
  declarations: [
    MarketPricePrepositionPage,
    StatsComponent,
    HiresTableComponent,
  ],
  providers: [],
})
export class MarketPricePrepositionPageModule {}
