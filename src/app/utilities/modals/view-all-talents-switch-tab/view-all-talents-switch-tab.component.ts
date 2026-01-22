// view-all-talents-switch-tab.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

type TabKey = 'skillSet' | 'reelsAndDocumentation' | 'recentReviews';

@Component({
  selector: 'app-view-all-talents-switch-tab',
  templateUrl: './view-all-talents-switch-tab.component.html',
  styleUrls: ['./view-all-talents-switch-tab.component.scss'],
  standalone: false,
})
export class ViewAllTalentsSwitchTabComponent {
  @Input() hire: any;
  @Input() selectedSkills: any[] = [];
  @Input() marketProfile: any; // Add market profile input
  @Input() skillSet: any[] = []; // Add skill set from API
  @Input() marketReviews: any[] = []; // Add reviews from API
  @Input() pictorialDocumentations: any[] = []; // Add documentation from API
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

  activeTab: TabKey = 'skillSet';

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
    this.skillSelectionChanged.emit(skills);
  }
}