import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';
import { ReconsiderOfferModalComponent } from 'src/app/utilities/modals/reconsider-offer-modal/reconsider-offer-modal.component';
import { ReconsiderConfirmationModalComponent } from 'src/app/utilities/modals/reconsider-confirmation-modal/reconsider-confirmation-modal.component';
import { MarketEngagementsTableComponent } from 'src/app/utilities/modals/market-engagements-table/market-engagements-table.component';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-market-engagement-market-price-preparation',
  templateUrl: './market-engagement-market-price-preparation.component.html',
  styleUrls: ['./market-engagement-market-price-preparation.component.scss'],
  standalone: false,
})
export class MarketEngagementMarketPricePreparationComponent implements OnInit {
  @ViewChild(MarketEngagementsTableComponent)
  marketTableComponent!: MarketEngagementsTableComponent;

  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'Viki West';
  isLoading: boolean = false;
  private previousTalentId: string | null = null;

  // Modal states
  isTotalDeliveryModalOpen: boolean = false;
  isReconsiderModalOpen: boolean = false;
  isReconsiderOfferModalOpen: boolean = false;
  selectedModalHire: any = null;
  selectedTalentForReconsider: any = null;

  private shouldOpenModalOnLoad: boolean = false;
  private modalTypeToOpen: string = '';

  constructor(
    public route: ActivatedRoute,
    private scouterService: ScouterEndpointsService,
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastService: ToastsService
  ) {}

  ngOnInit() {
    // Subscribe to route param changes
    this.route.paramMap.subscribe((params) => {
      const talentId = params.get('id');

      if (talentId) {
        // Check if talent changed
        if (this.previousTalentId !== talentId) {
          this.previousTalentId = talentId;
          this.checkNavigationState();
          this.loadHireDetails(talentId);
        }
      }
    });
  }

  private checkNavigationState() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const state = navigation.extras.state as any;

