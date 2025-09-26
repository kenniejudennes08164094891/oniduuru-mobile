import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { MarketPricePrepositionPageRoutingModule } from './market-price-preposition-routing.module';
import { MarketPricePrepositionPage } from './market-price-preposition.page';

// ✅ Correct import path (adjust if yours is nested differently)

import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MarketPricePrepositionPageRoutingModule,
    SharedModule   // ✅ keep this (it's an NgModule)
  ],
  declarations: [
    MarketPricePrepositionPage,]

})
export class MarketPricePrepositionPageModule {}
