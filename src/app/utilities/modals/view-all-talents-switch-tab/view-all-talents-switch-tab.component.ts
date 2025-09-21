import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

type TabKey = 'skillSet' | 'reelsAndDocumentation' | 'recentReviews';

@Component({
  selector: 'app-view-all-talents-switch-tab',
  templateUrl: './view-all-talents-switch-tab.component.html',
  styleUrls: ['./view-all-talents-switch-tab.component.scss'],
})
export class ViewAllTalentsSwitchTabComponent {
  @Input() hire: any;
  @Input() selectedSkills: any[] = [];            // ✅ receive from modal
  @Output() skillSelectionChanged = new EventEmitter<any[]>(); 

  activeTab: TabKey = 'skillSet';
  hires: MockPayment[] = MockRecentHires;

  tabs = [
    { key: 'skillSet' as TabKey, label: 'Skill Set' },
    { key: 'reelsAndDocumentation' as TabKey, label: 'Reels & Documentation' },
    { key: 'recentReviews' as TabKey, label: 'Recent Reviews' },
  ];

  setTab(tab: TabKey) {
    this.activeTab = tab;
  }

  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills;
    this.skillSelectionChanged.emit(skills);      // ✅ bubble up to modal
  }
}
