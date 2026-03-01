import { Component, OnInit, OnDestroy } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { firstValueFrom } from 'rxjs';
import { ToastsService } from 'src/app/services/toasts.service';
import { ToggleVisibilitySharedStateService } from 'src/app/services/toggleVisibilitySharedState.service'; // Add this import

Chart.register(...registerables);

interface RecentHire {
  name: string;
  date: string;
  amount: number;
  avatar: string;
  hireStatus: string;
  marketHireId: string;
  scouterName?: string;
  raw?: any;
}

interface MarketRating {
  date: string;
  yourRating: number;
  scouterRating: number;
  marketId?: string;
  rawDate?: string;
}

interface TalentDashboardStats {
  talentsTotalMarketEngagements: number;
  talentsTotalMarketOfferAccepted: number;
  talentsTotalMarketOfferDeclined: number;
  talentsTotalMarketsAwaitingAcceptance: number;
  marketRatings: any[];
  recentHires: any[];
  totalValueThisMonth: number;
}

interface WalletData {
  currentAcctBalance: string;
  wallet_id?: string;
  uniqueId?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-talent-dashboard',
  templateUrl: './talent-dashboard.component.html',
  styleUrls: ['./talent-dashboard.component.scss'],
  standalone: false,
})
export class TalentDashboardComponent implements OnInit, OnDestroy {
  // Spinner
  loading = 'Loading...';
  showSpinner = true;
  currentYear = new Date().getFullYear();

  balanceHidden = false;

  // User details
  talentStats: TalentDashboardStats | null = null;
  talentId = '';

  userName = 'User';
  timeOfDay = '';
  timeIcon = '';
  myIcon = imageIcons.infoIcon;

  useMockData: boolean = false;
  showMockBadge = false;

  // Header scroll state
  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  // Wallet
  walletBalance = 0;
  walletLoading = false;
  walletData: WalletData | null = null;

  // onboarding flags
  hasMarketProfile = false;
  isNewUser = false;

  // Dashboard data structures
  dashboardCards = [
    { title: 'Total Market Engagement', value: 0, status: '' },
    { title: 'Total Offer Accepted', value: 0, status: 'active' },
    { title: 'Total Offer Rejected', value: 0, status: 'inactive' },
    { title: 'Total Offer Awaiting Acceptance', value: 0, status: 'pending' },
  ];

  dashboardStatCards: { title: string; value: number; status: string }[] = [];
  percentageCircles: {
    size: number;
    color: string;
    percentage: number;
    title?: string;
  }[] = [];

  // Ratings chart data
  ratingsData: MarketRating[] = [];
  ratingsChart: Chart | null = null;

  // Recent hires
  recentHires: RecentHire[] = [];

