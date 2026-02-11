import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

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
  totalPages: number = 0;
  totalItems: number = 0;
  selectedHire: any = null;

  // Modal states
  isModalOpen: boolean = false;
  isReconsiderModalOpen: boolean = false;
  isReconsiderOfferModalOpen: boolean = false;
  selectedTalentForReconsider: any = null;

  // Loading states
  isLoading: boolean = false;
  error: any | null = null;

  private isProcessingClick: boolean = false;
  private currentRouteTalentId: string | null = null;

  @Output() hireSelected = new EventEmitter<any>();
  @Output() viewAllStats = new EventEmitter<void>();

  constructor(
    private toastService: ToastsService,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService,
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
    });
  }

  viewAllScouterStats() {
    this.viewAllStats.emit();
  }

  private checkIfTalentHasBeenRated(hire: any): boolean {
    const hasRating = hire.yourRating && hire.yourRating > 0;
    const hasComment = hire.yourComment && hire.yourComment.trim() !== '';

    let hasAPIComment = false;
    if (hire.satisFactoryCommentByScouter) {
      try {
        const comment = JSON.parse(hire.satisFactoryCommentByScouter);
        hasAPIComment = comment.rating > 0 || comment.remark?.trim() !== '';
      } catch (e) {
        hasAPIComment = hire.satisFactoryCommentByScouter.trim() !== '';
      }
    }

    return hasRating || hasComment || hasAPIComment;
  }

  loadMarketEngagements(
    statusParams?: string,
    pageNo: number = 1,
    searchText?: string,
  ) {
    this.isLoading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      this.error = 'Scouter ID not found. Please log in again.';
      this.isLoading = false;
      this.toastService.openSnackBar(
        'Authentication error. Please log in again.',
        'error',
      );
      return;
    }

    const params: any = {
      limit: this.pageSize,
      pageNo: pageNo,
    };

    if (statusParams) {
      params.statusParams = statusParams;
    }

    if (searchText?.trim()) {
      params.searchText = searchText.trim();
    }

    this.scouterService
      .getAllMarketsByScouter(scouterId, params)
      .pipe(
        catchError((error) => {
          console.error('❌ Error loading market engagements:', error);
          this.error =
            error?.error?.message || 'Failed to load market engagements';
          this.toastService.openSnackBar(this.error, 'error');
          return of({ data: [], totalPages: 1, currentPage: 1, totalItems: 0 });
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe((response) => {
        this.hires = response.data || [];
        this.totalPages = response.totalPages || 1;
        this.currentPage = response.currentPage || 1;
        this.totalItems = response.totalItems || this.hires.length;

        this.checkForRejectedOfferOnDataLoad();
      });
  }

  async openHireModal(hire: any) {
    if (this.isProcessingClick || this.isLoading) {
      return;
    }

    this.isProcessingClick = true;

    try {
      this.selectedHire = hire;
      this.hireSelected.emit(hire);

      if (hire.offerStatus === 'Awaiting Acceptance') {
        this.toastService.openSnackBar(
          `Offer is awaiting acceptance from ${hire.name}. Check back later for updates.`,
          'info',
        );
        return;
      }

      if (hire.offerStatus === 'Offer Accepted') {
        const hasBeenRated = this.checkIfTalentHasBeenRated(hire);
        if (hasBeenRated) {
          this.toastService.openSnackBar(
            `You have already rated ${hire.name}. You cannot evaluate them again.`,
            'info',
          );
          return;
        }
      }

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
        console.log('✅ Already on same talent page');
      } else {
        const navigationExtras: NavigationExtras = {
          state: {
            shouldOpenModal: true,
            modalType: this.getModalTypeForHire(hire),
            hireData: hire,
          },
        };

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

  private getModalTypeForHire(hire: any): string {
    if (hire.offerStatus === 'Offer Rejected') {
      return 'reconsider';
    } else if (hire.offerStatus === 'Offer Accepted') {
      return 'total-delivery';
    }
    return 'none';
  }

  onReconsiderConfirmed() {
    console.log('Reconsider confirmed, opening offer form modal');

    // Close confirmation modal first
    this.isReconsiderModalOpen = false;

    // Clear any pending operations that might cause cancellation
    this.isProcessingClick = false;

    // Then open the offer form modal
    setTimeout(() => {
      this.isReconsiderOfferModalOpen = true;
      console.log(
        'Offer form modal should now be open:',
        this.isReconsiderOfferModalOpen,
      );
    }, 100); // Reduced delay
  }

  // Add this method to prevent accidental cancellation
  onReconsiderCancelled() {
    console.log('Reconsider cancelled by user');
    this.isReconsiderModalOpen = false;
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  onReconsiderSubmitted(offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDateForPayload(currentDate);

    const satisfactoryCommentData = {
      scouterId: scouterId,
      dateOfComment: formattedCurrentDate,
      remark: offerData.satisfactoryComment,
      rating: offerData.satisfactoryRating,
    };

    const backendPayload = {
      ...offerData.backendPayload,
      satisFactoryCommentByScouter: JSON.stringify(satisfactoryCommentData),
    };

    // Update local data optimistically
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

    this.toastService.openSnackBar(
      `Revised offer sent to ${offerData.talentName}. Status updated to "Awaiting Acceptance".`,
      'success',
    );

    this.reconsiderOfferAPI(backendPayload, offerData);
  }

  private reconsiderOfferAPI(payload: any, offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId || !this.selectedTalentForReconsider) return;

    const talentData = this.selectedTalentForReconsider;

    if (!talentData.marketHireId || !talentData.talentIdWithDate) {
      this.toastService.openSnackBar(
        'Cannot reconsider offer: Missing required data. Please refresh and try again.',
        'error',
      );

      // ✅ Close modal on error
      this.isReconsiderOfferModalOpen = false;
      this.selectedTalentForReconsider = null;
      return;
    }

    this.scouterService
      .toggleMarketStatus(payload, {
        talentId: talentData.talentIdWithDate,
        scouterId: scouterId,
        marketHireId: talentData.marketHireId,
      })
      .subscribe({
        next: (response) => {
          this.toastService.openSnackBar(
            'Offer reconsidered successfully!',
            'success',
          );

          // ✅ CLOSE MODAL ONLY ON SUCCESS
          this.isReconsiderOfferModalOpen = false;
          this.selectedTalentForReconsider = null;

          // Refresh the data
          this.loadMarketEngagements();
        },
        error: (error) => {
          this.toastService.openSnackBar(
            error?.error?.message || 'Failed to reconsider offer',
            'error',
          );

          // ❌ KEEP MODAL OPEN ON ERROR - so user can try again
          // Don't close the modal, let them fix and resubmit

          // Revert optimistic update on error
          this.loadMarketEngagements();
        },
      });
  }

  private formatDateForPayload(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  closeReconsiderModal() {
    this.isReconsiderModalOpen = false;
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  private checkForRejectedOfferOnDataLoad() {
    const rejectedHires = this.hires.filter(
      (h) => h.offerStatus === 'Offer Rejected',
    );
    if (rejectedHires.length > 0) {
      console.log('Found rejected offers:', rejectedHires.length);
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

  get paginatedHires() {
    return this.hires; // Server-side pagination
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadMarketEngagements(undefined, this.currentPage);
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMarketEngagements(undefined, this.currentPage);
    }
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
