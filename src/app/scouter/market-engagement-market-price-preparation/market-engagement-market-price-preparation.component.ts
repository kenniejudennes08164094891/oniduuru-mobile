import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';
import { ReconsiderOfferModalComponent } from 'src/app/utilities/modals/reconsider-offer-modal/reconsider-offer-modal.component';
import { ReconsiderConfirmationModalComponent } from 'src/app/utilities/modals/reconsider-confirmation-modal/reconsider-confirmation-modal.component';
import { MarketEngagementsTableComponent } from 'src/app/utilities/modals/market-engagements-table/market-engagements-table.component'; // Add this import

@Component({
  selector: 'app-market-engagement-market-price-preparation',
  templateUrl: './market-engagement-market-price-preparation.component.html',
  styleUrls: ['./market-engagement-market-price-preparation.component.scss'],
  standalone: false,
})
export class MarketEngagementMarketPricePreparationComponent implements OnInit {
  @ViewChild(MarketEngagementsTableComponent)
  marketTableComponent!: MarketEngagementsTableComponent; // Add this

  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'Viki West';
  isLoading: boolean = false;
  private previousTalentId: string | null = null;
  private modalAlreadyShownForTalent: Set<string> = new Set(); // Track shown modals

  // Modal states
  isTotalDeliveryModalOpen: boolean = false;
  selectedModalHire: any = null;
  private shouldOpenModalOnLoad: boolean = false;
  private modalTypeToOpen: string = '';

  constructor(
    public route: ActivatedRoute,

    // PASSED TALENT ID AS QUERY PARAMETER IN THIS COMPONENT
    private scouterService: ScouterEndpointsService,
    private router: Router,
    private authService: AuthService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    // Subscribe to route param changes
    this.route.paramMap.subscribe((params) => {
      const talentId = params.get('id');

      if (talentId) {
        // Check if talent changed
        if (this.previousTalentId !== talentId) {
          this.previousTalentId = talentId;

          // Check navigation state for modal opening
          this.checkNavigationState();

          this.loadHireDetails(talentId);
        }
      }
    });
  }

