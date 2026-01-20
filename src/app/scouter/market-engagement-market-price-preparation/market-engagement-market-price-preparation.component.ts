import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { TotalHires, MockRecentHires } from 'src/app/models/mocks';
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

  hire: TotalHires | undefined;
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
  ) { }

ngOnInit() {
  // Subscribe to route param changes
  this.route.paramMap.subscribe((params) => {
    const talentId = params.get('id');
    
    console.log('🔄 Route changed - Talent ID:', talentId);
    
    if (talentId) {
      // Check navigation state FIRST (this contains the actual hire data)
      this.checkNavigationState(talentId);
      
      // Reset loading state
      this.isLoading = true;
      
      // Always load hire details when param changes
      this.previousTalentId = talentId;
      
      // If we have state data, use it immediately
      if (this.selectedModalHire) {
        console.log('✅ Using hire data from navigation state:', this.selectedModalHire.name);
        this.hire = this.selectedModalHire;
        this.userName = this.selectedModalHire.name || 'Unknown Talent';
        this.isLoading = false;
        
        // Check if we need to open a modal
        if (this.shouldOpenModalOnLoad) {
          this.openModalAfterDataLoad();
        }
      } else {
        // Otherwise load from API
        this.loadHireDetails(talentId);
      }
      
      // Reset modal states
      this.shouldOpenModalOnLoad = false;
      this.modalTypeToOpen = '';
    }
  });
}