  // simple image object if you store a common NoData image
  images = {
    NoDataImage: 'assets/images/NoDataImage.svg',
  };
  hasWalletProfile: boolean | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private endpointService: EndpointService,
    private toast: ToastsService,
    private toggleVisibilityService: ToggleVisibilitySharedStateService, // Add this
  ) {}

  async getWalletProfile(){
    try{
      const userData:any = localStorage.getItem('user_data');
      const talentId = localStorage.getItem('talentId') ?? JSON.parse(userData)?.talentId;
      const response = await firstValueFrom(this.endpointService.fetchWalletProfile(talentId));
      if(response){
        this.hasWalletProfile = true;
      }
    }catch (e:any) {
      console.clear();
      console.log("error status>>",e?.status);
      console.error("error>>",e?.error?.message ?? e?.message);
      if(e?.status === 404){
        this.hasWalletProfile = false;
      }
    }
  }

  async routeToWalletOnboarding(){
    console.clear();
   await this.router.navigateByUrl("/talent/wallet-page/wallet-profile");
  }

  async ngOnInit(): Promise<void> {
    console.log('ngOnInit has started running...');
    await this.getWalletProfile();
    // Load balance visibility state BEFORE other initialization
    await this.loadBalanceVisibilityState();

    // Load talentId from storage
    this.talentId =
      localStorage.getItem('talentId') ||
      sessionStorage.getItem('talentId') ||
      '';
    console.log('Dashboard loaded with talentId:', this.talentId);

    if (!this.talentId) {
      console.warn('No talentId found. Redirecting to login.');
      await this.router.navigate(['/login']);
      return;
    }

    // Initialize UI
    this.setTimeOfDay();
    this.getTalentDetails();
    await this.loadTalentProfile();

    // Load wallet data first (for balance display)
    await this.fetchWalletBalance();

    // Load dashboard data
    await this.loadDashboardData();

    // Check onboarding status
    this.checkMarketProfileStatus();

    if (this.isNewUser) {
      this.prepareNewUserDashboard();
    }

    // Hide Spinner after data is loaded
    setTimeout(() => (this.showSpinner = false), 2000);
  }

  ngOnDestroy(): void {
    // Clean up chart instance
    if (this.ratingsChart) {
      this.ratingsChart.destroy();
      this.ratingsChart = null;
    }
  }

  private async loadBalanceVisibilityState(): Promise<void> {
    try {
      this.balanceHidden =
        await this.toggleVisibilityService.getBalanceVisibility();
      console.log(
        '✅ Balance visibility loaded from service:',
        this.balanceHidden,
      );
    } catch (error) {
      console.error('Error loading balance visibility state:', error);
      this.balanceHidden = false; // Default value
    }
  }

  private saveBalanceVisibilityState(): void {
    try {
      localStorage.setItem(
        'balanceVisibilityState',
        JSON.stringify(this.balanceHidden),
      );
      console.log('💾 Balance visibility state saved:', this.balanceHidden);

      // Also save to sessionStorage for additional persistence
      sessionStorage.setItem(
        'balanceVisibilityState',
        JSON.stringify(this.balanceHidden),
      );
    } catch (error) {
      console.error('Error saving balance visibility state:', error);
    }
  }

  async toggleBalanceVisibility(event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation(); // Prevent triggering the card click
    }

    // Use the service to toggle and save
    this.balanceHidden =
      await this.toggleVisibilityService.toggleBalanceVisibility(
        this.balanceHidden,
      );
    // console.log('👁️ Balance visibility toggled to:', this.balanceHidden);

    // Optional: Show a brief toast notification
    // const message = this.balanceHidden ? 'Balance hidden' : 'Balance visible';
    // this.toast.openSnackBar(message, 'success');
  }

  async routeToWallet(event?: Event): Promise<void> {
    if (event) {
      // Check if the click came from the toggle button
      const target = event.target as HTMLElement;
      const toggleButton = target.closest('button');
      if (toggleButton) {
        return; // Don't navigate if toggle was clicked
      }
    }

    await this.router.navigate(['/talent/wallet-page']);
  }

  private async fetchWalletBalance(): Promise<void> {
    this.walletLoading = true;
    console.log('Fetching wallet balance...');

    try {
      // Get user identifiers
      const currentUser = this.authService.getCurrentUser();
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const talentProfile = JSON.parse(
        localStorage.getItem('talentProfile') || '{}',
      );

      // Get wallet_id and uniqueId from various possible sources
      const walletId =
        currentUser?.walletId ||
        userData?.walletId ||
        talentProfile?.walletId ||
        talentProfile?.details?.walletId ||
        this.walletData?.wallet_id;

      const uniqueId =
        this.talentId || // Use the talentId from storage
        currentUser?.id ||
        userData?.id ||
        talentProfile?.id ||
        talentProfile?.details?.id;

      console.log('Wallet fetch params:', {
        walletId,
        uniqueId,
        talentId: this.talentId,
      });

      // Call the wallet API
      const response: any = await firstValueFrom(
        this.endpointService.fetchMyWallet(walletId, uniqueId),
      );

      console.log('Wallet API Response:', response);

      if (response?.walletNotFound) {
        console.log('Wallet not created yet');
        this.walletBalance = 0;
        this.walletData = null;
      } else if (response && response.data) {
        this.walletData = response.data;

        // Parse current account balance with null check
        if (this.walletData && this.walletData.currentAcctBalance) {
          const balanceStr = this.walletData.currentAcctBalance;
          // Remove any commas and convert to number
          const cleanedBalance = balanceStr.replace(/,/g, '');
          this.walletBalance = parseFloat(cleanedBalance) || 0;
          console.log(
            'Wallet balance parsed:',
            this.walletBalance,
            'from string:',
            balanceStr,
          );
        } else {
          this.walletBalance = 0;
        }

        // Save wallet data to localStorage for future use
        localStorage.setItem('walletData', JSON.stringify(this.walletData));
      } else {
        // Handle case where response doesn't have expected structure
        console.warn('Unexpected wallet API response structure:', response);
        this.walletBalance = 0;
        this.walletData = null;
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      this.toast.openSnackBar('Unable to load wallet balance', 'warning');
      this.walletBalance = 0;
      this.walletData = null;
    } finally {
      this.walletLoading = false;
    }
  }

  async loadDashboardData(): Promise<void> {
    if (this.useMockData) {
      console.log('Mock mode active — using local dashboard data');
      this.loadMockData();
      return;
    }

    try {
      console.log('Fetching live dashboard stats...');
      await this.fetchTalentStats();
    } catch (error) {
      console.error('fetchTalentStats() failed:', error);
      this.toast.openSnackBar(
        'Unable to load dashboard statistics. Using sample data.',
        'warning',
      );
      this.loadMockData();
    }
  }

  private loadMockData(): void {
    console.log('Loading mock dashboard data...');

    // Mock Dashboard Metrics
    this.dashboardCards = [
      { title: 'Total Market Engagement', value: 21, status: '' },
      { title: 'Total Offer Accepted', value: 18, status: 'active' },
      { title: 'Total Offer Rejected', value: 1, status: 'inactive' },
      { title: 'Total Offer Awaiting Acceptance', value: 2, status: 'pending' },
    ];

    // Derived Percentage Stats
    this.dashboardStatCards = [
      { title: 'Offers Accepted', value: 85.71, status: 'active' },
      { title: 'Waiting Acceptance', value: 9.25, status: 'pending' },
      { title: 'Offers Rejected', value: 4.76, status: 'inactive' },
    ];

    // Create Concentric Percentage Circles
    this.updatePercentageCircles();

    // Mock Ratings
    this.ratingsData = [
      { date: '17/Sep/2024', yourRating: 5, scouterRating: 4 },
      { date: '17/Sep/2024', yourRating: 3, scouterRating: 5 },
      { date: '18/Sep/2024', yourRating: 3, scouterRating: 4 },
      { date: '18/Sep/2024', yourRating: 3, scouterRating: 5 },
    ];

    // Mock Recent Hires
    this.recentHires = [
      {
        name: 'Adediji Samuel Oluwaseyi',
        date: 'Oct 17, 2024, 8:25AM',
        amount: 400000.0,
        avatar: 'assets/images/portrait-african-american-man.jpg',
        hireStatus: 'offer-accepted',
        marketHireId: 'mock-id-1',
        scouterName: 'Adediji Samuel',
      },
      {
        name: 'Kehinde Jude Omosehin',
        date: 'Sep 17, 2024, 9:45AM',
        amount: 700000.0,
        avatar: 'assets/images/portrait-african-american-man.jpg',
        hireStatus: 'offer-declined',
        marketHireId: 'mock-id-2',
        scouterName: 'Kehinde Jude',
      },
    ];

    // Initialize Charts
    setTimeout(() => this.initRatingsChart(), 300);

    // Use wallet balance if available, otherwise mock
    if (this.walletBalance === 0) {
      this.walletBalance = 30000.0;
    }

    console.log('✅ Mock data loaded successfully.');
  }

  private prepareNewUserDashboard(): void {
    this.dashboardCards = [
      { title: 'Total Market Engagement', value: 0, status: '' },
      { title: 'Total Offer Accepted', value: 0, status: 'active' },
      { title: 'Total Offer Rejected', value: 0, status: 'inactive' },
      { title: 'Total Offer Awaiting Acceptance', value: 0, status: 'pending' },
    ];

    this.dashboardStatCards = [
      { title: 'Offers Accepted', value: 0, status: 'active' },
      { title: 'Waiting Acceptance', value: 0, status: 'pending' },
      { title: 'Offers Rejected', value: 0, status: 'inactive' },
    ];

    this.updatePercentageCircles();
    this.ratingsData = [];
    this.recentHires = [];
    // Don't reset wallet balance for new users - they might have a wallet
  }

  async fetchTalentStats(): Promise<void> {
    const talentId =
      localStorage.getItem('talentId') || sessionStorage.getItem('talentId');

    if (!talentId) {
      console.warn('Talent ID not found, skipping stats fetch');
      return;
    }

    try {
      const response: any = await firstValueFrom(
        this.endpointService.fetchTalentStats(talentId),
      );
      console.log('Talent Stats Response:', response);

      if (response) {
        this.processApiResponse(response);
      } else {
        throw new Error('Empty response from API');
      }
    } catch (error) {
      console.error('Error fetching talent stats:', error);
      throw error;
    }
  }

  private processApiResponse(response: any): void {
    // Set the complete stats object
    this.talentStats = response;

    // 1. Update dashboard cards from API response
    this.dashboardCards = [
      {
        title: 'Total Market Engagement',
        value: response.talentsTotalMarketEngagements || 0,
        status: '',
      },
      {
        title: 'Total Offer Accepted',
        value: response.talentsTotalMarketOfferAccepted || 0,
        status: 'active',
      },
      {
        title: 'Total Offer Rejected',
        value: response.talentsTotalMarketOfferDeclined || 0,
        status: 'inactive',
      },
      {
        title: 'Total Offer Awaiting Acceptance',
        value: response.talentsTotalMarketsAwaitingAcceptance || 0,
        status: 'pending',
      },
    ];

    // 2. Calculate percentages
    const totalEngagements = response.talentsTotalMarketEngagements || 0;
    const accepted = response.talentsTotalMarketOfferAccepted || 0;
    const declined = response.talentsTotalMarketOfferDeclined || 0;
    const awaiting = response.talentsTotalMarketsAwaitingAcceptance || 0;

    // Calculate percentages based on total engagements
    const acceptedPercentage =
      totalEngagements > 0 ? (accepted / totalEngagements) * 100 : 0;
    const declinedPercentage =
      totalEngagements > 0 ? (declined / totalEngagements) * 100 : 0;
    const awaitingPercentage =
      totalEngagements > 0 ? (awaiting / totalEngagements) * 100 : 0;

    this.dashboardStatCards = [
      {
        title: 'Offers Accepted',
        value: Math.round(acceptedPercentage * 100) / 100,
        status: 'active',
      },
      {
        title: 'Waiting Acceptance',
        value: Math.round(awaitingPercentage * 100) / 100,
        status: 'pending',
      },
      {
        title: 'Offers Rejected',
        value: Math.round(declinedPercentage * 100) / 100,
        status: 'inactive',
      },
    ];

    // 3. Update percentage circles
    this.updatePercentageCircles();

    // 4. Process market ratings
    if (response.marketRatings && Array.isArray(response.marketRatings)) {
      this.processMarketRatings(response.marketRatings);
    }

    // 5. Process recent hires
    if (response.recentHires && Array.isArray(response.recentHires)) {
      this.processRecentHires(response.recentHires);
    }

    // 6. Use wallet balance from wallet API (not from talent stats)
    // The wallet balance is already fetched separately
    // If talent stats has totalValueThisMonth, we can use it as fallback
    if (
      response.totalValueThisMonth !== undefined &&
      this.walletBalance === 0
    ) {
      this.walletBalance = response.totalValueThisMonth || 0;
    }

    // 7. Initialize charts
    setTimeout(() => this.initRatingsChart(), 100);
  }

  private updatePercentageCircles(): void {
    const baseSize = 120;
    this.percentageCircles = this.dashboardStatCards
      .map((card, index) => ({
        size: baseSize + index * 40,
        color: this.getPercentageStatusColor(card.status),
        percentage: card.value,
        title: card.title,
      }))
      .reverse();
  }

  private processMarketRatings(marketRatings: any[]): void {
    // Filter ratings where either talent or scouter has a score > 0
    const validRatings = marketRatings.filter(
      (rating) =>
        (rating.talentScore && rating.talentScore > 0) ||
        (rating.scouterScore && rating.scouterScore > 0),
    );

    if (validRatings.length === 0) {
      this.ratingsData = [];
      return;
    }

    // Transform and sort by date
    this.ratingsData = validRatings
      .map((rating) => {
        const dateStr = rating.dateOfHire;
        let formattedDate = dateStr;

        try {
          // Parse date from format like "24/January/2026:1:27am"
          if (dateStr.includes('/')) {
            const parts = dateStr.split(':')[0].split('/'); // Get date part before time
            if (parts.length === 3) {
              const day = parts[0];
              const month = parts[1].substring(0, 3); // Get first 3 letters of month
              const year = parts[2];
              formattedDate = `${day}/${month}/${year}`;
            }
          }
        } catch (e) {
          console.error('Error parsing date:', e);
        }

        return {
          date: formattedDate,
          yourRating: rating.talentScore || 0,
          scouterRating: rating.scouterScore || 0,
          marketId: rating.marketId,
          rawDate: dateStr,
        };
      })
      .sort((a, b) => {
        // Sort by date for better chart display
        const dateA = new Date(a.rawDate || a.date);
        const dateB = new Date(b.rawDate || b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 10); // Limit to 10 most recent

    console.log('Processed ratings data:', this.ratingsData);
  }

  private processRecentHires(recentHires: any[]): void {
    if (!recentHires || recentHires.length === 0) {
      this.recentHires = [];
      return;
    }

    // Transform recent hires for display
    this.recentHires = recentHires.map((hire) => {
      // Parse amount from string like "410000" or "450,000"
      let amount = 0;
      if (hire.amountToPay) {
        try {
          amount =
            parseFloat(hire.amountToPay.toString().replace(/,/g, '')) || 0;
        } catch (e) {
          console.error('Error parsing amount:', e);
        }
      }

      // Format date
      let formattedDate = hire.dateOfHire || '';
      try {
        // Handle format like "Jan 24, 2026, 1:27 AM"
        if (hire.dateOfHire && hire.dateOfHire.includes(',')) {
          const parts = hire.dateOfHire.split(',');
          if (parts.length >= 2) {
            formattedDate = `${parts[0]},${parts[1]}`.trim();
          }
        }
      } catch (e) {
        console.error('Error parsing hire date:', e);
      }

      // Get scouter picture or use default
      const avatar =
        hire.scouterPicture && hire.scouterPicture.trim() !== ''
          ? hire.scouterPicture
          : 'assets/images/default-avatar.png';

      return {
        name: hire.scouterName || 'Unknown Scouter',
        date: formattedDate,
        amount: amount,
        avatar: avatar,
        hireStatus: hire.hireStatus || 'awaiting-acceptance',
        marketHireId: hire.marketHireId || '',
        scouterName: hire.scouterName,
        raw: hire,
      };
    });

    console.log('Processed recent hires:', this.recentHires);
  }

  async goToViewHires(): Promise<void> {
    const talentId =
      localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.warn(
        'talentId not found — navigating to view-hires without preloaded data',
      );
      await this.router.navigate(['/view-hires']);
      return;
    }

    const paginationParams = { limit: 10, pageNo: 1 };

    try {
      this.endpointService
        .fetchMarketsByTalent(talentId, paginationParams, '', '')
        .subscribe({
          next: async (response: any) => {
            const markets = this.base64JsonDecode(response?.details) || [];
            await this.router.navigate(['/view-hires'], { state: { markets } });
          },
          error: (error) => {
            console.error('Error fetching markets by talent:', error);
            // navigate but view-hires should handle empty state
            this.router.navigate(['/view-hires']);
          },
        });
    } catch (err) {
      console.error('Error while requesting markets:', err);
      await this.router.navigate(['/view-hires']);
    }
  }

  private decodeBase64Json(b64: string): any {
    try {
      if (!b64) return null;
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const jsonString = new TextDecoder().decode(bytes);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decoding base64 JSON:', error);
      return null;
    }
  }

  getTalentDetails() {
    try {
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        this.userName =
          parsedProfile.fullName ||
          parsedProfile.details?.user?.fullName ||
          this.userName;
        if (this.userName !== 'User') return;
      }

      const talentDetails = this.authService.decodeTalentDetails();
      this.userName =
        talentDetails?.fullName ||
        talentDetails?.details?.user?.fullName ||
        this.userName;
    } catch (error) {
      console.error('Error loading talent details:', error);
    }
  }

  private async loadTalentProfile(): Promise<void> {
    this.showSpinner = true;
    this.loading = "Fetching Talent's Dashboard...";
    console.log('✔️ loadTalentProfile() started');

    this.talentId =
      localStorage.getItem('talentId') ||
      sessionStorage.getItem('talentId') ||
      '';
    console.log('Loaded talentId:', this.talentId);

    if (!this.talentId) {
      console.warn('❌ No talentId found. Skipping loadTalentProfile.');
      return;
    }

    try {
      const res: any = await firstValueFrom(
        this.endpointService.fetchTalentProfile(this.talentId),
      );
      console.log('FULL API RESPONSE:', res);

      if (!res || !res.details) {
        console.warn('⚠️ Invalid response structure from API.');
        return;
      }

      // Save user name
      const name = res?.details?.user?.fullName;
      if (name) this.userName = name;

      // Persist profile for caching
      localStorage.setItem('talentProfile', JSON.stringify(res));

      // Extract and parse onboarding data
      const onboardingRaw =
        res?.completeOnboarding ||
        res?.details?.completeOnboarding ||
        res?.details?.user?.completeOnboarding;

      console.log('Raw onboarding from API:', onboardingRaw);

      let onboardingObj: any = {};

      if (onboardingRaw) {
        try {
          if (typeof onboardingRaw === 'string') {
            onboardingObj = JSON.parse(onboardingRaw);
            if (typeof onboardingObj === 'string') {
              onboardingObj = JSON.parse(onboardingObj);
            }
          } else {
            onboardingObj = onboardingRaw;
          }
        } catch (err) {
          onboardingObj = {};
        }
      }

      // Ensure hasMarketProfile exists
      if (!('hasMarketProfile' in onboardingObj)) {
        onboardingObj.hasMarketProfile = onboardingObj.isOTPVerified === true;
      }

      console.log('Final normalized onboarding object:', onboardingObj);

      // Save final onboarding
      sessionStorage.setItem(
        'completeOnboarding',
        JSON.stringify(onboardingObj),
      );
    } catch (error) {
      console.error('❌ Error loading talent profile:', error);
      setTimeout(() => (this.showSpinner = true), 2000);
    }
  }

  proceedToMarketProfile(): void {
    const talentProfile =
      localStorage.getItem('user_data') ||
      localStorage.getItem('user_profile_data') ||
      localStorage.getItem('talentProfile');
    const talentId = talentProfile ? JSON.parse(talentProfile)?.talentId : null;

    if (!talentId) {
      this.toast.openSnackBar(
        'Talent ID not found. Please log in again.',
        'warning',
      );
      return;
    }

    this.router.navigate(['/create-record', talentId]);
  }

  private checkMarketProfileStatus(): void {
    const onboardingRaw = sessionStorage.getItem('completeOnboarding');
    const parsed = this.parseOnboarding(onboardingRaw);

    if (parsed && typeof parsed === 'object' && 'hasMarketProfile' in parsed) {
      this.hasMarketProfile = Boolean(parsed.hasMarketProfile);
      this.isNewUser = !this.hasMarketProfile;
    } else {
      this.hasMarketProfile = false;
      this.isNewUser = true;
    }

    console.debug(
      'Onboarding parsed:',
      parsed,
      'hasMarketProfile:',
      this.hasMarketProfile,
      'isNewUser:',
      this.isNewUser,
    );
  }

  private parseOnboarding(raw: string | null): any {
    if (!raw) return null;

    try {
      let parsed = JSON.parse(raw);

      // Handle double-encoded JSON from API
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }

      return parsed;
    } catch (err) {
      console.error('Failed to parse completeOnboarding:', err, raw);
      return null;
    }
  }

  private initRatingsChart(): void {
    // Destroy existing chart
    if (this.ratingsChart) {
      this.ratingsChart.destroy();
      this.ratingsChart = null;
    }

    // Only init if there is rating data
    if (!this.ratingsData || this.ratingsData.length === 0) return;

    const ctx = document.getElementById('ratingsChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Create new chart
    this.ratingsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ratingsData.map((r) => r.date),
        datasets: [
          {
            label: 'Your Ratings',
            data: this.ratingsData.map((r) => r.yourRating),
            backgroundColor: '#3B82F6',
            borderColor: '#2563EB',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: "Scouter's Ratings",
            data: this.ratingsData.map((r) => r.scouterRating),
            backgroundColor: '#7C3AED',
            borderColor: '#6D28D9',
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#4B5563',
              font: {
                size: 12,
              },
              padding: 20,
            },
          },
          tooltip: {
            backgroundColor: '#1F2937',
            titleColor: '#F9FAFB',
            bodyColor: '#F9FAFB',
            borderColor: '#374151',
            borderWidth: 1,
            cornerRadius: 6,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 6,
            ticks: {
              stepSize: 1,
              color: '#6B7280',
            },
            grid: {
              color: '#E5E7EB',
            },
          },
          x: {
            ticks: {
              color: '#6B7280',
              maxRotation: 45,
              minRotation: 45,
            },
            grid: {
              color: '#E5E7EB',
            },
          },
        },
      },
    });
  }

  onContentScroll(event: any) {
    this.scrollPosition = event.detail.scrollTop;
    if (
      this.scrollPosition > this.previousScrollPosition &&
      this.scrollPosition > 100
    ) {
      this.headerHidden = true;
    } else if (this.scrollPosition < this.previousScrollPosition) {
      this.headerHidden = false;
    }
    this.previousScrollPosition = this.scrollPosition;
  }

  trackByCircle(index: number): number {
    return index;
  }

  getCircumference(radius: number): number {
    return 2 * Math.PI * radius;
  }

  getStrokeDashoffset(radius: number, percentage: number): number {
    if (isNaN(percentage)) percentage = 0;
    const circumference = this.getCircumference(radius);
    return circumference - (percentage / 100) * circumference;
  }

  getProgressDotPosition(
    radius: number,
    percentage: number,
    circleSize: number,
  ) {
    if (isNaN(percentage)) percentage = 0;
    const center = circleSize / 2;
    const angleInRadians = ((percentage / 100) * 360 - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians),
    };
  }

  private setTimeOfDay(): void {
    const hour = new Date().getHours();
    if (hour < 5) {
      this.timeOfDay = 'Night';
      this.timeIcon = imageIcons.Night;
    } else if (hour < 12) {
      this.timeOfDay = 'Morning';
      this.timeIcon = imageIcons.Morning;
    } else if (hour < 17) {
      this.timeOfDay = 'Afternoon';
      this.timeIcon = imageIcons.Afternoon;
    } else if (hour < 21) {
      this.timeOfDay = 'Evening';
      this.timeIcon = imageIcons.Evening;
    } else {
      this.timeOfDay = 'Night';
      this.timeIcon = imageIcons.Night;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#189537';
      case 'pending':
        return '#FFA086';
      case 'inactive':
        return '#CC0000';
      default:
        return '#79797B';
    }
  }

  getPercentageStatusColor(status: string): string {
    return this.getStatusColor(status);
  }

  // Helper to get status text for hire status
  getHireStatusText(status: string): string {
    switch (status) {
      case 'offer-accepted':
        return 'Accepted';
      case 'offer-declined':
        return 'Declined';
      case 'awaiting-acceptance':
        return 'Awaiting';
      default:
        return 'Pending';
    }
  }

  // Helper to get status class for hire status
  getHireStatusClass(status: string): string {
    switch (status) {
      case 'offer-accepted':
        return 'text-green-600';
      case 'offer-declined':
        return 'text-red-600';
      case 'awaiting-acceptance':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  private base64JsonDecode(b64: string): any {
    try {
      if (!b64) return null;
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (e) {
      console.error('Failed to decode base64 JSON:', e);
      return null;
    }
  }

  // Refresh wallet balance (can be called from UI if needed)
  async refreshWalletBalance(): Promise<void> {
    await this.fetchWalletBalance();
    this.toast.openSnackBar('Wallet balance refreshed', 'success');
  }
}
