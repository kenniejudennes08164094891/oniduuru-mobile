import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

// adjust this path to where your header really is
import { TalentHeaderComponent } from '../talent/talent-header/talent-header.component';
import { HiresTableComponent } from './hires-table/hires-table.component';
import { MarketEngagementTabsComponent } from './market-engagement-tabs/market-engagement-tabs.component';
@NgModule({
  declarations: [
    TalentHeaderComponent,
    HiresTableComponent,
    MarketEngagementTabsComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ],
  exports: [
    TalentHeaderComponent,
    HiresTableComponent,
    MarketEngagementTabsComponent
  ]
})
export class SharedModule {}
