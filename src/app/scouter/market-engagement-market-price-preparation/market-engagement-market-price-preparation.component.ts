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

  private isTabSwitchInProgress: boolean = false;

  private hasTalentBeenRated: boolean = false;

  activeTab: 'engagements' | 'stats' = 'engagements';

  hire: TotalHires | undefined;
  images = imageIcons;
  userName: string = '';
  talentName: string = 'Talent'; // New property for talent name
  isLoading: boolean = false;
  private previousTalentId: string | null = null;

  showSpinner: boolean = true;

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
    private toastService: ToastsService,
  ) {}

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
          console.log(
            '✅ Using hire data from navigation state:',
            this.selectedModalHire.name,
          );
          this.setHireData(this.selectedModalHire);
          this.extractTalentName(); // Extract talent name
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

  ngOnDestroy() {
    this.closeTotalDeliveryModal();
    this.closeReconsiderModal();
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
        matchesRouteId:
          hireData.id === talentId || hireData.talentId === talentId,
      });

      // Always set the state data regardless of ID match
      this.shouldOpenModalOnLoad = stateData.shouldOpenModal || false;
      this.modalTypeToOpen = stateData.modalType || '';
      this.selectedModalHire = hireData;

      console.log('📊 Modal states set:', {
        shouldOpenModal: this.shouldOpenModalOnLoad,
        modalType: this.modalTypeToOpen,
      });
    }
  }

  /**
   * Extract talent name from hire data
   */
  private extractTalentName(): void {
    if (!this.hire) {
      this.talentName = 'Talent';
      return;
    }

    // Try multiple possible properties for talent name
    this.talentName =
      this.hire.name || this.extractNameFromEmail(this.hire.email) || 'Talent';

    console.log('Extracted talent name:', this.talentName);
  }

  /**
   * Try to extract a name from email (e.g., john.doe@email.com -> John Doe)
   */
  private extractNameFromEmail(email?: string): string | null {
    if (!email) return null;

    try {
      const emailPrefix = email.split('@')[0];
      // Convert "john.doe" to "John Doe"
      const nameParts = emailPrefix
        .split('.')
        .map(
          (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase(),
        );
      return nameParts.join(' ');
    } catch (error) {
      return null;
    }
  }

  /**
   * Get display name for the template
   */
  getTalentDisplayName(): string {
    if (this.talentName && this.talentName !== 'Talent') {
      return this.talentName;
    }

    // Fallback if we couldn't extract a specific name
    return 'Talent';
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

    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        talentId: talentId,
        limit: 10,
      })
      .subscribe({
        next: (response: any) => {
          console.log('📊 RAW API RESPONSE STRUCTURE:', {
            response: response,
            rawResponse: response.rawResponse, // Check if this exists
            data: response.data,
            firstItem: response.data?.[0],
            firstItemKeys: response.data?.[0]
              ? Object.keys(response.data[0])
              : [],
          });

          setTimeout(() => (this.showSpinner = false), 2000);
          const data = (response.data as TotalHires[]) || [];

          if (data.length > 0) {
            const hireData = data[0];
            console.log('🎯 HIRE DATA FOR PARSING:', {
              hireData: hireData,
              allFields: Object.keys(hireData),
              satisFactoryCommentByScouter:
                hireData.satisFactoryCommentByScouter,
              satisFactoryCommentByTalent: hireData.satisFactoryCommentByTalent,
              // Check if it's in _originalData
              originalData: hireData._originalData,
              originalComments:
                hireData._originalData?.satisFactoryCommentByScouter,
            });

            this.setHireData(hireData);
            this.extractTalentName(); // Extract talent name after setting data
          } else {
            console.warn('⚠️ No data returned');
          }

          this.isLoading = false;
        },
        error: (error: any) => {
          setTimeout(() => (this.showSpinner = false), 2000);
          console.error('❌ Error loading hire details:', error);
          this.isLoading = false;
        },
      });
  }

  private loadAllDataAndFindTalent(scouterId: string, talentId: string) {
    console.log('🔄 Loading all data to search for talent:', talentId);

    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        limit: 10,
      })
      .subscribe({
        next: (response: any) => {
          const allData = (response.data as TotalHires[]) || [];
          console.log(`📊 Total records loaded: ${allData.length}`);

          // Try to find the talent by various methods
          let hireData = this.findTalentInData(allData, talentId);

          if (hireData) {
            console.log('✅ Found in all data:', hireData.name);
            this.setHireData(hireData);
            this.extractTalentName(); // Extract talent name
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
        },
      });
  }

  private findTalentInData(
    data: TotalHires[],
    talentId: string,
  ): TotalHires | undefined {
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
      (item: TotalHires) =>
        item.email?.toLowerCase().includes(talentId.toLowerCase()),
      // 6. Check if name contains the search string
      (item: TotalHires) =>
        item.name?.toLowerCase().includes(talentId.toLowerCase()),
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

  private findExactTalent(
    data: TotalHires[],
    talentId: string,
  ): TotalHires | undefined {
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
    // First check all possible field names
    console.log('🔍 ALL POSSIBLE COMMENT FIELDS:', {
      satisFactoryCommentByScouter: hireData.satisFactoryCommentByScouter,
      scouterComment: (hireData as any).scouterComment,
      comments: (hireData as any).comments,
      remark: (hireData as any).remark,
      // Check the actual object structure
      allKeys: Object.keys(hireData),
    });

    // Try multiple possible field names
    const scouterCommentRaw =
      hireData.satisFactoryCommentByScouter ||
      (hireData as any).scouterComment ||
      (hireData as any).comments?.scouter ||
      '';

    const talentCommentRaw =
      hireData.satisFactoryCommentByTalent ||
      (hireData as any).talentComment ||
      (hireData as any).comments?.talent ||
      '';

    console.log('🔍 Setting hire data:', {
      id: hireData.id,
      name: hireData.name,
      satisFactoryCommentByScouter: hireData.satisFactoryCommentByScouter,
      satisFactoryCommentByTalent: hireData.satisFactoryCommentByTalent,
    });

    // Parse comments with better error handling
    const scouterParsed = this.parseSatisfactoryComment(
      hireData.satisFactoryCommentByScouter,
    );

    const talentParsed = this.parseSatisfactoryComment(
      hireData.satisFactoryCommentByTalent,
    );

    console.log('🧪 PARSED RESULTS:', {
      scouter: scouterParsed,
      talent: talentParsed,
      rawScouter: hireData.satisFactoryCommentByScouter,
      rawTalent: hireData.satisFactoryCommentByTalent,
    });

    this.hire = {
      ...hireData,

      // Map the API fields to your frontend fields
      yourComment: scouterParsed.remark?.trim() || '',
      yourRating: Number(scouterParsed.rating) || 0,

      talentComment: talentParsed.remark?.trim() || '',
      talentRating: Number(talentParsed.rating) || 0,
    };

    // Keep the userName for other uses but extract talent name separately
    this.userName = hireData?.name || 'Unknown Talent';
    this.extractTalentName(); // Extract talent name from the hire data

    console.log('✅ Final hire object:', {
      talentName: this.talentName,
      yourComment: this.hire.yourComment,
      yourRating: this.hire.yourRating,
      talentComment: this.hire.talentComment,
      talentRating: this.hire.talentRating,
    });

    if (this.shouldOpenModalOnLoad) {
      this.openModalAfterDataLoad();
    }
  }

  // Helper method to fix malformed JSON
  private fixMalformedJSON(jsonString: string): string {
    if (!jsonString) return jsonString;

    try {
      // Try to parse first
      JSON.parse(jsonString);
      return jsonString; // Already valid
    } catch (error) {
      // Fix common JSON issues
      let fixed = jsonString;

      // 1. Fix missing quotes around property names
      fixed = fixed.replace(/(\w+):/g, '"$1":');

      // 2. Fix trailing commas
      fixed = fixed.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

      // 3. Fix missing closing brackets
      if (fixed.startsWith('{') && !fixed.endsWith('}')) {
        fixed = fixed + '}';
      }

      // 4. Fix unescaped quotes in strings
      fixed = fixed.replace(
        /:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g,
        (match, content) => {
          return ': "' + content.replace(/"/g, '\\"') + '"';
        },
      );

      try {
        JSON.parse(fixed);
        return fixed;
      } catch (e) {
        console.warn('Could not fix JSON:', jsonString);
        return jsonString;
      }
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

  onTableHireClick(hire: TotalHires) {
    console.log('📋 Table hire clicked in detail page:', hire.name);

    // Check current route talent ID
    const currentTalentId = this.route.snapshot.paramMap.get('id');

    if (currentTalentId === hire.id || currentTalentId === hire.talentId) {
      // Already on the same talent page - update the current hire
      this.setHireData(hire);
      this.extractTalentName();

      console.log('✅ Updated current hire to:', hire.name);

      // IMPORTANT: Check if we should open a modal based on status
      if (hire.offerStatus === 'Offer Rejected') {
        console.log('✅ Opening Reconsider Modal from table click');
        this.openReconsiderModal(hire);
      } else if (hire.offerStatus === 'Offer Accepted') {
        // Check if talent has been rated before opening modal
        if (this.checkIfTalentHasBeenRated(hire)) {
          console.log('❌ Talent already rated, not opening modal');
          this.toastService.openSnackBar(
            `You have already rated ${hire.name}. You cannot evaluate them again.`,
            'warning',
          );
        } else {
          console.log('✅ Opening Total Delivery Modal from table click');
          this.openTotalDeliveryModal(hire);
        }
      }
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
        navigationExtras,
      );
    }
  }

  // Add a method to get the hire rating status
  getHireRatingStatus(hire: any): {
    rated: boolean;
    rating: number;
    comment: string;
  } {
    return {
      rated: this.checkIfTalentHasBeenRated(hire),
      rating: hire.yourRating || 0,
      comment: hire.yourComment || '',
    };
  }

  private updateStatsWithHire(hire: TotalHires) {
    console.log('📊 Updating stats with hire:', hire.name);

    // Update the current hire
    this.setHireData(hire);
    this.extractTalentName(); // Extract talent name

    // This will automatically update the stats component through the tabs component
    // since the initialHire input is bound
  }

  private assignHire(hireData: TotalHires) {
    this.setHireData(hireData);
    this.extractTalentName(); // Extract talent name
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

  // Add this to your setTab method or create a new method
  setTab(tab: 'engagements' | 'stats') {
    this.isTabSwitchInProgress = true;
    this.activeTab = tab;

    // Close any open modals when switching tabs
    if (this.isTotalDeliveryModalOpen) {
      this.closeTotalDeliveryModal();
    }

    // Reset the flag after a short delay
    setTimeout(() => {
      this.isTabSwitchInProgress = false;
    }, 100);
  }

  // Open modals based on status
  openTotalDeliveryModal(hire: any) {
    // Check if modal should open
    if (!this.shouldOpenModal()) {
      console.log('Modal opening blocked by conditions');
      return;
    }

    console.log('Opening Total Delivery Modal for:', hire.name);

    // Check if hire status is correct
    if (hire.offerStatus !== 'Offer Accepted') {
      console.log(`${hire.offerStatus} - not opening total delivery modal`);
      return;
    }

    // CRITICAL: Check if talent has already been rated
    this.checkIfTalentHasBeenRated(hire);

    if (this.hasTalentBeenRated) {
      console.log('Talent already rated, showing toast and not opening modal');
      this.toastService.openSnackBar(
        `You have already rated ${hire.name}. You cannot evaluate them again.`,
        'warning',
      );
      return;
    }

    this.selectedModalHire = hire;
    this.isTotalDeliveryModalOpen = true;
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

    this.hasTalentBeenRated = hasRating || hasComment || hasAPIComment;

    console.log('Checking if talent has been rated:', {
      hireName: hire.name,
      yourRating: hire.yourRating,
      yourComment: hire.yourComment,
      satisFactoryCommentByScouter: hire.satisFactoryCommentByScouter,
      hasRating,
      hasComment,
      hasAPIComment,
      hasTalentBeenRated: this.hasTalentBeenRated,
    });

    return this.hasTalentBeenRated;
  }

  openReconsiderModal(hire: any) {
    console.log('Opening Reconsider Modal for:', hire.name);

    if (hire.offerStatus !== 'Offer Rejected') {
      console.log(`${hire.offerStatus} - not opening reconsider modal`);
      return;
    }

    this.selectedTalentForReconsider = hire;
    this.isReconsiderModalOpen = true;
  }

  // Modal close handlers
  closeTotalDeliveryModal() {
    console.log('Closing total delivery modal');

    // First, set the flag to false
    this.isTotalDeliveryModalOpen = false;

    // Clear the selected hire after a delay to ensure modal closes
    setTimeout(() => {
      this.selectedModalHire = null;
    }, 100);

    // Clear any navigation state flags
    this.shouldOpenModalOnLoad = false;
    this.modalTypeToOpen = '';
  }

  private shouldOpenModal(): boolean {
    // Don't open modal if we're loading
    if (this.isLoading) return false;

    // Don't open modal if tab switch is in progress
    if (this.isTabSwitchInProgress) return false;

    // Don't open modal if it's already open
    if (
      this.isTotalDeliveryModalOpen ||
      this.isReconsiderModalOpen ||
      this.isReconsiderOfferModalOpen
    ) {
      return false;
    }

    return true;
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
        this.isReconsiderOfferModalOpen,
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
      `Revised offer sent to ${this.getTalentDisplayName()}. Status updated to "Awaiting Acceptance".`,
      'success',
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

    if (!scouterId || !this.selectedTalentForReconsider) {
      console.error('❌ Missing required data');
      return;
    }

    // ✅ Get the actual market hire data
    const talentData = this.selectedTalentForReconsider;

    // ✅ Check if we have proper IDs - CRITICAL: Use the correct IDs from the API response
    if (!talentData.marketHireId || !talentData.talentId) {
      console.error('❌ Missing required IDs for reconsider offer:', {
        marketHireId: talentData.marketHireId,
        talentId: talentData.talentId,
        talentIdWithDate: talentData.talentIdWithDate,
        id: talentData.id,
        allKeys: Object.keys(talentData),
      });

      // Try alternative ID sources
      const marketHireId = talentData.marketHireId || talentData.id;
      const talentId =
        talentData.talentId || talentData.talentIdWithDate || talentData.id;

      if (!marketHireId || !talentId) {
        this.toastService.openSnackBar(
          'Cannot reconsider offer: Missing required data. Please refresh and try again.',
          'error',
        );
        return;
      }
    }

    // Prepare payload according to the endpoint specification
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDateForPayload(currentDate);

    // Parse the date properly
    let formattedStartDate;
    try {
      formattedStartDate = this.formatDateForPayload(
        new Date(offerData.startDate),
      );
    } catch (error) {
      console.warn('⚠️ Could not parse start date, using current date:', error);
      formattedStartDate = formattedCurrentDate;
    }

    // Prepare the satisfactory comment
    const satisFactoryCommentByScouter = JSON.stringify({
      scouterId: scouterId,
      dateOfComment: formattedCurrentDate,
      remark: offerData.satisfactoryComment || '(Proposal Reconsidered)',
      rating: offerData.satisfactoryRating || 0,
    });

    const payload = {
      hireStatus: 'awaiting-acceptance',
      amountToPay: offerData.amount.toString(),
      jobDescription: offerData.jobDescription,
      startDate: formattedStartDate,
      dateOfHire: formattedCurrentDate,
      satisFactoryCommentByScouter: satisFactoryCommentByScouter,
    };

    // Use the correct IDs - try multiple sources
    const marketHireId = talentData.marketHireId || talentData.id;
    const talentId =
      talentData.talentId || talentData.talentIdWithDate || talentData.id;

    console.log('✅ Sending reconsider offer with:', {
      payload,
      params: {
        talentId: talentId,
        scouterId: scouterId,
        marketHireId: marketHireId,
      },
      rawPayload: JSON.stringify(payload, null, 2),
    });

    // Call the PATCH endpoint
    this.scouterService
      .toggleMarketStatus(payload, {
        talentId: talentId,
        scouterId: scouterId,
        marketHireId: marketHireId,
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Offer reconsidered successfully:', response);
          this.toastService.openSnackBar(
            'Offer reconsidered successfully!',
            'success',
          );

          // Refresh the data after successful reconsideration
          this.loadHireDetails(talentId);

          // Also update the table if it exists
          if (this.marketTableComponent) {
            this.marketTableComponent.loadMarketEngagements();
          }
        },
        error: (error) => {
          console.error('❌ Failed to reconsider offer:', error);

          // Detailed error logging
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            error: error.error,
            message: error.message,
            url: error.url,
          });

          this.toastService.openSnackBar(
            error?.error?.message ||
              error?.statusText ||
              'Failed to reconsider offer',
            'error',
          );
        },
      });
  }

  // Helper method for date formatting
  private formatDateForPayload(date: Date): string {
    // Format: DD-MM-YYYY HH:mm (as shown in your example)
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
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
      mock = MockRecentHires.find(
        (m) =>
          m.talentId?.includes(talentId) ||
          m.id?.toString().includes(talentId) ||
          m.email?.toLowerCase().includes(talentId.toLowerCase()),
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
      this.extractTalentName(); // Extract talent name
      console.log('✅ Found in mock data:', this.hire.name);
    } else {
      console.error('❌ No mock data found for talent ID:', talentId);
      this.hire = this.createFallbackHire(talentId);
      this.extractTalentName(); // Extract talent name even from fallback
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

  private parseSatisfactoryComment(raw?: string): {
    remark: string;
    rating: number;
  } {
    console.log('🔄 Parsing comment:', raw);

    if (!raw || raw === 'undefined' || raw === 'null') {
      console.log('⚠️ No comment or invalid value');
      return { remark: '', rating: 0 };
    }

    try {
      // If it's already a valid JSON string, parse it directly
      if (raw.startsWith('{') && raw.endsWith('}')) {
        const parsed = JSON.parse(raw);
        console.log('✅ Parsed JSON:', parsed);
        return {
          remark: parsed?.remark || parsed?.comments || '',
          rating: Number(parsed?.rating || parsed?.score || 0),
        };
      }

      // Try to fix and parse malformed JSON
      const fixed = this.fixMalformedJSON(raw);
      const parsed = JSON.parse(fixed);
      console.log('✅ Fixed and parsed:', parsed);

      return {
        remark: parsed?.remark || parsed?.comments || parsed?.comment || '',
        rating: Number(parsed?.rating || parsed?.score || 0),
      };
    } catch (error) {
      console.error('❌ Failed to parse comment:', error, 'Raw:', raw);
      // Return as plain text if not JSON
      return { remark: raw, rating: 0 };
    }
  }

  // Format date for display
  formatCommentDate(dateString: string): string {
    if (!dateString) return '';

    try {
      // Try to parse various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  }

  // Helper method to format hire status for display
  formatHireStatus(status: string): string {
    if (!status) return 'Unknown';

    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Offer Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-rejected': 'Offer Rejected',
      pending: 'Pending',
    };

    return (
      statusMap[status] ||
      status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
    );
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
