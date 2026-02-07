import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Router } from '@angular/router';
import {
  MockRecentHires,
  HireCategories,
  HireFilters,
} from 'src/app/models/mocks';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';

export interface TotalHires {
  id: string;
  profilePic: string;
  name: string;
  email: string;
  date: string;
  startDate: string;
  amount: number;
  offerStatus: 'Offer Accepted' | 'Awaiting Acceptance' | 'Offer Rejected';
  status: 'Active' | 'Pending' | 'Away' | string;

  jobDescription: string;
  yourComment: string;
  yourRating: number;
  talentComment: string;
  talentRating: number;

  marketHireId: string;
  scouterId: string;
  talentId: string;

  scouterPhoneNumber?: string;
  talentPhoneNumber?: string;

  _originalData?: any;
}

// Add interface for talent performance data
interface TalentPerformanceData {
  concernedTalentId: string;
  talentName: string;
  talentEmail: string;
  talentPicture: string;
  count: string;
}

@Component({
  selector: 'app-view-all-hires-page',
  templateUrl: './view-all-hires-page.component.html',
  styleUrls: ['./view-all-hires-page.component.scss'],
  standalone: false,
})
export class ViewAllHiresPageComponent implements OnInit {
  @ViewChild('categoryDisplaySection') categoryDisplaySection!: ElementRef;

  MockRecentHires: TotalHires[] = [];
  isLoading: boolean = false;
  allMarketData: TotalHires[] = [];

  userName: string = '';

  categories = HireCategories;
  filters = HireFilters;

  headerHidden: boolean = false;
  images = imageIcons;
  currentMonth: string = new Date().toLocaleString('en-US', { month: 'short' });
  currentYear: number = new Date().getFullYear();

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 10;
  isFilterOpen: boolean = false;

  // ✅ REGULAR PROPERTY instead of getter
  totalPages: number = 1;

  slideshowTexts: string[] = [
    `Your Total Market Expenditures for the Month of ${this.currentMonth} is calculating...`,
    'Keep engaging more skilled talents for a rewarding experience on Oniduuru Marketplace... Well done!',
  ];

  // Add talent performance data properties
  talentPerformanceData: {
    mostHiredTalent: TalentPerformanceData[];
    leastHiredTalent: TalentPerformanceData[];
    topPerformers: TalentPerformanceData[];
    underperformers: TalentPerformanceData[];
  } = {
    mostHiredTalent: [],
    leastHiredTalent: [],
    topPerformers: [],
    underperformers: [],
  };

  // Add performance loading state
  isPerformanceLoading: boolean = false;

  constructor(
    private router: Router,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService,
    // private toastController: ToastController
    private toast: ToastsService,
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadMarketEngagements();
    this.loadTalentPerformanceGrading(); // Add this line
  }

  private checkIfTalentHasBeenRated(hire: any): boolean {
    return (
      (hire.yourRating && hire.yourRating > 0) ||
      (hire.yourComment && hire.yourComment.trim() !== '') ||
      (hire.satisFactoryCommentByScouter &&
        hire.satisFactoryCommentByScouter.trim() !== '' &&
        hire.satisFactoryCommentByScouter !== 'undefined' &&
        hire.satisFactoryCommentByScouter !== 'null')
    );
  }

