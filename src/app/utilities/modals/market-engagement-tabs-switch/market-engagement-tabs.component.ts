import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
} from '@angular/core';
import { Platform } from '@ionic/angular';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
  standalone: false,
})
export class MarketEngagementTabsComponent implements OnInit, OnDestroy {
  @Output() hireSelected = new EventEmitter<MockPayment>();
  @Output() backPressed = new EventEmitter<void>();

  private backButtonListener: any;

  activeTab: 'engagements' | 'stats' = 'engagements';

  // ✅ PROPERLY MANAGE SELECTED HIRE STATE
  selectedHire: MockPayment | undefined;

  // ✅ ACCEPT INITIAL HIRE AND SET IT AS SELECTED
  @Input() 
  set initialHire(hire: MockPayment | undefined) {
    if (hire && !this.selectedHire) {
      this.selectedHire = hire;
    }
  }

  constructor(private platform: Platform) {}

  ngOnInit() {
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

  onHireClick(hire: MockPayment) {
    console.log('🔄 Tabs: Hire selected from table:', hire.name);
    
    // ✅ UPDATE THE SELECTED HIRE
    this.selectedHire = hire;
    
    // ✅ EMIT TO PARENT (MarketPricePreparationComponent)
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