import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { MockRecentHires } from 'src/app/models/mocks';
import { ModalController, ToastController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ReconsiderConfirmationModalComponent } from '../reconsider-confirmation-modal/reconsider-confirmation-modal.component';
import { ReconsiderOfferModalComponent } from '../reconsider-offer-modal/reconsider-offer-modal.component';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-market-engagements-table',
  templateUrl: './market-engagements-table.component.html',
  styleUrls: ['./market-engagements-table.component.scss'],
  standalone: false,
})
export class MarketEngagementsTableComponent implements OnInit {
  hires: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  selectedHire: any = null;

  // Modal states
  isModalOpen: boolean = false; // For Total Delivery Modal
  isReconsiderModalOpen: boolean = false;
  isReconsiderOfferModalOpen: boolean = false;
  selectedTalentForReconsider: any = null;

  private isProcessingClick: boolean = false;
  private currentRouteTalentId: string | null = null;

  @Output() hireSelected = new EventEmitter<any>();

  constructor(
    private toastService: ToastsService,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMarketEngagements();
    this.subscribeToRouteChanges();
  }

  private subscribeToRouteChanges() {
    this.route.parent?.paramMap.subscribe((params) => {
      this.currentRouteTalentId = params.get('id');
      console.log('Current route talent ID:', this.currentRouteTalentId);
    });
  }

