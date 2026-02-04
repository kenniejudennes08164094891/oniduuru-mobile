import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EvaluationPageModule } from 'src/app/components/evaluation-page/evaluation-page.module';

import { MarketPricePrepositionPageRoutingModule } from './market-price-preposition-routing.module';
import { MarketPricePrepositionPage } from './market-price-preposition.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { UtilitiesPageModule } from '../../utilities/utilities.module';
import { StatsComponent } from './stats/stats.component';
import { EngagementsComponent } from './engagements/engagements.component';
import { NgChartsModule } from 'ng2-charts';
import {EvaluationPageComponent} from "../../components/evaluation-page/evaluation-page.component";


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MarketPricePrepositionPageRoutingModule,
    SharedModule  ,
    UtilitiesPageModule,
    NgChartsModule,
    EvaluationPageModule
  ],
  declarations: [
    MarketPricePrepositionPage, StatsComponent, EngagementsComponent
  ],
  providers: [EvaluationPageComponent ]

})
export class MarketPricePrepositionPageModule {}
