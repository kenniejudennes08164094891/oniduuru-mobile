import {
  Component,
  EventEmitter,
  Output,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ToastController, LoadingController } from '@ionic/angular';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import {
  MarketEngagement,
  MarketEngagementResponse,
} from 'src/app/models/mocks';
import { FormsModule } from '@angular/forms'; // For ngModel in filters

// Add to your module imports
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-market-engagements-table',
  templateUrl: './market-engagements-table.component.html',
  styleUrls: ['./market-engagements-table.component.scss'],
  standalone: false,
})
export class MarketEngagementsTableComponent implements OnInit, OnDestroy {
  // Replace mock data with API data
  marketEngagements: MarketEngagement[] = [];
  paginatedHires: MarketEngagement[] = [];

  currentPage: number = 1;
  pageSize: number = 10; // Match API default
  totalItems: number = 0;
  totalPages: number = 0;

  selectedHire: MarketEngagement | null = null;
  isModalOpen: boolean = false;

  // Filter properties
  statusFilter: string = '';
  talentIdFilter: string = '';

  private subscriptions: Subscription = new Subscription();

  @Output() hireSelected = new EventEmitter();

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
    private scouterService: ScouterEndpointsService
  ) {}

  async ngOnInit() {
    await this.loadMarketEngagements();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadMarketEngagements() {
    const loading = await this.loadingController.create({
      message: 'Loading market engagements...',
    });
    await loading.present();

    try {
      // Get scouterId from your auth service or storage
      const scouterId = this.getScouterId(); // Implement this method

      if (!scouterId) {
        throw new Error('Scouter ID not found');
      }

      const params = {
        statusParams: this.statusFilter || undefined,
        talentId: this.talentIdFilter || undefined,
        limit: this.pageSize,
        pageNo: this.currentPage,
      };

      this.subscriptions.add(
        this.scouterService
          .getAllMarketsByScouter(scouterId, params)
          .subscribe({
            next: (response: MarketEngagementResponse) => {
              this.marketEngagements = response.data || [];
              this.totalItems = response.total || 0;
              this.totalPages = response.totalPages || 1;
              this.paginatedHires = this.marketEngagements;

              loading.dismiss();
            },
            error: async (error) => {
              console.error('Error loading market engagements:', error);
              loading.dismiss();

              const toast = await this.toastController.create({
                message: 'Failed to load market engagements',
                duration: 3000,
                position: 'bottom',
                color: 'danger',
              });
              await toast.present();
            },
          })
      );
    } catch (error) {
      loading.dismiss();
      console.error('Error in loadMarketEngagements:', error);
    }
  }

  // Helper method to get scouter ID (implement based on your auth system)
  private getScouterId(): string {
    // Example: Get from localStorage, auth service, etc.
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      return user.id || user.scouterId;
    }
    return '';
  }

  // Filter methods
  applyFilters() {
    this.currentPage = 1;
    this.loadMarketEngagements();
  }

  clearFilters() {
    this.statusFilter = '';
    this.talentIdFilter = '';
    this.currentPage = 1;
    this.loadMarketEngagements();
  }

  // Pagination methods
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMarketEngagements();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMarketEngagements();
    }
  }

  // Update modal opening to use API data structure
  async openHireModal(hire: MarketEngagement) {
    // Map API status to your component's expected status
    const mappedStatus = this.mapApiStatusToComponent(hire.hireStatus);

    // 👉 Always update dashboard first
    this.hireSelected.emit(hire);

    // 👉 Then run modal conditions
    if (mappedStatus !== 'Offer Accepted') {
      const toast = await this.toastController.create({
        message: `${mappedStatus}`,
        duration: 2500,
        position: 'bottom',
        color: 'success',
      });
      await toast.present();
      return;
    }

    // Note: You might need to adjust this condition based on your API data
    const yourRating = (hire as any).yourRating ?? 0;
    if (!yourRating || yourRating <= 0) {
      const toast = await this.toastController.create({
        message: `⭐ No rating provided yet. Set your own rating ↑ `,
        duration: 2500,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    // ✅ Passed → open modal
    this.selectedHire = hire;
    this.isModalOpen = true;
  }

  closeModal() {
    this.selectedHire = null;
    this.isModalOpen = false;
  }

  dismiss(sEvent: any) {
    if (sEvent === 'close' || sEvent === 'backdrop') {
      this.closeModal();
    }
  }

  // Helper method to map API status to component status
  public mapApiStatusToComponent(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-accepted': 'Offer Accepted',
      'offer-declined': 'Offer Rejected',
    };

    return statusMap[apiStatus] || apiStatus;
  }

  // Format amount (keep your existing method)
  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  // Update status color to use API status
  getStatusColor(offerStatus: string): string {
    const status = offerStatus.toLowerCase();

    switch (status) {
      case 'offer accepted':
      case 'offer-accepted':
        return '#189537'; // green dot
      case 'awaiting acceptance':
      case 'awaiting-acceptance':
        return '#FFA500'; // orange dot
      case 'offer rejected':
      case 'offer-declined':
        return '#CC0000'; // red dot
      default:
        return '#79797B'; // gray dot
    }
  }
}

// import { Component, EventEmitter, Output } from '@angular/core';
// import { MockRecentHires } from 'src/app/models/mocks';
// import { ToastController } from '@ionic/angular';

// @Component({
//   selector: 'app-market-engagements-table',
//   templateUrl: './market-engagements-table.component.html',
//   styleUrls: ['./market-engagements-table.component.scss'],
//   standalone: false,
// })
// export class MarketEngagementsTableComponent {
//   hires = MockRecentHires;
//   currentPage: number = 1;
//   pageSize: number = 7;

//   selectedHire: any = null;
//   isModalOpen: boolean = false;

//   @Output() hireSelected = new EventEmitter();

//   constructor(private toastController: ToastController) {}

//   async openHireModal(hire: any) {
//     // 👉 Always update dashboard first
//     this.hireSelected.emit(hire);

//     // 👉 Then run modal conditions
//     if (hire.offerStatus !== 'Offer Accepted') {
//       const toast = await this.toastController.create({
//         message: `${hire.offerStatus}`,
//         duration: 2500,
//         position: 'bottom',
//         color: 'success',
//       });
//       await toast.present();
//       return;
//     }

//     if (!hire.yourRating || hire.yourRating <= 0) {
//       const toast = await this.toastController.create({
//         message: `⭐ No rating provided yet. Set your own rating ↑ `,
//         duration: 2500,
//         position: 'bottom',
//         color: 'warning',
//       });
//       await toast.present();
//       return;
//     }

//     // ✅ Passed → open modal
//     this.selectedHire = hire;
//     this.isModalOpen = true;
//   }

//   closeModal() {
//     this.selectedHire = null;
//     this.isModalOpen = false;
//   }

//   dismiss(sEvent: any) {
//     if (sEvent === 'close' || sEvent === 'backdrop') {
//       this.closeModal();
//     }
//   }
//   // ✅ Use hires directly for now (later you can plug in search/filter)
//   get filteredAndSearchedHires() {
//     return this.hires;
//   }

//   get totalPages(): number {
//     return Math.ceil(this.filteredAndSearchedHires.length / this.pageSize);
//   }

//   get paginatedHires() {
//     const start = (this.currentPage - 1) * this.pageSize;
//     return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
//   }

//   nextPage() {
//     if (this.currentPage < this.totalPages) this.currentPage++;
//   }

//   prevPage() {
//     if (this.currentPage > 1) this.currentPage--;
//   }

//   getFormattedAmount(amount: number): string {
//     return amount.toLocaleString('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//     });
//   }

//   getStatusColor(offerStatus: string): string {
//     switch (offerStatus) {
//       case 'Offer Accepted':
//         return '#189537'; // green dot
//       case 'Awaiting Acceptance':
//         return '#FFA500'; // orange dot
//       case 'Offer Rejected':
//         return '#CC0000'; // red dot
//       default:
//         return '#79797B'; // gray dot
//     }
//   }
// }