private checkNavigationState(talentId: string) {
  const navigation = this.router.getCurrentNavigation();
  
  // Check BOTH extras.state and history.state
  let stateData = null;
  
  if (navigation?.extras?.state) {
    stateData = navigation.extras.state as any;
    console.log('📦 Navigation extras state:', stateData);
  } else if (history.state) {
    // Fallback to history.state
    stateData = history.state;
    console.log('📦 History state:', stateData);
  }
  
  if (stateData?.hireData) {
    const hireData = stateData.hireData;
    console.log('✅ Found hire data in navigation state:', {
      name: hireData.name,
      id: hireData.id,
      talentId: hireData.talentId,
      matchesRouteId: hireData.id === talentId || hireData.talentId === talentId
    });
    
    // Always set the state data regardless of ID match
    this.shouldOpenModalOnLoad = stateData.shouldOpenModal || false;
    this.modalTypeToOpen = stateData.modalType || '';
    this.selectedModalHire = hireData;
    
    console.log('📊 Modal states set:', {
      shouldOpenModal: this.shouldOpenModalOnLoad,
      modalType: this.modalTypeToOpen
    });
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

  console.log('🔍 Loading hire details for talent ID:', talentId);
  console.log('🎯 Scouter ID:', scouterId);

  // Use the talentId directly as the API expects it
  this.scouterService.getAllMarketsByScouter(scouterId, {
    talentId: talentId, // Pass the talentId directly
    limit: 10,
  }).subscribe({
    next: (response: any) => {
      console.log('📊 API Response:', {
        dataLength: response.data?.length || 0,
        talentIdRequested: talentId
      });

      const data = response.data as TotalHires[] || [];
      
      if (data.length === 0) {
        console.warn('⚠️ No data returned for talentId:', talentId);
        
        // If we have navigation state data, use it
        if (this.selectedModalHire) {
          console.log('✅ Using navigation state data since API returned empty');
          this.setHireData(this.selectedModalHire);
        } else {
          // Try without talentId filter to see if we get any data
          this.loadAllDataAndFindTalent(scouterId, talentId);
        }
        return;
      }

      // Use the first item from the filtered response
      const hireData = data[0];
      console.log('✅ Found hire data from API:', {
        name: hireData.name,
        talentId: hireData.talentId,
        matchesRequested: hireData.talentId === talentId
      });

      this.setHireData(hireData);
      this.isLoading = false;
    },
    error: (error: any) => {
      console.error('❌ Error loading hire details:', error);
      
      // If we have navigation state data, use it as fallback
      if (this.selectedModalHire) {
        console.log('✅ Using navigation state data as fallback');
        this.setHireData(this.selectedModalHire);
        this.isLoading = false;
      } else {
        // Fallback: Try loading all data and searching
        this.loadAllDataAndFindTalent(scouterId, talentId);
      }
    }
  });
}


private loadAllDataAndFindTalent(scouterId: string, talentId: string) {
  console.log('🔄 Loading all data to search for talent:', talentId);
  
  this.scouterService.getAllMarketsByScouter(scouterId, {
    limit: 100,
  }).subscribe({
    next: (response: any) => {
      const allData = response.data as TotalHires[] || [];
      console.log(`📊 Total records loaded: ${allData.length}`);
      
      // Try to find the talent by various methods
      let hireData = this.findTalentInData(allData, talentId);
      
      if (hireData) {
        console.log('✅ Found in all data:', hireData.name);
        this.setHireData(hireData);
      } else {
        console.error('❌ Talent not found in any data');
        this.loadMockData(talentId);
      }
      
      this.isLoading = false;
    },
    error: (error: any) => {
      console.error('❌ Error loading all data:', error);
      this.loadMockData(talentId);
      this.isLoading = false;
    }
  });
}

private findTalentInData(data: TotalHires[], talentId: string): TotalHires | undefined {
  // Try multiple matching strategies
  const strategies = [
    // 1. Exact talentId match (most important)
    (item: TotalHires) => item.talentId === talentId,
    // 2. Check if talentId contains the search string
    (item: TotalHires) => item.talentId?.includes(talentId),
    // 3. Check if id contains the search string
    (item: TotalHires) => item.id?.toString().includes(talentId),
    // 4. Check if talentIdWithDate contains the search string
    (item: TotalHires) => (item as any).talentIdWithDate?.includes(talentId),
    // 5. Check if email contains the search string
    (item: TotalHires) => item.email?.toLowerCase().includes(talentId.toLowerCase()),
    // 6. Check if name contains the search string
    (item: TotalHires) => item.name?.toLowerCase().includes(talentId.toLowerCase()),
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const match = data.find(strategies[i]);
    if (match) {
      console.log(`✅ Found with strategy ${i}: ${match.name}`);
      return match;
    }
  }
  
  return undefined;
}

private findExactTalent(data: TotalHires[], talentId: string): TotalHires | undefined {
  console.log(`🔍 Searching for ${talentId} in ${data.length} records`);
  
  // Try multiple matching strategies in order of priority
  const matchStrategies = [
    // 1. Exact ID match
    (item: TotalHires) => item.id === talentId,
    // 2. Exact talentId match
    (item: TotalHires) => item.talentId === talentId,
    // 3. Check if talentId contains the ID (partial match)
    (item: TotalHires) => item.talentId?.includes(talentId),
    // 4. Check if ID contains talentId (partial match)
    (item: TotalHires) => item.id?.includes(talentId),
    // 5. Check talentIdWithDate if it exists
    (item: TotalHires) => (item as any).talentIdWithDate?.includes(talentId),
  ];
  
  for (let i = 0; i < matchStrategies.length; i++) {
    const match = data.find(matchStrategies[i]);
    if (match) {
      console.log(`✅ Found with strategy ${i}: ${match.name}`);
      return match;
    }
  }
  
  console.log('❌ No exact match found');
  return undefined;
}



private setHireData(hireData: TotalHires) {
  // Make sure the hire data has all required properties
  this.hire = {
    ...hireData,
    jobDescription: hireData.jobDescription || '',
    yourComment: hireData.yourComment || '',
    yourRating: hireData.yourRating || 0,
    talentComment: hireData.talentComment || '',
    talentRating: hireData.talentRating || 0,
  };
  
  this.userName = hireData?.name || 'Unknown Talent';
  
  console.log('✅ Hire data set:', {
    name: hireData.name,
    id: hireData.id,
    talentId: hireData.talentId
  });
  
  // Check if we need to open a modal after loading
  if (this.shouldOpenModalOnLoad) {
    this.openModalAfterDataLoad();
  }
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
// Handle table hire click
onTableHireClick(hire: TotalHires) {
  console.log('📋 Table hire clicked in detail page:', hire.name);

  // Check current route talent ID
  const currentTalentId = this.route.snapshot.paramMap.get('id');

  if (currentTalentId === hire.id || currentTalentId === hire.talentId) {
    // Already on the same talent page - update the current hire
    this.hire = hire;  // This will update the initialHire input
    this.userName = hire.name || 'Talent';
    console.log('✅ Updated current hire to:', hire.name);
    
    // Open modal if needed
    this.openModalForCurrentHire(hire);
  } else {
    // Navigate to the talent's detail page
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
}

  private updateStatsWithHire(hire: TotalHires) {
    console.log('📊 Updating stats with hire:', hire.name);

    // Update the current hire
    this.hire = hire;
    this.userName = hire.name || 'Talent';

    // This will automatically update the stats component through the tabs component
    // since the initialHire input is bound
  }

  private openModalForCurrentHire(hire: any) {
    console.log('Opening modal for current hire:', hire.name);

    const modalType = this.getModalTypeForHire(hire);

    if (modalType === 'reconsider') {
      this.openReconsiderModal(hire);
    } else if (modalType === 'total-delivery') {
      this.openTotalDeliveryModal(hire);
    }
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
  console.log('🔍 Searching mock data for:', talentId);
  
  // First try exact match with talentId
  let mock = MockRecentHires.find((m) => m.talentId === talentId);
  
  // Then try partial matches
  if (!mock) {
    mock = MockRecentHires.find((m) => 
      m.talentId?.includes(talentId) ||
      m.id?.toString().includes(talentId) ||
      m.email?.toLowerCase().includes(talentId.toLowerCase())
    );
  }
  
  if (mock) {
    this.hire = {
      ...mock,
      jobDescription: mock.jobDescription ?? '',
      yourComment: mock.yourComment ?? '',
      yourRating: mock.yourRating ?? 0,
      talentComment: mock.talentComment ?? '',
      talentRating: mock.talentRating ?? 0,
    } as TotalHires;
    this.userName = this.hire?.name || 'Unknown Talent';
    console.log('✅ Found in mock data:', this.hire.name);
  } else {
    console.error('❌ No mock data found for talent ID:', talentId);
    this.hire = this.createFallbackHire(talentId);
  }
}

  private createFallbackHire(talentId: string): TotalHires {
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
    } as TotalHires;
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
