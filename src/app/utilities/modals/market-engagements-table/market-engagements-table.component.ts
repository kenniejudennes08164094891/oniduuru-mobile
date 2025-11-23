import { Component, EventEmitter, Output } from '@angular/core';
import { MockRecentHires } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-market-engagements-table',
  templateUrl: './market-engagements-table.component.html',
  styleUrls: ['./market-engagements-table.component.scss'],
  standalone: false,
})
export class MarketEngagementsTableComponent {
  hires: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10; //FIX: Maximum allowed by API

  selectedHire: any = null;
  isModalOpen: boolean = false;

  @Output() hireSelected = new EventEmitter();

  constructor(
    private toastService: ToastsService,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadMarketEngagements();
  }

  loadMarketEngagements() {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      return;
    }

    // 🚨 PRODUCTION: Uncomment this block and comment the mock data block below
    // this.scouterService
    //   .getAllMarketsByScouter(scouterId, {
    //     limit: 10,
    //     pageNo: 1,
    //   })
    //   .subscribe({
    //     next: (response) => {
    //       this.hires = response.data || [];
    //     },
    //     error: (error) => {
    //       console.error('❌ Error loading market engagements:', error);
    //       this.hires = [];
    //       // 🚨 DEVELOPMENT: Fallback to mock data when API fails
    //       this.loadMockData();
    //     },
    //   });

    // 🚨 DEVELOPMENT: Comment this block in production
    this.loadMockData();
  }

  // 🚨 DEVELOPMENT: Add this method for mock data
  private loadMockData() {
    this.hires = MockRecentHires.map((hire) => ({
      ...hire,
      jobDescription: hire.jobDescription ?? '',
      yourComment: hire.yourComment ?? '',
      yourRating: hire.yourRating ?? 0,
      talentComment: hire.talentComment ?? '',
      talentRating: hire.talentRating ?? 0,
    }));
  }

  async openHireModal(hire: any) {
    this.hireSelected.emit(hire);

    if (hire.offerStatus !== 'Offer Accepted') {
      this.toastService.openSnackBar(`${hire.offerStatus}`, 'success');
      return;
    }

    if (!hire.yourRating || hire.yourRating <= 0) {
      this.toastService.openSnackBar(
        `⭐ No rating provided yet. Set your own rating ↑`,
        'warning'
      );
      return;
    }

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
  // ✅ Use hires directly for now (later you can plug in search/filter)
  get filteredAndSearchedHires() {
    return this.hires;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSearchedHires.length / this.pageSize);
  }

  get paginatedHires() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  // Add this method to MarketEngagementsTableComponent
  onRatingUpdated(updateData: { hireId: string; rating: number }) {
    // Update the local hires array with the new rating
    const hireIndex = this.hires.findIndex((h) => h.id === updateData.hireId);
    if (hireIndex !== -1) {
      this.hires[hireIndex].yourRating = updateData.rating;
    }

    // If the selected hire is open in modal, update it too
    if (this.selectedHire?.id === updateData.hireId) {
      this.selectedHire.yourRating = updateData.rating;
    }
  }

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getStatusColor(offerStatus: string): string {
    switch (offerStatus) {
      case 'Offer Accepted':
        return '#189537'; // green dot
      case 'Awaiting Acceptance':
        return '#FFA500'; // orange dot
      case 'Offer Rejected':
        return '#CC0000'; // red dot
      default:
        return '#79797B'; // gray dot
    }
  }
}
