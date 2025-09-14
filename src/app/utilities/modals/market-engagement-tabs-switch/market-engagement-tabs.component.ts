import { Component } from '@angular/core';

@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
})
export class MarketEngagementTabsComponent {
  activeTab: 'engagements' | 'stats' = 'engagements';

  setTab(tab: 'engagements' | 'stats') {
    this.activeTab = tab;
  }
}
