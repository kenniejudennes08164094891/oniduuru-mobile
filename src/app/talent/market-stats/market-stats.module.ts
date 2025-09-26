import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MarketStatsPageRoutingModule } from './market-stats-routing.module';

import { MarketStatsPage } from './market-stats.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MarketStatsPageRoutingModule,
    SharedModule
  ],
  declarations: [MarketStatsPage]
})
export class MarketStatsPageModule {}