  viewMarketPricePreposition(data: string | TotalHires) {
    let talentIdToUse: string;
    let hireObject: TotalHires | undefined;

    if (typeof data === 'string') {
      // Handle string (talentId)
      console.log('📊 Navigating to market price for talent ID:', data);

      hireObject = this.MockRecentHires.find(
        (h) => h.id === data || h.talentId === data || h.marketHireId === data,
      );

      talentIdToUse = hireObject?.talentId || data;
    } else {
      // Handle TotalHires object
      console.log('📊 Navigating with hire object:', data.name);
      hireObject = data;

      // Check if talent has already been rated
      if (
        this.checkIfTalentHasBeenRated(data) &&
        data.offerStatus === 'Offer Accepted'
      ) {
        this.toast.openSnackBar(
          `You have already rated ${data.name}. You cannot evaluate them again.`,
          'warning',
        );
        return;
      }

      // IMPORTANT: Use the correct ID that the API expects
      talentIdToUse = data.talentId || data.id || data.marketHireId;
    }

    console.log('🎯 Talent ID to navigate with:', talentIdToUse);

    // Create a clean hire object to pass
    const hireDataToPass = hireObject
      ? {
          ...hireObject,
          // Ensure all required properties exist
          jobDescription: hireObject.jobDescription || '',
          yourComment: hireObject.yourComment || '',
          yourRating: hireObject.yourRating || 0,
          talentComment: hireObject.talentComment || '',
          talentRating: hireObject.talentRating || 0,
        }
      : undefined;

    this.router.navigate(
      ['/scouter/market-engagement-market-price-preparation', talentIdToUse],
      {
        state: {
          hireData: hireDataToPass || {
            id: talentIdToUse,
            talentId: talentIdToUse,
            name: hireObject?.name || 'Unknown Talent',
            email: hireObject?.email || '',
            profilePic:
              hireObject?.profilePic || 'assets/images/default-avatar.png',
          },
          shouldOpenModal: false, // Don't open modal automatically
          source: 'view-hires-page',
        },
      },
    );
  }

  private loadTalentPerformanceGrading() {
    this.isPerformanceLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found for performance grading');
      this.isPerformanceLoading = false;
      return;
    }

    console.log(
      '📊 Loading talent performance grading for scouter:',
      scouterId,
    );

