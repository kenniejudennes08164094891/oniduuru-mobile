import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MarketPricePrepositionPageRoutingModule } from './market-price-preposition-routing.module';

import { MarketPricePrepositionPage } from './market-price-preposition.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MarketPricePrepositionPageRoutingModule,
    SharedModule
  ],
  declarations: [MarketPricePrepositionPage]
})
export class MarketPricePrepositionPageModule {}
