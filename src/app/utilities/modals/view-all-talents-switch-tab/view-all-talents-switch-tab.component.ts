import { Component, EventEmitter, Input } from '@angular/core';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

type TabKey = 'skillSet' | 'reelsAndDocumentation' | 'recentReviews';

@Component({
  selector: 'app-view-all-talents-switch-tab',
  templateUrl: './view-all-talents-switch-tab.component.html',
  styleUrls: ['./view-all-talents-switch-tab.component.scss'],
})
export class ViewAllTalentsSwitchTabComponent {
  // @Output() hireSelected = new EventEmitter<MockPayment>();
  @Input() hire: any; // <-- hire comes from the table row click

  activeTab: TabKey = 'skillSet';
  hires: MockPayment[] = MockRecentHires;
  selectedHire: MockPayment | null = null;

  tabs = [
    { key: 'skillSet' as TabKey, label: 'Skill Set' },
    { key: 'reelsAndDocumentation' as TabKey, label: 'Reels & Documentation' },
    { key: 'recentReviews' as TabKey, label: 'Recent Reviews' },
  ];

  setTab(tab: TabKey) {
    this.activeTab = tab;
  }

  // onHireClick(hire: MockPayment) {
  //   this.selectedHire = hire; // set clicked hire
  // }
}
