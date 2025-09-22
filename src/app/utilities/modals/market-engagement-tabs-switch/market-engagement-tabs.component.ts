import { Component, EventEmitter, Output } from '@angular/core';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
  standalone: false,
})
export class MarketEngagementTabsComponent {
  @Output() hireSelected = new EventEmitter<MockPayment>(); // strongly typed event

  activeTab: 'engagements' | 'stats' = 'engagements';

  // mock data (replace with real API later)
  hires: MockPayment[] = MockRecentHires;

  setTab(tab: 'engagements' | 'stats') {
    this.activeTab = tab;
  }

  onHireClick(hire: MockPayment) {
    this.hireSelected.emit(hire);
  }
}
