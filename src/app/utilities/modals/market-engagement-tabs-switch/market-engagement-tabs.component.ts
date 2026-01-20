import { Component, EventEmitter, Output, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Platform } from '@ionic/angular';
import { TotalHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
  standalone: false,
})
export class MarketEngagementTabsComponent implements OnInit, OnDestroy, OnChanges {
  @Output() hireSelected = new EventEmitter<TotalHires>();
  @Output() backPressed = new EventEmitter<void>();

  private backButtonListener: any;
  activeTab: 'engagements' | 'stats' = 'engagements';
  selectedHire: TotalHires | undefined;

  @Input() initialHire: TotalHires | undefined;

  constructor(private platform: Platform) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialHire'] && changes['initialHire'].currentValue) {
      const newHire = changes['initialHire'].currentValue;
      console.log('🔄 Tabs: initialHire changed to:', newHire.name);
      
      // Always update selectedHire when initialHire changes
      this.selectedHire = newHire;
      
      // If we're on the stats tab, make sure it shows the correct hire
      if (this.activeTab === 'stats') {
        console.log('📊 Stats tab will update with new hire:', newHire.name);
      }
    }
  }

  ngOnInit() {
    // Initialize with the initial hire if provided
    if (this.initialHire) {
      this.selectedHire = this.initialHire;
      console.log('🎯 Tabs: Initial hire set to:', this.selectedHire.name);
    }
    
    this.backButtonListener = this.platform.backButton.subscribeWithPriority(
      10,
      () => {
        this.onBackPress();
      }
    );
  }

  ngOnDestroy() {
    if (this.backButtonListener) {
      this.backButtonListener.unsubscribe();
    }
  }

  setTab(tab: 'engagements' | 'stats') {
    this.activeTab = tab;
  }

  onHireClick(hire: TotalHires) {
    console.log('🔄 Tabs: Hire selected from table:', hire.name);

    // Update the selected hire
    this.selectedHire = hire;

    // Emit to parent (MarketPricePreparationComponent)
    this.hireSelected.emit(hire);
  }

  private onBackPress() {
    if (this.activeTab === 'stats') {
      this.activeTab = 'engagements';
    } else {
      this.backPressed.emit();
    }
  }
}