import { Component, EventEmitter, Output } from '@angular/core';
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
export class MarketEngagementsTableComponent {
  hires: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  selectedHire: any = null;
  isModalOpen: boolean = false;
  private isProcessingClick: boolean = false; // 🔥 ADD THIS FLAG
  // private currentRouteTalentId: string | null = null; // Track current route talent

  @Output() hireSelected = new EventEmitter();

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
    // this.subscribeToRouteChanges();
  }

  // private subscribeToRouteChanges() {
  //   // Track current route talent ID
  //   this.route.parent?.paramMap.subscribe((params) => {
  //     this.currentRouteTalentId = params.get('id');
  //     console.log('Current route talent ID:', this.currentRouteTalentId);
  //   });
  // }

  loadMarketEngagements() {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.loadMockData(); // Fallback to mock data even if no scouter ID
      return;
    }

    // 🚨 PRODUCTION: API call
    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        limit: 10,
        pageNo: 1,
      })
      .subscribe({
        next: (response) => {
          console.log('API Response:', response); // Debug log

          // Check if response has data and it's not empty
          if (
            response?.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            console.log('✅ API returned data, count:', response.data.length);
            this.hires = response.data;

            // Check if any hire has "Offer Rejected" status
            this.checkForRejectedOfferOnDataLoad();
          } else {
            console.warn('⚠️ API returned empty data, using mock data');
            // API returned empty data - use mock data
            this.loadMockData();
          }
        },
        error: (error) => {
          console.error('❌ Error loading market engagements:', error);

          // API call failed - use mock data
          this.loadMockData();

          // Optional: Show error toast
          this.toastService.openSnackBar(
            'Using demo data. Please check your connection.',
            'warning'
          );
        },
      });
  }

  // 🚨 DEVELOPMENT: Add this method for mock data
  private loadMockData() {
    console.log('📊 Loading mock data...');

    // Ensure MockRecentHires exists and is not empty
    if (
      !MockRecentHires ||
      !Array.isArray(MockRecentHires) ||
      MockRecentHires.length === 0
    ) {
      console.error('❌ MockRecentHires is empty or undefined');
      this.hires = []; // Set empty array if no mock data
      return;
    }

    this.hires = MockRecentHires.map((hire) => ({
      ...hire,
      id: hire.id || Math.random().toString(), // Ensure ID exists
      jobDescription: hire.jobDescription ?? 'No description available',
      yourComment: hire.yourComment ?? '',
      yourRating: hire.yourRating ?? 0,
      talentComment: hire.talentComment ?? '',
      talentRating: hire.talentRating ?? 0,
      offerStatus: hire.offerStatus || 'Awaiting Acceptance', // Default status
      status: hire.status || 'Pending', // Default status
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

      // Store hire data in navigation state to open modal after navigation
      const navigationExtras: NavigationExtras = {
        state: {
          shouldOpenModal: true,
          modalType: this.getModalTypeForHire(hire),
          hireData: hire,
        },
      };

      // Navigate to the talent detail page with state
      this.router.navigate(
        ['/scouter/market-engagement-market-price-preparation', hire.id],
        navigationExtras
      );
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

  private async handleModalOpening(hire: any) {
    console.log(
      'Handling modal for hire:',
      hire.name,
      'Status:',
      hire.offerStatus
    );

    if (hire.offerStatus === 'Offer Rejected') {
      await this.showReconsiderConfirmationModal(hire);
    } else if (hire.offerStatus === 'Offer Accepted') {
      if (!hire.yourRating || hire.yourRating <= 0) {
        this.toastService.openSnackBar(
          `⭐ No rating provided yet. Set your own rating ↑`,
          'warning'
        );
        // Still open the modal for "Offer Accepted" even without rating
        this.isModalOpen = true;
      } else {
        // Open the Total Delivery Evaluation modal
        this.isModalOpen = true;
      }
    } else {
      // For other statuses (Awaiting Acceptance, etc.)
      this.toastService.openSnackBar(`${hire.offerStatus}`, 'success');
    }
  }

  // 🔥 UPDATE: Add this method to handle modal opening from parent
  openReconsiderModalForHire(hire: any) {
    if (hire && hire.offerStatus === 'Offer Rejected') {
      this.showReconsiderConfirmationModal(hire);
    }
  }

  // Check for rejected offers when page loads
  private checkForRejectedOfferOnPageLoad() {
    // Check if there's a rejected offer in URL params or state
    const urlParams = new URLSearchParams(window.location.search);
    const rejectedOfferId = urlParams.get('rejectedOffer');

    if (rejectedOfferId && this.hires.length > 0) {
      const rejectedHire = this.hires.find(
        (h) => h.id === rejectedOfferId && h.offerStatus === 'Offer Rejected'
      );
      if (rejectedHire) {
        setTimeout(() => {
          this.showReconsiderConfirmationModal(rejectedHire);
        }, 1000); // Small delay to ensure UI is loaded
      }
    }
  }

  // Check when data loads
  private checkForRejectedOfferOnDataLoad() {
    // Check if there's a rejected offer in the loaded data
    const rejectedHires = this.hires.filter(
      (h) => h.offerStatus === 'Offer Rejected'
    );

    if (rejectedHires.length > 0) {
      // Optionally auto-show modal for the first rejected offer
      // Or you can implement logic based on your requirements
      console.log('Found rejected offers:', rejectedHires);
    }
  }

  async showReconsiderConfirmationModal(hire: any) {
    const modal = await this.modalCtrl.create({
      component: ReconsiderConfirmationModalComponent,
      componentProps: {
        talentName: hire.name,
      },
      cssClass: 'auto-height-modal',
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.confirmed) {
      // User confirmed - show the reconsider offer form modal
      await this.showReconsiderOfferModal(hire);
    }
  }

  async showReconsiderOfferModal(hire: any) {
    const modal = await this.modalCtrl.create({
      component: ReconsiderOfferModalComponent,
      componentProps: {
        talentId: hire.id,
        talentName: hire.name,
        originalAmount: hire.amount,
        originalJobDescription: hire.jobDescription,
      },
      cssClass: 'reconsider-offer-modal',
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.success) {
      // Handle the submitted reconsidered offer
      this.handleReconsideredOffer(data.data);
    }
  }

  private handleReconsideredOffer(offerData: any) {
    console.log('Reconsidered offer submitted:', offerData);

    // Update the local hire data
    const index = this.hires.findIndex((h) => h.id === offerData.talentId);
    if (index !== -1) {
      this.hires[index] = {
        ...this.hires[index],
        amount: offerData.amount,
        jobDescription: offerData.jobDescription,
        startDate: offerData.startDate,
        offerStatus: 'Awaiting Acceptance', // Update status
        status: 'Pending',
      };
    }

    // Show success message
    this.toastService.openSnackBar(
      `Revised offer sent to ${offerData.talentName}`,
      'success'
    );

    // Optional: Make API call to update offer
    this.updateOfferOnBackend(offerData);
  }

  private updateOfferOnBackend(offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) return;

    // Create payload for your backend API
    const payload = {
      scouterId: scouterId,
      talentId: offerData.talentId,
      marketId: offerData.talentId, // Adjust based on your data structure
      newAmount: offerData.amount,
      newJobDescription: offerData.jobDescription,
      newStartDate: offerData.startDate,
      additionalComments: offerData.comments,
      action: 'reconsider_offer',
    };

    // Call your service method (you'll need to implement this)
    // this.scouterService.reconsiderOffer(payload).subscribe({
    //   next: (response) => {
    //     console.log('Offer reconsidered successfully:', response);
    //   },
    //   error: (error) => {
    //     console.error('Failed to reconsider offer:', error);
    //   }
    // });
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
