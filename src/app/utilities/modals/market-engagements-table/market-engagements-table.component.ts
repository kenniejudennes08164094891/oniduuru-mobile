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
    private router: Router,
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

  private checkIfTalentHasBeenRated(hire: any): boolean {
    // Check if scouter has already submitted a rating for this talent
    const hasRating = hire.yourRating && hire.yourRating > 0;
    const hasComment = hire.yourComment && hire.yourComment.trim() !== '';

    // Also check the satisFactoryCommentByScouter field
    let hasAPIComment = false;
    if (hire.satisFactoryCommentByScouter) {
      try {
        const comment = JSON.parse(hire.satisFactoryCommentByScouter);
        hasAPIComment = comment.rating > 0 || comment.remark?.trim() !== '';
      } catch (e) {
        // If it's not JSON, check if it's a non-empty string
        hasAPIComment = hire.satisFactoryCommentByScouter.trim() !== '';
      }
    }

    const hasBeenRated = hasRating || hasComment || hasAPIComment;

    console.log('Table: Checking if talent has been rated:', {
      hireName: hire.name,
      hasRating,
      hasComment,
      hasAPIComment,
      hasBeenRated,
    });

    return hasBeenRated;
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
          console.log('📊 API Response (RAW):', response);

          if (response?.data && Array.isArray(response.data)) {
            console.log('📊 First item details:', response.data[0]);
            console.log('📊 Available fields:', Object.keys(response.data[0]));

            this.hires = response.data.map((item: any) => ({
              // Log each item to see what IDs are available
              ...item,
              _debug: {
                hasMarketHireId: !!item.marketHireId,
                hasTalentIdWithDate: !!item.talentIdWithDate,
                hasMarketId: !!item.marketId,
                hasTalentId: !!item.talentId,
                hasId: !!item.id,
              },
            }));

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
            'warning',
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

      // CRITICAL: Always emit to parent components first
      this.hireSelected.emit(hire);

      console.log(
        `Opening modal for ${hire.name}, Status: ${hire.offerStatus}`,
      );

      // ✅ ADD TOAST FOR AWAITING ACCEPTANCE STATUS
      if (hire.offerStatus === 'Awaiting Acceptance') {
        this.toastService.openSnackBar(
          `Offer is awaiting acceptance from ${hire.name}. Check back later for updates.`,
          'warning',
        );
        return;
      }

      // ✅ ADD TOAST FOR ALREADY RATED TALENTS
      if (hire.offerStatus === 'Offer Accepted') {
        const hasBeenRated = this.checkIfTalentHasBeenRated(hire);

        if (hasBeenRated) {
          this.toastService.openSnackBar(
            `You have already rated ${hire.name}. You cannot evaluate them again.`,
            'warning',
          );
          return;
        }
      }

      // Check if we're already on the detail page
      const isOnDetailPage = this.router.url.includes(
        'market-engagement-market-price-preparation',
      );
      const currentRouteTalentId =
        this.route.parent?.snapshot.paramMap.get('id');

      if (
        isOnDetailPage &&
        (currentRouteTalentId === hire.id ||
          currentRouteTalentId === hire.talentId)
      ) {
        // We're on the same talent's detail page
        console.log('✅ Already on same talent page, updating view');

        // DON'T open modals here - let the detail page handle it
        // The detail page will open modals based on the hire status
        console.log(
          `ℹ️ Not opening modal in table - detail page will handle it`,
        );
      } else {
        // Navigate to talent detail page with state to open modal
        const navigationExtras: NavigationExtras = {
          state: {
            shouldOpenModal: true,
            modalType: this.getModalTypeForHire(hire),
            hireData: hire,
          },
        };

        console.log(
          `🚀 Navigating to detail page with modal type: ${this.getModalTypeForHire(hire)}`,
        );
        this.router.navigate(
          ['/scouter/market-engagement-market-price-preparation', hire.id],
          navigationExtras,
        );
      }
    } finally {
      setTimeout(() => {
        this.isProcessingClick = false;
      }, 500);
    }
  }

  // Add this helper method
  private getModalTypeForHire(hire: any): string {
    if (hire.offerStatus === 'Offer Rejected') {
      return 'reconsider';
    } else if (hire.offerStatus === 'Offer Accepted') {
      return 'total-delivery';
    }
    return 'none';
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
        this.isReconsiderOfferModalOpen,
      );
    }, 50);
  }

  onReconsiderCancelled() {
    this.isReconsiderModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  onReconsiderSubmitted(offerData: any) {
    console.log('Reconsidered offer submitted from table:', offerData);

    // Get scouter ID
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    // Format the satisfactory comment for backend
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDateForPayload(currentDate);

    const satisfactoryCommentData = {
      scouterId: scouterId,
      dateOfComment: formattedCurrentDate,
      remark: offerData.satisfactoryComment,
      rating: offerData.satisfactoryRating,
    };

    // Prepare payload for backend API
    const backendPayload = {
      ...offerData.backendPayload,
      satisFactoryCommentByScouter: JSON.stringify(satisfactoryCommentData),
    };

    console.log('Final backend payload:', backendPayload);

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
      'success',
    );

    // ✅ CALL API with updated payload
    this.reconsiderOfferAPI(backendPayload, offerData);

    // ✅ THEN close modals and clear references
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  // Update the reconsiderOfferAPI method
  private reconsiderOfferAPI(payload: any, offerData: any) {
    console.log('🔥 API CALL FIRING!', {
      payload,
      scouterId: this.authService.getCurrentUser()?.scouterId,
      selectedTalent: this.selectedTalentForReconsider,
    });

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId || !this.selectedTalentForReconsider) return;

    const talentData = this.selectedTalentForReconsider;

    // Check if we have proper IDs from the backend
    if (!talentData.marketHireId || !talentData.talentIdWithDate) {
      console.error('❌ Missing required IDs for reconsider offer:', {
        marketHireId: talentData.marketHireId,
        talentIdWithDate: talentData.talentIdWithDate,
      });
      this.toastService.openSnackBar(
        'Cannot reconsider offer: Missing required data. Please refresh and try again.',
        'error',
      );
      return;
    }

    console.log('✅ Sending reconsider offer with:', {
      payload,
      params: {
        talentId: talentData.talentIdWithDate,
        scouterId: scouterId,
        marketHireId: talentData.marketHireId,
      },
    });

    // Call the PATCH endpoint
    this.scouterService
      .toggleMarketStatus(payload, {
        talentId: talentData.talentIdWithDate,
        scouterId: scouterId,
        marketHireId: talentData.marketHireId,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Offer reconsidered successfully:', response);
          this.toastService.openSnackBar(
            'Offer reconsidered successfully!',
            'success',
          );
        },
        error: (error) => {
          console.error('❌ Failed to reconsider offer:', error);
          this.toastService.openSnackBar(
            error?.error?.message || 'Failed to reconsider offer',
            'error',
          );
        },
      });
  }

  // Helper method for date formatting in payload
  private formatDateForPayload(date: Date): string {
    // Try this format if the current one doesn't work:
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
    // Or: return date.toISOString(); // If backend expects ISO format
  }

  closeReconsiderModal() {
    console.log('Closing all reconsider modals in table');
    this.isReconsiderModalOpen = false;
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  private checkForRejectedOfferOnDataLoad() {
    const rejectedHires = this.hires.filter(
      (h) => h.offerStatus === 'Offer Rejected',
    );

    if (rejectedHires.length > 0) {
      console.log('Found rejected offers:', rejectedHires);
    }
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