    this.scouterService.getTalentPerformanceGrading(scouterId).subscribe({
      next: (response) => {
        console.log('✅ Talent performance grading loaded:', response);

        if (response.data) {
          this.talentPerformanceData = {
            mostHiredTalent: response.data.mostHiredTalent || [],
            leastHiredTalent: response.data.leastHiredTalent || [],
            topPerformers: response.data.topPerformers || [],
            underperformers: response.data.underperformers || [],
          };

          console.log('📊 Performance data parsed:', {
            mostHired: this.talentPerformanceData.mostHiredTalent.length,
            leastHired: this.talentPerformanceData.leastHiredTalent.length,
            topPerformers: this.talentPerformanceData.topPerformers.length,
            underperformers: this.talentPerformanceData.underperformers.length,
          });
        }

        this.isPerformanceLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading talent performance grading:', error);
        this.isPerformanceLoading = false;

        // Set empty data on error
        this.talentPerformanceData = {
          mostHiredTalent: [],
          leastHiredTalent: [],
          topPerformers: [],
          underperformers: [],
        };

        this.toast.openSnackBar(
          'Failed to load talent performance data. Using mock data.',
          'error',
        );
        this.fallbackToMockPerformanceData(); // Optional: fallback to mock data
      },
    });
  }

  private fallbackToMockPerformanceData() {
    // Optional: Provide mock data when API fails
    // This keeps the UI functional even if API is down
    this.talentPerformanceData = {
      mostHiredTalent: this.MockRecentHires.slice(0, 2).map((hire) => ({
        concernedTalentId: hire.talentId || hire.id,
        talentName: hire.name,
        talentEmail: hire.email,
        talentPicture: hire.profilePic,
        count: '2 occurence',
      })),
      leastHiredTalent: this.MockRecentHires.slice(2, 4).map((hire) => ({
        concernedTalentId: hire.talentId || hire.id,
        talentName: hire.name,
        talentEmail: hire.email,
        talentPicture: hire.profilePic,
        count: '1 occurence',
      })),
      topPerformers: [],
      underperformers: [],
    };
  }

  // Add this method to your component
  testDirectApiCall() {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      return;
    }

    console.log('🧪 Direct API Test:', {
      scouterId,
      expectedFormat: 'scouter/XXXX/DateString',
    });

    // Test the exact format from your curl example
    const testScouterId = 'scouter/6985/29September2025'; // Replace with actual
    console.log('🧪 Testing with scouterId:', testScouterId);

    this.scouterService
      .getAllMarketsByScouter(testScouterId, { limit: 5 })
      .subscribe({
        next: (response) => {
          console.log('✅ Direct test success:', response);
        },
        error: (error) => {
          console.error('❌ Direct test failed:', error);
        },
      });
  }

  private loadUserData() {
    const currentUser = this.authService.getCurrentUser();

    console.log('🔍 DEBUG - User Data Structure:', {
      user: currentUser,
      scouterId: currentUser?.scouterId,
      id: currentUser?.id,
      allProperties: currentUser ? Object.keys(currentUser) : 'No user',
    });

    if (currentUser) {
      this.userName =
        currentUser.fullName ||
        currentUser.name ||
        currentUser.firstName ||
        'Scouter';

      // Check if scouterId has the correct format
      const scouterId = currentUser.scouterId;
      console.log('🔍 Scouter ID Analysis:', {
        value: scouterId,
        type: typeof scouterId,
        hasForwardSlash: scouterId?.includes('/'),
        expectedFormat: 'scouter/XXXX/DateString',
        isValid: scouterId?.startsWith('scouter/'),
      });
    } else {
      this.userName = 'Scouter';
      console.log('🔍 No current user found');
    }
  }

  loadMarketEngagements(
    statusParams?: string,
    pageNo: number = 1,
    searchText?: string,
  ) {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    console.log('🔍 DEBUG - Current User:', currentUser);
    console.log('🔍 DEBUG - Scouter ID:', scouterId);

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.isLoading = false;
      return;
    }

    const params: any = {
      limit: 10,
      pageNo: pageNo,
    };

    if (statusParams) {
      params.statusParams = statusParams;
    }

    if (searchText && searchText.trim() !== '') {
      params.searchText = searchText.trim();
    }

    console.log('📊 API Request Params:', params);
    console.log(
      '🔗 Full URL would be:',
      `/market/v1/get-all-markets/scouter/${encodeURIComponent(scouterId)}`,
    );

    this.scouterService.getAllMarketsByScouter(scouterId, params).subscribe({
      next: (response) => {
        console.log('✅ API Response Structure:', {
          response: response,
          hasData: response.data,
          dataLength: response.data?.length,
          dataType: typeof response.data,
          rawResponse: response.rawResponse,
        });

        this.MockRecentHires = response.data || [];
        this.allMarketData = response.data || [];

        console.log('📊 Transformed Data:', this.MockRecentHires);

        this.currentPage = response.currentPage || 1;
        this.totalPages = response.totalPages || 1;

        this.updateSlideshowText();
        this.isLoading = false;
        this.loadTalentPerformanceGrading();
      },
      error: (error) => {
        console.error('❌ Error loading market engagements:', {
          error: error,
          message: error.message,
          status: error.status,
          fullError: error,
        });
        this.MockRecentHires = [];
        this.allMarketData = [];
        this.currentPage = 1;
        this.totalPages = 1;
        this.isLoading = false;

        // this.showError('Failed to load market engagements. Please try again.');
        this.toast.openSnackBar(
          'Failed to load market engagements. Please try again.',
          'error',
        );
      },
    });
  }

  private updateSlideshowText() {
    const totalExpenditure = this.totalMarketExpenditure;

    if (this.MockRecentHires.length > 0) {
      this.slideshowTexts = [
        `Your Total Market Expenditures for the Month of ${
          this.currentMonth
        } is ₦${totalExpenditure.toLocaleString()}`,
        'Keep engaging more skilled talents for a rewarding experience on Oniduuru Marketplace... Well done!',
      ];
    } else {
      this.slideshowTexts = [
        `Your Total Market Expenditures for the Month of ${this.currentMonth} is calculating...`,
        'Keep engaging more skilled talents for a rewarding experience on Oniduuru Marketplace... Well done!',
      ];
    }
  }

  // Private helper method for navigation
  private navigateWithHire(hire: TotalHires) {
    console.log('🚀 Navigating to talent detail page:', hire.name);
    console.log('📊 Hire data being passed:', {
      id: hire.id,
      talentId: hire.talentId,
      name: hire.name,
    });

    // CRITICAL: Use hire.talentId instead of hire.id if talentId is what the API expects
    const talentIdToUse = hire.talentId || hire.id;

    this.router.navigate(
      ['/scouter/market-engagement-market-price-preparation', talentIdToUse],
      {
        queryParams: {
          talentId: hire.talentId,
          name: hire.name,
          email: hire.email,
          source: 'view-hires-page', // Add source for debugging
        },
        state: {
          hireData: hire, // Pass the full object in state
        },
      },
    );
  }

  onPerformanceTalentClick(talentData: TalentPerformanceData) {
    console.log('📊 Performance talent clicked:', talentData.talentName);
    console.log(
      '🎯 Talent ID from performance data:',
      talentData.concernedTalentId,
    );

    // Check if the ID is in the correct format
    if (!talentData.concernedTalentId.startsWith('talent/')) {
      console.warn(
        '⚠️ Talent ID might not be in correct format:',
        talentData.concernedTalentId,
      );
    }

    // Find in current data
    const hire = this.MockRecentHires.find(
      (h) =>
        h.talentId === talentData.concernedTalentId ||
        (h as any).talentIdWithDate === talentData.concernedTalentId,
    );

    if (hire) {
      console.log('✅ Found in current data');
      this.viewMarketPricePreposition(hire);
    } else {
      // Navigate with the concernedTalentId directly
      console.log('📤 Navigating directly with concernedTalentId');

      this.router.navigate(
        [
          '/scouter/market-engagement-market-price-preparation',
          talentData.concernedTalentId,
        ],
        {
          queryParams: {
            talentId: talentData.concernedTalentId,
            name: talentData.talentName,
            email: talentData.talentEmail,
            source: 'performance-category',
          },
        },
      );
    }
  }

  setActiveCategoryTable(categoryKey: string) {
    this.activeCategoryTable = categoryKey;

    let statusParams: string | undefined;
    switch (categoryKey) {
      case 'all':
        statusParams = undefined;
        break;
      case 'accepted':
        statusParams = 'offer-accepted';
        break;
      case 'awaiting':
        statusParams = 'awaiting-acceptance';
        break;
      case 'declined':
        statusParams = 'offer-declined';
        break;
    }

    this.loadMarketEngagements(statusParams, 1, this.searchTerm);
    this.currentPage = 1;
  }

  onSearch() {
    console.log('🔍 Searching with term:', this.searchTerm);

    let statusParams: string | undefined;
    if (this.activeCategoryTable) {
      switch (this.activeCategoryTable) {
        case 'all':
          statusParams = undefined;
          break;
        case 'accepted':
          statusParams = 'offer-accepted';
          break;
        case 'awaiting':
          statusParams = 'awaiting-acceptance';
          break;
        case 'declined':
          statusParams = 'offer-declined';
          break;
      }
    }

    this.loadMarketEngagements(statusParams, 1, this.searchTerm);
    this.currentPage = 1;
  }

  getFilterStatus(key: string): string {
    return this.filters.find((f) => f.key === key)?.status || '';
  }

  getFilterTitle(key: string): string {
    return this.filters.find((f) => f.key === key)?.title || '';
  }

  getSlideAnimationDuration(text: string): string {
    const baseDuration = 15;
    const extraPerChar = 0.3;
    const duration = baseDuration + text.length * extraPerChar;
    return `${duration}s`;
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

  activeCategoryBtn: string | null = null;
  activeCategoryTable: string | null = null;

  setActiveCategoryBtn(categoryKey: string) {
    if (this.activeCategoryBtn === categoryKey) {
      this.activeCategoryBtn = null;
    } else {
      this.activeCategoryBtn = categoryKey;
      setTimeout(() => {
        this.scrollToCategoryDisplay();
      }, 100);
    }
  }

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getOccurrences(): Record<string, number> {
    return this.MockRecentHires.reduce(
      (acc, hire) => {
        acc[hire.email] = (acc[hire.email] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  getHireCount(hire: TotalHires): number | string {
    // If we have original performance data, extract count from "2 occurence" format
    if (hire._originalData && hire._originalData.count) {
      // Extract the number from "2 occurence" string
      const match = hire._originalData.count.match(/(\d+)/);
      return match ? match[1] + ' occurence' : hire._originalData.count;
    }

    // Fallback to local calculation
    const occurrences = this.getOccurrences();
    return occurrences[hire.email] || 0;
  }

  getUniqueHires(): TotalHires[] {
    return Object.values(
      this.MockRecentHires.reduce(
        (acc, hire) => {
          if (!acc[hire.email]) {
            acc[hire.email] = {
              ...hire,
              jobDescription: hire.jobDescription ?? '',
              yourComment: hire.yourComment ?? '',
              yourRating: hire.yourRating ?? 0,
              talentComment: hire.talentComment ?? '',
              talentRating: hire.talentRating ?? 0,
            };
          }
          return acc;
        },
        {} as Record<string, TotalHires>,
      ),
    );
  }

  getCategoryCount(categoryKey: string): number {
    // If using performance data, get count from API data
    if (this.shouldUsePerformanceData()) {
      switch (categoryKey) {
        case 'most':
          return this.talentPerformanceData.mostHiredTalent.length;
        case 'least':
          return this.talentPerformanceData.leastHiredTalent.length;
        case 'top':
          return this.talentPerformanceData.topPerformers.length;
        case 'under':
          return this.talentPerformanceData.underperformers.length;
        default:
          return 0;
      }
    }

    // Fallback to local calculation
    return this.filterByLocalCategory(categoryKey).length;
  }

  getActiveCategoryTitle(): string {
    return (
      this.categories.find((c) => c.key === this.activeCategoryBtn)?.title || ''
    );
  }

  get filteredHires(): TotalHires[] {
    if (!this.activeCategoryBtn) return [];
    return this.filterByCategory(this.activeCategoryBtn);
  }

  private filterByCategory(categoryKey: string): TotalHires[] {
    // If we have performance data from API, use it
    if (this.shouldUsePerformanceData()) {
      return this.filterByPerformanceCategory(categoryKey);
    }

    // Fallback to original logic if no performance data
    return this.filterByLocalCategory(categoryKey);
  }

  private filterByPerformanceCategory(categoryKey: string): TotalHires[] {
    let performanceData: TalentPerformanceData[] = [];

    switch (categoryKey) {
      case 'most':
        performanceData = this.talentPerformanceData.mostHiredTalent;
        break;
      case 'least':
        performanceData = this.talentPerformanceData.leastHiredTalent;
        break;
      case 'top':
        performanceData = this.talentPerformanceData.topPerformers;
        break;
      case 'under':
        performanceData = this.talentPerformanceData.underperformers;
        break;
      default:
        return [];
    }

    // Convert performance data to TotalHires format with proper type casting
    return performanceData
      .map((talent) => ({
        id: talent.concernedTalentId,
        profilePic: talent.talentPicture || 'assets/images/default-avatar.png',
        name: talent.talentName,
        email: talent.talentEmail,
        date: 'N/A',
        startDate: 'N/A',
        amount: 0,
        offerStatus: 'Offer Accepted' as 'Offer Accepted', // Explicit type assertion
        status: 'Active' as 'Active', // Explicit type assertion
        jobDescription: '',
        yourComment: '',
        yourRating: 0,
        talentComment: '',
        talentRating: 0,
        marketHireId: '',
        scouterId: '',
        talentId: talent.concernedTalentId,
        scouterPhoneNumber: undefined,
        talentPhoneNumber: undefined,
        _originalData: talent,
      }))
      .slice(0, 4); // Limit to 4 items as per your UI
  }
  private filterByLocalCategory(categoryKey: string): TotalHires[] {
    if (!this.MockRecentHires.length) return [];

    const occurrences = this.getOccurrences();
    const uniqueHires = this.getUniqueHires();

    const counts = Object.values(occurrences);
    const maxCount = counts.length ? Math.max(...counts) : 0;
    const minCount = counts.length ? Math.min(...counts) : 0;

    let hires: TotalHires[] = [];

    switch (categoryKey) {
      case 'most':
        hires = uniqueHires.filter((h) => occurrences[h.email] === maxCount);
        break;
      case 'least':
        hires = uniqueHires.filter((h) => occurrences[h.email] === minCount);
        break;
      case 'under':
        hires = uniqueHires.filter((h) => h.amount < 50000);
        break;
      case 'top':
        hires = uniqueHires.filter((h) => h.amount >= 100000);
        break;
      default:
        hires = [];
    }

    return hires.slice(0, 4);
  }

  private shouldUsePerformanceData(): boolean {
    // Use performance data if we have it and it's not empty
    return (
      this.talentPerformanceData &&
      (this.talentPerformanceData.mostHiredTalent.length > 0 ||
        this.talentPerformanceData.leastHiredTalent.length > 0 ||
        this.talentPerformanceData.topPerformers.length > 0 ||
        this.talentPerformanceData.underperformers.length > 0)
    );
  }

  private scrollToCategoryDisplay() {
    if (this.categoryDisplaySection) {
      this.categoryDisplaySection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  private filterByStatus(filterKey: string): TotalHires[] {
    if (!this.MockRecentHires.length) return [];

    if (filterKey === 'all') {
      return this.MockRecentHires.map((hire) => ({
        ...hire,
        jobDescription: hire.jobDescription ?? '',
        yourComment: hire.yourComment ?? '',
        yourRating: hire.yourRating ?? 0,
        talentComment: hire.talentComment ?? '',
        talentRating: hire.talentRating ?? 0,
      }));
    }

    const status = this.getFilterStatus(filterKey);
    return this.MockRecentHires.filter((h) => h.offerStatus === status).map(
      (hire) => ({
        ...hire,
        jobDescription: hire.jobDescription ?? '',
        yourComment: hire.yourComment ?? '',
        yourRating: hire.yourRating ?? 0,
        talentComment: hire.talentComment ?? '',
        talentRating: hire.talentRating ?? 0,
      }),
    );
  }

  get totalMarketExpenditure(): number {
    if (!this.MockRecentHires.length) return 0;
    return this.MockRecentHires.reduce((sum, hire) => sum + hire.amount, 0);
  }

  get hasMarketExpenditure(): boolean {
    return this.totalMarketExpenditure > 0;
  }

  get filteredAndSearchedHires() {
    let hires: TotalHires[] = this.activeCategoryTable
      ? this.filterByStatus(this.activeCategoryTable)
      : (this.MockRecentHires as TotalHires[]);

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      hires = hires.filter(
        (h) =>
          h.name.toLowerCase().includes(term) ||
          h.email.toLowerCase().includes(term),
      );
    }

    return hires;
  }

  get paginatedHires(): TotalHires[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      let statusParams: string | undefined;
      if (this.activeCategoryTable) {
        switch (this.activeCategoryTable) {
          case 'accepted':
            statusParams = 'offer-accepted';
            break;
          case 'awaiting':
            statusParams = 'awaiting-acceptance';
            break;
          case 'declined':
            statusParams = 'offer-declined';
            break;
        }
      }

      this.loadMarketEngagements(
        statusParams,
        this.currentPage + 1,
        this.searchTerm,
      );
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      let statusParams: string | undefined;
      if (this.activeCategoryTable) {
        switch (this.activeCategoryTable) {
          case 'accepted':
            statusParams = 'offer-accepted';
            break;
          case 'awaiting':
            statusParams = 'awaiting-acceptance';
            break;
          case 'declined':
            statusParams = 'offer-declined';
            break;
        }
      }

      this.loadMarketEngagements(
        statusParams,
        this.currentPage - 1,
        this.searchTerm,
      );
    }
  }

  refreshData() {
    let statusParams: string | undefined;
    if (this.activeCategoryTable) {
      switch (this.activeCategoryTable) {
        case 'accepted':
          statusParams = 'offer-accepted';
          break;
        case 'awaiting':
          statusParams = 'awaiting-acceptance';
          break;
        case 'declined':
          statusParams = 'offer-declined';
          break;
      }
    }

    this.loadMarketEngagements(statusParams, this.currentPage, this.searchTerm);
  }
}