  private checkNavigationState() {
    // Get navigation state from router
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
    this.modalAlreadyShownForTalent.clear();

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
            } else if (hireData.offerStatus === 'Offer Rejected') {
              this.showReconsiderModal(hireData);
            }
          } else {
            this.loadMockData(talentId);

            // Even with mock data, try to open modal if requested
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

          // Even with error, try to open modal if requested
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

    // Reset flag first
    this.shouldOpenModalOnLoad = false;

    // Use the hire data from state or current hire
    const hireToUse = this.selectedModalHire || this.hire;

    if (!hireToUse) {
      console.warn('No hire data available for modal');
      return;
    }

    // Small delay to ensure UI is rendered
    setTimeout(() => {
      if (this.modalTypeToOpen === 'reconsider') {
        this.showReconsiderModal(hireToUse);
      } else if (this.modalTypeToOpen === 'total-delivery') {
        this.openTotalDeliveryModal(hireToUse);
      }

      // Reset modal type
      this.modalTypeToOpen = '';
    }, 300);
  }

  // 🔥 NEW: Method to check if modal should be shown
  private showReconsiderModalIfNeeded(hire: any) {
    const talentId = hire.id || hire.talentId;

    // Check if modal was already shown for this talent
    if (this.modalAlreadyShownForTalent.has(talentId)) {
      console.log(`Modal already shown for talent ${talentId}, skipping`);
      return;
    }

    // Mark this talent as having modal shown
    this.modalAlreadyShownForTalent.add(talentId);

    // Show modal after a delay to ensure UI is loaded
    setTimeout(() => {
      this.showReconsiderModal(hire);
    }, 800);
  }

  private loadMockData(talentId: string) {
    // Fallback to mock data when API fails or returns no results
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
      // Create a fallback hire object to prevent template errors
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

  updateRating(star: number) {
    if (!this.hire) return;

    const hire = this.hire; // capture local reference
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

        // Update mock data for consistency in development
        const index = MockRecentHires.findIndex((h) => h.id === hire.id);
        if (index !== -1) {
          MockRecentHires[index].yourRating = star;
        }

        // Optional: Show success feedback
        this.showSuccessFeedback('Rating updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update rating:', error);
        this.showErrorFeedback('Failed to update rating');
        // Optionally revert the UI change
      },
    });
  }

  private showSuccessFeedback(message: string) {
    // You can implement toast or other feedback mechanism here
    console.log('✅', message);
  }

  private showErrorFeedback(message: string) {
    // You can implement toast or other feedback mechanism here
    console.error('❌', message);
  }

  setSelectedHire(hire: MockPayment) {
    console.log('🔄 Setting selected hire:', hire.name);
    this.hire = hire;
    this.userName = hire.name;

    // Update URL to reflect selected talent
    this.router.navigate(
      ['/scouter/market-engagement-market-price-preparation', hire.id],
      {
        queryParams: {
          fromTable: 'true',
          timestamp: Date.now(), // Prevent browser caching
        },
        replaceUrl: true, // Replace current URL instead of pushing
      }
    );

    // 🔥 FIX: Don't show modal here - it will be triggered by route change
    // The route subscription will handle it
  }

  onTableHireClick(hire: MockPayment) {
    console.log('📋 Table hire clicked:', hire.name);

    // Create navigation state to open modal after navigation
    const navigationExtras: NavigationExtras = {
      state: {
        shouldOpenModal: true,
        modalType: this.getModalTypeForHire(hire),
        hireData: hire,
      },
    };

    // Navigate to the talent detail page
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
    return 'none';
  }

  openTotalDeliveryModal(hire: any) {
    console.log('Opening Total Delivery Modal for:', hire.name);

    // Check hire status
    if (hire.offerStatus === 'Offer Rejected') {
      this.showReconsiderModal(hire);
      return;
    }

    if (hire.offerStatus !== 'Offer Accepted') {
      console.log(`${hire.offerStatus} - not opening modal`);
      return;
    }

    // Set modal data and open
    this.selectedModalHire = hire;
    this.isTotalDeliveryModalOpen = true;
  }

  closeTotalDeliveryModal() {
    this.isTotalDeliveryModalOpen = false;
    this.selectedModalHire = null;
  }

  onRatingUpdated(updateData: { hireId: string; rating: number }) {
    // Update local hire data
    if (this.hire && this.hire.id === updateData.hireId) {
      this.hire.yourRating = updateData.rating;
    }

    // Update table data if available
    if (this.marketTableComponent) {
      this.marketTableComponent.onRatingUpdated(updateData);
    }
  }

  async showReconsiderModal(hire: any) {
    // Check if modal is already open
    const existingModal = await this.modalCtrl.getTop();
    if (existingModal) {
      console.log('Modal already open, skipping');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: ReconsiderConfirmationModalComponent,
      componentProps: {
        talentName: hire.name,
      },
      cssClass: 'auto-height-modal',
      backdropDismiss: false, // Prevent accidental dismissal
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.confirmed) {
      await this.showReconsiderOfferForm(hire);
    }
  }

  async showReconsiderOfferForm(hire: any) {
    const modal = await this.modalCtrl.create({
      component: ReconsiderOfferModalComponent,
      componentProps: {
        talentId: hire.id,
        talentName: hire.name,
        originalAmount: hire.amount,
        originalJobDescription: hire.jobDescription,
      },
      cssClass: 'reconsider-offer-modal',
      backdropDismiss: false,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data?.success) {
      this.handleReconsideredOffer(data.data);
    }
  }

  private handleReconsideredOffer(offerData: any) {
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
    console.log('Offer reconsidered:', offerData);

    // Make API call to update offer
    this.updateReconsideredOffer(offerData);
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