      if (state.shouldOpenModal && state.hireData) {
        this.shouldOpenModalOnLoad = true;
        this.modalTypeToOpen = state.modalType || '';
        this.selectedModalHire = state.hireData;
        console.log('Modal should open after load:', this.modalTypeToOpen);
      }
    }
  }

  loadHireDetails(talentId: string) {
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.isLoading = false;
      return;
    }

    console.log('🔍 Loading hire details for talent:', talentId);

    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        talentId: talentId,
        limit: 10,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Hire details response:', response);

          if (response?.data && response.data.length > 0) {
            const hireData = response.data[0];
            this.hire = hireData;
            this.userName = hireData?.name || 'Unknown Talent';

            // Check if we need to open a modal after loading
            if (this.shouldOpenModalOnLoad) {
              this.openModalAfterDataLoad();
            }
          } else {
            this.loadMockData(talentId);

            if (this.shouldOpenModalOnLoad) {
              setTimeout(() => {
                this.openModalAfterDataLoad();
              }, 500);
            }
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading hire details:', error);
          this.loadMockData(talentId);

          if (this.shouldOpenModalOnLoad) {
            setTimeout(() => {
              this.openModalAfterDataLoad();
            }, 500);
          }

          this.isLoading = false;
        },
      });
  }

  private openModalAfterDataLoad() {
    console.log('Opening modal after data load:', this.modalTypeToOpen);

    this.shouldOpenModalOnLoad = false;
    const hireToUse = this.selectedModalHire || this.hire;

    if (!hireToUse) {
      console.warn('No hire data available for modal');
      return;
    }

    setTimeout(() => {
      if (this.modalTypeToOpen === 'reconsider') {
        this.openReconsiderModal(hireToUse);
      } else if (this.modalTypeToOpen === 'total-delivery') {
        this.openTotalDeliveryModal(hireToUse);
      }

      this.modalTypeToOpen = '';
    }, 300);
  }

  // Handle table hire click
  onTableHireClick(hire: MockPayment) {
    console.log('📋 Table hire clicked:', hire.name);

    const navigationExtras: NavigationExtras = {
      state: {
        shouldOpenModal: true,
        modalType: this.getModalTypeForHire(hire),
        hireData: hire,
      },
    };

    this.router.navigate(
      ['/scouter/market-engagement-market-price-preparation', hire.id],
      navigationExtras
    );
  }

  private getModalTypeForHire(hire: any): string {
    if (hire.offerStatus === 'Offer Rejected') {
      return 'reconsider';
    } else if (hire.offerStatus === 'Offer Accepted') {
      return 'total-delivery';
    }
    return 'none'; // No modal for other statuses
  }

  // Open modals based on status
  openTotalDeliveryModal(hire: any) {
    console.log('Opening Total Delivery Modal for:', hire.name);

    if (hire.offerStatus !== 'Offer Accepted') {
      console.log(`${hire.offerStatus} - not opening total delivery modal`);
      return;
    }

    this.selectedModalHire = hire;
    this.isTotalDeliveryModalOpen = true;
  }

  debugModalStates() {
    console.log('🔍 Modal States:', {
      isReconsiderModalOpen: this.isReconsiderModalOpen,
      isReconsiderOfferModalOpen: this.isReconsiderOfferModalOpen,
      selectedTalentForReconsider: this.selectedTalentForReconsider
        ? this.selectedTalentForReconsider.name
        : 'null',
    });
  }

  // Call debug in relevant places
  openReconsiderModal(hire: any) {
    console.log('Opening Reconsider Modal for:', hire.name);

    if (hire.offerStatus !== 'Offer Rejected') {
      console.log(`${hire.offerStatus} - not opening reconsider modal`);
      return;
    }

    this.selectedTalentForReconsider = hire;
    this.isReconsiderModalOpen = true;

    // Debug
    this.debugModalStates();
  }
  // Modal close handlers
  closeTotalDeliveryModal() {
    this.isTotalDeliveryModalOpen = false;
    this.selectedModalHire = null;
  }

  closeReconsiderModal() {
    console.log('Closing all reconsider modals');
    this.isReconsiderModalOpen = false;
    this.isReconsiderOfferModalOpen = false;
    this.selectedTalentForReconsider = null;
  }

  // Reconsider modal handlers
  onReconsiderConfirmed() {
    console.log('Reconsider confirmed, opening offer form modal');

    // Close confirmation modal first
    this.isReconsiderModalOpen = false;

    // Then open the offer form modal
    setTimeout(() => {
      this.isReconsiderOfferModalOpen = true;
      console.log(
        'Offer form modal should now be open:',
        this.isReconsiderOfferModalOpen
      );
    }, 50); // Small delay to ensure DOM updates
  }

  onReconsiderCancelled() {
    console.log('Reconsider cancelled');
    this.closeReconsiderModal();
  }

  onReconsiderSubmitted(offerData: any) {
    console.log('Reconsidered offer submitted:', offerData);

    // Update local hire data
    if (this.hire && this.hire.id === offerData.talentId) {
      this.hire = {
        ...this.hire,
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

    // ✅ CALL API FIRST
    this.reconsiderOfferAPI(offerData);

    // ✅ THEN close modal
    this.closeReconsiderModal();
  }

  private reconsiderOfferAPI(offerData: any) {
    console.log('🔥 API CALL FIRING!', {
      offerData,
      scouterId: this.authService.getCurrentUser()?.scouterId,
      selectedTalent: this.selectedTalentForReconsider,
    });

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId || !this.selectedTalentForReconsider) return;

    // ✅ Get the actual market hire data
    const talentData = this.selectedTalentForReconsider;

    // ✅ Check if we have proper IDs
    if (!talentData.marketHireId || !talentData.talentIdWithDate) {
      console.error('❌ Missing required IDs for reconsider offer:', {
        marketHireId: talentData.marketHireId,
        talentIdWithDate: talentData.talentIdWithDate,
      });
      this.toastService.openSnackBar(
        'Cannot reconsider offer: Missing required data. Please refresh and try again.',
        'error'
      );
      return;
    }

    // Prepare payload according to the endpoint specification
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDateForPayload(currentDate);
    const formattedStartDate = this.formatDateForPayload(
      new Date(offerData.startDate)
    );

    const payload = {
      hireStatus: 'awaiting-acceptance',
      amountToPay: offerData.amount.toString(),
      jobDescription: offerData.jobDescription,
      startDate: formattedStartDate,
      dateOfHire: formattedCurrentDate,
      satisFactoryCommentByScouter: JSON.stringify({
        scouterId: scouterId,
        dateOfComment: formattedCurrentDate,
        remark: '(Proposal Reconsidered)',
        rating: 0,
      }),
    };

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
        // ✅ Use correct method name
        talentId: talentData.talentIdWithDate,
        scouterId: scouterId,
        marketHireId: talentData.marketHireId,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Offer reconsidered successfully:', response);
          this.toastService.openSnackBar(
            'Offer reconsidered successfully!',
            'success'
          );
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

  // Other existing methods...
  updateRating(star: number) {
    if (!this.hire) return;

    const hire = this.hire;
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      return;
    }

    const payload = {
      scouterId: scouterId,
      remark: hire.yourComment || 'Rating updated via detail page',
      rating: star,
    };

    console.log('⭐ Updating rating for hire:', hire.id, 'to:', star);

    this.scouterService.updateMarketComment(hire.id, payload).subscribe({
      next: (response) => {
        console.log('✅ Rating updated successfully:', response);
        hire.yourRating = star;

        const index = MockRecentHires.findIndex((h) => h.id === hire.id);
        if (index !== -1) {
          MockRecentHires[index].yourRating = star;
        }

        this.showSuccessFeedback('Rating updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update rating:', error);
        this.showErrorFeedback('Failed to update rating');
      },
    });
  }

  onRatingUpdated(updateData: { hireId: string; rating: number }) {
    if (this.hire && this.hire.id === updateData.hireId) {
      this.hire.yourRating = updateData.rating;
    }

    if (this.marketTableComponent) {
      this.marketTableComponent.onRatingUpdated(updateData);
    }
  }

  private showSuccessFeedback(message: string) {
    console.log('✅', message);
  }

  private showErrorFeedback(message: string) {
    console.error('❌', message);
  }

  private loadMockData(talentId: string) {
    const mock = MockRecentHires.find((m) => String(m.id) === String(talentId));
    if (mock) {
      this.hire = {
        ...mock,
        jobDescription: mock.jobDescription ?? '',
        yourComment: mock.yourComment ?? '',
        yourRating: mock.yourRating ?? 0,
        talentComment: mock.talentComment ?? '',
        talentRating: mock.talentRating ?? 0,
      } as MockPayment;
      this.userName = this.hire?.name || 'Unknown Talent';
    } else {
      console.error('❌ No mock data found for talent ID:', talentId);
      this.hire = this.createFallbackHire(talentId);
    }
  }

  private createFallbackHire(talentId: string): MockPayment {
    return {
      id: talentId,
      profilePic: 'assets/images/default-avatar.png',
      name: 'Unknown Talent',
      email: 'No email available',
      date: new Date().toLocaleDateString(),
      startDate: 'N/A',
      amount: 0,
      offerStatus: 'Awaiting Acceptance',
      status: 'Pending',
      jobDescription: 'No job description available',
      yourComment: '',
      yourRating: 0,
      talentComment: '',
      talentRating: 0,
    } as MockPayment;
  }

  private updateReconsideredOffer(offerData: any) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) return;

    // Implement your API call here
    // this.scouterService.reconsiderOffer({
    //   scouterId: scouterId,
    //   talentId: offerData.talentId,
    //   ...offerData
    // }).subscribe({
    //   next: (response) => {
    //     console.log('Offer reconsidered successfully');
    //   },
    //   error: (error) => {
    //     console.error('Failed to reconsider offer:', error);
    //   }
    // });
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