  loadMarketEngagements() {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.loadMockData();
      return;
    }

    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        limit: 10,
        pageNo: 1,
      })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response);

          if (
            response?.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            console.log('✅ API returned data, count:', response.data.length);
            this.hires = response.data;
            this.checkForRejectedOfferOnDataLoad();
          } else {
            console.warn('⚠️ API returned empty data, using mock data');
            this.loadMockData();
          }
        },
        error: (error) => {
          console.error('❌ Error loading market engagements:', error);
          this.loadMockData();
          this.toastService.openSnackBar(
            'Using demo data. Please check your connection.',
            'warning'
          );
        },
      });
  }

  private loadMockData() {
    console.log('📊 Loading mock data...');

    if (
      !MockRecentHires ||
      !Array.isArray(MockRecentHires) ||
      MockRecentHires.length === 0
    ) {
      console.error('❌ MockRecentHires is empty or undefined');
      this.hires = [];
      return;
    }

    this.hires = MockRecentHires.map((hire) => ({
      ...hire,
      id: hire.id || Math.random().toString(),
      jobDescription: hire.jobDescription ?? 'No description available',
      yourComment: hire.yourComment ?? '',
      yourRating: hire.yourRating ?? 0,
      talentComment: hire.talentComment ?? '',
      talentRating: hire.talentRating ?? 0,
      offerStatus: hire.offerStatus || 'Awaiting Acceptance',
      status: hire.status || 'Pending',
    }));

    console.log('✅ Mock data loaded, count:', this.hires.length);
  }

  async openHireModal(hire: any) {
    if (this.isProcessingClick) {
      return;
    }

    this.isProcessingClick = true;

    try {
      this.selectedHire = hire;
      this.hireSelected.emit(hire);

      // Check if we're already on this talent's detail page
      const isSameTalent = this.currentRouteTalentId === hire.id;

      console.log(
        `Opening modal for ${hire.name}, Status: ${hire.offerStatus}, Same talent: ${isSameTalent}`
      );

      if (hire.offerStatus === 'Offer Rejected') {
        // For rejected offers, open reconsider modal
        this.selectedTalentForReconsider = hire;
        this.isReconsiderModalOpen = true;
      } else if (hire.offerStatus === 'Offer Accepted') {
        // For accepted offers
        if (isSameTalent) {
          // Already on talent detail page - open modal directly
          if (!hire.yourRating || hire.yourRating <= 0) {
            this.toastService.openSnackBar(
              `⭐ No rating provided yet. Set your own rating ↑`,
              'warning'
            );
          }
          this.isModalOpen = true;
        } else {
          // Navigate to talent detail page for total delivery modal
          const navigationExtras: NavigationExtras = {
            state: {
              shouldOpenModal: true,
              modalType: 'total-delivery',
              hireData: hire,
            },
          };

          this.router.navigate(
            ['/scouter/market-engagement-market-price-preparation', hire.id],
            navigationExtras
          );
        }
      } else if (hire.offerStatus === 'Awaiting Acceptance') {
        // For awaiting acceptance - show info toast and navigate
        this.toastService.openSnackBar(
          `This offer is ${hire.offerStatus}. Waiting for talent's response.`,
          'warning'
        );

        if (!isSameTalent) {
          this.router.navigate([
            '/scouter/market-engagement-market-price-preparation',
            hire.id,
          ]);
        }
      } else {
        // For other statuses
        this.toastService.openSnackBar(`${hire.offerStatus}`, 'warning');
      }
    } finally {
      setTimeout(() => {
        this.isProcessingClick = false;
      }, 500);
    }
  }

  onReconsiderConfirmed() {
    console.log('Reconsider confirmed from table');

    // Close confirmation modal first
    this.isReconsiderModalOpen = false;

    // Then open the offer form modal
    setTimeout(() => {
      this.isReconsiderOfferModalOpen = true;
      console.log(
        'Offer form modal should now be open:',
        this.isReconsiderOfferModalOpen
      );
    }, 50);
  }

  onReconsiderCancelled() {
    this.isReconsiderModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  onReconsiderSubmitted(offerData: any) {
    console.log('Reconsidered offer submitted from table:', offerData);

    // Update the local hire data
    const index = this.hires.findIndex((h) => h.id === offerData.talentId);
    if (index !== -1) {
      this.hires[index] = {
        ...this.hires[index],
        amount: offerData.amount,
        jobDescription: offerData.jobDescription,
        startDate: offerData.startDate,
        offerStatus: 'Awaiting Acceptance',
        status: 'Pending',
      };
    }

    // Show success message
    this.toastService.openSnackBar(
      `Revised offer sent to ${offerData.talentName}. Status updated to "Awaiting Acceptance".`,
      'success'
    );

    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;

    // Make API call
    this.reconsiderOfferAPI(offerData);
  }

  private reconsiderOfferAPI(offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId || !this.selectedTalentForReconsider) return;

    // Prepare payload
    const payload = {
      hireStatus: 'awaiting-acceptance',
      amountToPay: offerData.amount.toString(),
      jobDescription: offerData.jobDescription,
      startDate: this.formatDate(new Date(offerData.startDate)),
      dateOfHire: this.formatDate(new Date()),
      satisFactoryCommentByScouter: JSON.stringify({
        scouterId: scouterId,
        dateOfComment: this.formatDate(new Date()),
        remark: '(Proposal Reconsidered)',
        rating: 0,
      }),
    };

    // Get the marketHireId
    const marketHireId =
      this.selectedTalentForReconsider.marketHireId ||
      this.selectedTalentForReconsider.id;

    // Call the service
    this.scouterService
      .toggleMarketOffer(payload, {
        talentId: offerData.talentId,
        scouterId: scouterId,
        marketHireId: marketHireId,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Offer reconsidered successfully:', response);
        },
        error: (error) => {
          console.error('❌ Failed to reconsider offer:', error);
          this.toastService.openSnackBar(
            error?.error?.message || 'Failed to reconsider offer',
            'error'
          );
        },
      });
  }

  // Helper method
  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  }

  closeReconsiderModal() {
    console.log('Closing all reconsider modals in table');
    this.isReconsiderModalOpen = false;
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  private checkForRejectedOfferOnDataLoad() {
    const rejectedHires = this.hires.filter(
      (h) => h.offerStatus === 'Offer Rejected'
    );

    if (rejectedHires.length > 0) {
      console.log('Found rejected offers:', rejectedHires);
    }
  }

  private updateOfferOnBackend(offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) return;

    const payload = {
      scouterId: scouterId,
      talentId: offerData.talentId,
      marketId: offerData.talentId,
      newAmount: offerData.amount,
      newJobDescription: offerData.jobDescription,
      newStartDate: offerData.startDate,
      additionalComments: offerData.comments,
      action: 'reconsider_offer',
    };

    // Call your service method
    // this.scouterService.reconsiderOffer(payload).subscribe({
    //   next: (response) => {
    //     console.log('Offer reconsidered successfully:', response);
    //   },
    //   error: (error) => {
    //     console.error('Failed to reconsider offer:', error);
    //   }
    // });
  }

  // Other existing methods...
  closeModal() {
    this.selectedHire = null;
    this.isModalOpen = false;
  }

  dismiss(sEvent: any) {
    if (sEvent === 'close' || sEvent === 'backdrop') {
      this.closeModal();
    }
  }

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

  onRatingUpdated(updateData: { hireId: string; rating: number }) {
    const hireIndex = this.hires.findIndex((h) => h.id === updateData.hireId);
    if (hireIndex !== -1) {
      this.hires[hireIndex].yourRating = updateData.rating;
    }

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
        return '#189537';
      case 'Awaiting Acceptance':
        return '#FFA500';
      case 'Offer Rejected':
        return '#CC0000';
      default:
        return '#79797B';
    }
  }
}
