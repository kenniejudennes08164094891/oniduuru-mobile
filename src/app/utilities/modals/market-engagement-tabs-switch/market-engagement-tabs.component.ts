import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
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
  @Output() backPressed = new EventEmitter<void>(); // ✅ emits when back button is used

  private backButtonListener: any;

  activeTab: 'engagements' | 'stats' = 'engagements';

  // mock data (replace with real API later)
  hires: MockPayment[] = MockRecentHires;

  constructor(private platform: Platform) {}

  ngOnInit() {
    // ✅ Listen to device back button
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
    this.hireSelected.emit(hire);
  }

  private onBackPress() {
    // you can decide what happens: switch tab, close modal, or emit event
    if (this.activeTab === 'stats') {
      this.activeTab = 'engagements'; // go back to engagements tab
    } else {
      this.backPressed.emit(); // parent can decide to close/dismiss
    }
  }
}
