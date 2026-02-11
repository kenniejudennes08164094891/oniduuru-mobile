import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Platform } from '@ionic/angular';
import { TotalHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
  standalone: false,
})
export class MarketEngagementTabsComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Output() hireSelected = new EventEmitter<TotalHires>();
  @Output() backPressed = new EventEmitter<void>();

  private backButtonListener: any;
  activeTab: 'engagements' | 'stats' = 'engagements';
  selectedHire: TotalHires | undefined;

  // Add this to prevent loops
  private isUpdatingFromParent: boolean = false;

  @Input() initialHire: TotalHires | undefined;

  constructor(private platform: Platform) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialHire'] && changes['initialHire'].currentValue) {
      const newHire = changes['initialHire'].currentValue;
      console.log('🔄 Tabs: initialHire changed to:', newHire.name);

      // Flag that we're updating from parent
      this.isUpdatingFromParent = true;

      // Always update selectedHire when initialHire changes
      this.selectedHire = newHire;

      // If we're on the stats tab, make sure it shows the correct hire
      if (this.activeTab === 'stats') {
        console.log('📊 Stats tab will update with new hire:', newHire.name);

        // Create a copy without modal flags for stats tab ONLY
        const hireWithoutModal = {
          ...newHire,
          shouldOpenModal: false,
          preventModalOpen: true,
          isStatsUpdate: true, // Add flag to identify this is just a stats update
        };

        // Only emit for stats tab, not for engagements tab
        this.hireSelected.emit(hireWithoutModal);
      }

      // Reset flag after a delay
      setTimeout(() => {
        this.isUpdatingFromParent = false;
      }, 100);
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
      },
    );
  }

  ngOnDestroy() {
    if (this.backButtonListener) {
      this.backButtonListener.unsubscribe();
    }
  }

  setTab(tab: 'engagements' | 'stats') {
    // ✅ PREVENT MODAL OPENING WHEN SWITCHING TABS
    this.activeTab = tab;

    // When switching to stats tab, emit the selected hire WITHOUT opening modals
    if (tab === 'stats' && this.selectedHire) {
      console.log('📊 Switching to stats tab - NO MODAL OPENING');
      // Create a copy without modal flags
      const hireWithoutModal = {
        ...this.selectedHire,
        shouldOpenModal: false,
        preventModalOpen: true,
        isStatsUpdate: true, // Add this flag
      };
      this.hireSelected.emit(hireWithoutModal);
    }
  }

  onHireClick(hire: TotalHires) {
    console.log('🔄 Tabs: Hire selected from table:', hire.name);

    // Don't emit if we're updating from parent
    if (this.isUpdatingFromParent) {
      console.log('⏸️ Skipping emit - updating from parent');
      return;
    }

    // ✅ Check if this is a stats tab navigation - DON'T OPEN MODALS
    const isStatsNavigation =
      hire.preventModalOpen || this.activeTab === 'stats';

    if (isStatsNavigation) {
      console.log('📊 Stats navigation - NOT opening modal');
      // Just update selected hire without modal flags
      const cleanHire = { ...hire };
      delete cleanHire.shouldOpenModal;
      delete cleanHire.modalType;
      this.selectedHire = cleanHire;
      this.hireSelected.emit(cleanHire);
      return;
    }

    // Update the selected hire
    this.selectedHire = hire;

    // Emit to parent - will open modals ONLY for engagements tab
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
