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
  @Input() marketProfile: any;
  @Input() skillSet: any[] = [];
  @Input() marketReviews: any[] = [];
  @Input() pictorialDocumentations: any[] = [];
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

  activeTab: TabKey = 'skillSet';

  tabs = [
    { 
      key: 'skillSet' as TabKey, 
      label: 'Skill Set',
      count: 0 // Will be populated based on data
    },
    { 
      key: 'reelsAndDocumentation' as TabKey, 
      label: 'Portfolio',
      count: 0 // Will be populated based on data
    },
    { 
      key: 'recentReviews' as TabKey, 
      label: 'Reviews',
      count: 0 // Will be populated based on data
    },
  ];

  ngOnInit() {
    // Update tab counts based on actual data
    this.updateTabCounts();
  }

  ngOnChanges() {
    this.updateTabCounts();
  }

  private updateTabCounts() {
    // Update counts for each tab
    this.tabs[0].count = this.skillSet?.length || 0;
    this.tabs[1].count = this.pictorialDocumentations?.length || 0;
    this.tabs[2].count = this.marketReviews?.length || 0;
  }

  setTab(tab: TabKey) {
    this.activeTab = tab;
  }

  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills;
    this.skillSelectionChanged.emit(skills);
  }

  // Helper to check if tab has content
  hasTabContent(tabKey: TabKey): boolean {
    switch(tabKey) {
      case 'skillSet': return (this.skillSet?.length || 0) > 0;
      case 'reelsAndDocumentation': return (this.pictorialDocumentations?.length || 0) > 0;
      case 'recentReviews': return (this.marketReviews?.length || 0) > 0;
      default: return false;
    }
  }
}