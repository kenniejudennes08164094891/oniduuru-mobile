import {
  Component,
  OnInit,
  HostListener,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { MakePaymentPopupModalComponent } from 'src/app/utilities/modals/make-payment-popup-modal/make-payment-popup-modal.component';
import { PaymentService } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToggleVisibilitySharedStateService } from 'src/app/services/toggleVisibilitySharedState.service';

export interface RecentHire {
  id: string;
  profilePic: string;
  name: string;
  date: string;
  time?: string; // Make optional
  dateTime?: string; // Make optional
  amount: number;
  offerStatus: string;
  status: string;
  marketHireId: string;
  talentId: string;
  scouterId: string;
  _raw?: any; // For debugging
}

@Component({
  selector: 'app-scouter-dashboard',
  templateUrl: './scouter-dashboard.component.html',
  styleUrls: ['./scouter-dashboard.component.scss'],
  standalone: false,
})
export class ScouterDashboardComponent implements OnInit, OnChanges {
  RecentHires: RecentHire[] = []; // Will be populated with real data
  marketRatingsData: any[] = [];

  // Add these properties to your component class
  walletBalance: number = 0;
  balanceHidden: boolean = false;
  walletLoading: boolean = false;
  notificationCount: number = 0;
  images = imageIcons;
  loading: string = 'Loading...';
  showSpinner: boolean = true;
  userName: string = '';
  balance: number = 50220.1;
  timeOfDay: string = '';
  timeIcon: string = '';
  currentYear: number = new Date().getFullYear();
  totalValue: number = 0;
  percentageCirclesUnpaid: {
    size: number;
    color: string;
    percentage: number;
    title: string;
  }[] = [];
  percentageCirclesPaid: {
    size: number;
    color: string;
    percentage: number;
    title: string;
  }[] = [];
  paymentStatus: any;
  scouterDetails: any; // Add this to store scouter details

  // New properties for header scroll behavior
  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  // Dashboard cards
  dashboardCardsUnpaid = [
    {
      title: 'Total Market Engagement',
      value: 0,
      status: '', // grey
    },
    {
      title: 'Total Offer Accepted',
      value: 0,
      status: 'active', // green
    },
    {
      title: 'Total Offer Rejected',
      value: 0,
      status: 'inactive', // red
    },
    {
      title: 'Total Offer Awaiting Acceptance',
      value: 0,
      status: 'pending', // yellow
    },
  ];

  dashboardCardsPaid = [
    {
      title: 'Total Market Engagement',
      value: 21,
      status: '', // grey
    },
    {
      title: 'Total Offer Accepted',
      value: 17,
      status: 'active', // green
    },
    {
      title: 'Total Offer Rejected',
      value: 2,
      status: 'inactive', // red
    },
    {
      title: 'Total Offer Awaiting Acceptance',
      value: 2,
      status: 'pending', // yellow
    },
  ];

  // Add the missing dashboardStatCards array
  dashboardStatCardsUnpaid = [
    { title: 'Awaiting Acceptance', value: 0, status: 'pending' },
    { title: 'Offer Accepted', value: 0, status: 'active' },
    { title: 'Offer Rejected', value: 0, status: 'inactive' },
  ];

  dashboardStatCardsPaid = [
    { title: 'Awaiting Acceptance', value: 0, status: 'pending' },
    { title: 'Offer Accepted', value: 0, status: 'active' },
    { title: 'Offer Rejected', value: 0, status: 'inactive' },
  ];

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private scouterEndpointsService: ScouterEndpointsService,
    private toastService: ToastsService,
    private endpointService: EndpointService,
    private toggleVisibilityService: ToggleVisibilitySharedStateService,
  ) {}

  // Add this method to check what's being passed to the child component
  async ngOnInit(): Promise<void> {
    this.getScouterDetails();
    this.setTimeOfDay();
    this.fetchWalletBalance();

    // Initialize balance visibility state
    await this.initializeBalanceVisibility();

    // Just load from localStorage - data is already initialized by AppInitService
    this.loadNotificationCount();

    // ✅ Set up listener for real-time updates
    this.setupNotificationListener();

    const id = this.route.snapshot.paramMap.get('id');

    // Subscribe to paymentStatus
    this.paymentService.paymentStatus$.subscribe((status) => {
      this.paymentStatus = status;
    });

    this.initializeDashboardData();
    this.loadDashboardData();
  }

  async toggleBalanceVisibility(): Promise<void> {
    // Use the service to toggle and save
    this.balanceHidden =
      await this.toggleVisibilityService.toggleBalanceVisibility(
        this.balanceHidden,
      );
    console.log(
      '👁️ Dashboard balance visibility toggled to:',
      this.balanceHidden,
    );
  }


    async goToWalletPage(): Promise<void> {
    await this.router.navigate(['/scouter/wallet-page']);
  }

  private async initializeBalanceVisibility(): Promise<void> {
    try {
      this.balanceHidden =
        await this.toggleVisibilityService.getBalanceVisibility();
      console.log(
        '🔍 Dashboard initialized balance visibility:',
        this.balanceHidden,
      );
    } catch (error) {
      console.error('Error initializing balance visibility:', error);
      this.balanceHidden = false; // Default value
    }
  }

  private fetchWalletBalance(): void {
    this.walletLoading = true;

    // Get user identifiers (similar to wallet page)
    const currentUser = this.authService.getCurrentUser();
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');

    const walletId =
      currentUser?.walletId ||
      userData?.walletId ||
      userData?.wallet?.id ||
      userData?.walletAccountNumber;

    const uniqueId =
      currentUser?.id ||
      userData?.id ||
      userData?.userId ||
      userData?.scouterId;

    console.log('🔍 Fetching wallet balance:', { walletId, uniqueId });

    // Call the endpoint service to fetch wallet
    this.endpointService.fetchMyWallet(walletId, uniqueId).subscribe({
      next: (res: any) => {
        this.walletLoading = false;

        if (res?.walletNotFound) {
          console.log('Wallet not created yet');
          this.walletBalance = 0;
          return;
        }

        if (res && res.data) {
          const walletData = res.data;
          this.walletBalance = parseFloat(walletData.currentAcctBalance) || 0;
          console.log('💰 Wallet balance loaded:', this.walletBalance);
        }
      },
      error: (error: any) => {
        this.walletLoading = false;
        console.error('Error fetching wallet balance:', error);
        this.walletBalance = 0;
      },
    });
  }

  // ✅ ENHANCED: Load notification count
  private loadNotificationCount(): void {
    const storedCount = localStorage.getItem('notification_count');
    this.notificationCount = storedCount ? parseInt(storedCount, 10) : 0;
    console.log(
      '📬 Dashboard: Loaded notification count:',
      this.notificationCount,
    );
  }

  // ✅ NEW: Setup notification listener for dashboard
  private setupNotificationListener(): void {
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'notification_count') {
        const newCount = parseInt(event.newValue || '0', 10);
        this.notificationCount = newCount;
      }
    };

    window.addEventListener('storage', storageHandler);
  }

  getScouterDetails() {
    this.showSpinner = true;
    this.loading = "Fetching Scouter's Dashboard...";
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        this.userName = this.extractUserName(parsedUser);
        setTimeout(() => (this.showSpinner = false), 2000);
        return;
      } catch (error) {
        console.error('Error parsing user_data from localStorage:', error);
        setTimeout(() => (this.showSpinner = false), 2000);
      }
    }

    // Final fallback
    console.warn('No user details found');
    this.userName = 'User';
  }

  private extractUserName(userData: any): string {
    if (!userData) return 'User';

    console.log('🔍 Extracting user name from:', userData);

    // Try different possible structures and property names
    const user =
      userData.details?.user ||
      userData.user ||
      userData.data?.user ||
      userData;

    // Try multiple possible property names for full name
    let fullName = 'User';

    // First, check if we have separate first and last name
    if (user.firstName && user.lastName) {
      fullName = `${user.firstName} ${user.lastName}`.trim();
    }
    // Check for full name in various formats
    else if (user.fullName) {
      fullName = user.fullName;
    } else if (user.fullname) {
      fullName = user.fullname;
    } else if (user.name) {
      fullName = user.name;
    } else if (user.username) {
      fullName = user.username;
    } else if (user.displayName) {
      fullName = user.displayName;
    }
    // Try email as last resort
    else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      // Capitalize first letter of email username
      fullName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    console.log('✅ Extracted user name:', fullName);
    return fullName;
  }

  private loadDashboardData(): void {
    // Get scouter ID from auth service or localStorage
    const scouterId =
      this.authService.getCurrentUser()?.scouterId ||
      localStorage.getItem('id');

    console.log('🔍 Loading dashboard data for scouterId:', scouterId);

    if (!scouterId) {
      console.warn('No scouter ID found, using mock data');
      return;
    }

    this.scouterEndpointsService.getScouterStats(scouterId).subscribe({
      next: (stats: any) => {
        console.log('📊 FULL Dashboard stats received:', stats);
        console.log('📈 Market ratings count:', stats.marketRatings?.length);
        console.log('👥 Recent hires count:', stats.recentHires?.length);
        console.log('💵 Recent hires data:', stats.recentHires);
        console.log('🎯 Stats structure:', {
          engagements: stats.scoutersTotalMarketEngagements,
          accepted: stats.scoutersTotalMarketOfferAccepted,
          declined: stats.scoutersTotalMarketOfferDeclined,
          awaiting: stats.scoutersTotalMarketsAwaitingAcceptance,
        });

        // Update dashboard with real data
        this.updateDashboardWithRealData(stats);
      },
      error: (error: any) => {
        console.error('❌ Failed to load dashboard stats:', error);
        console.error('Error details:', error.message, error.status);
      },
    });
  }

  // Add this method to track changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes['RecentHires']) {
      console.log('🔄 RecentHires changed in parent:', {
        old: changes['RecentHires'].previousValue?.length,
        new: changes['RecentHires'].currentValue?.length,
        data: changes['RecentHires'].currentValue,
      });
    }
  }

  private updateDashboardWithRealData(stats: any): void {
    console.log('📊 Dashboard stats received:', stats);

    // Store market ratings
    this.marketRatingsData = stats.marketRatings || [];

    // Update both paid and unpaid dashboard cards with real data
    this.dashboardCardsUnpaid = [
      {
        title: 'Total Market Engagement',
        value: stats.scoutersTotalMarketEngagements || 0,
        status: '',
      },
      {
        title: 'Total Offer Accepted',
        value: stats.scoutersTotalMarketOfferAccepted || 0,
        status: 'active',
      },
      {
        title: 'Total Offer Rejected',
        value: stats.scoutersTotalMarketOfferDeclined || 0,
        status: 'inactive',
      },
      {
        title: 'Total Offer Awaiting Acceptance',
        value: stats.scoutersTotalMarketsAwaitingAcceptance || 0,
        status: 'pending',
      },
    ];

    this.dashboardCardsPaid = [
      {
        title: 'Total Market Engagement',
        value: stats.scoutersTotalMarketEngagements || 0,
        status: '',
      },
      {
        title: 'Total Offer Accepted',
        value: stats.scoutersTotalMarketOfferAccepted || 0,
        status: 'active',
      },
      {
        title: 'Total Offer Rejected',
        value: stats.scoutersTotalMarketOfferDeclined || 0,
        status: 'inactive',
      },
      {
        title: 'Total Offer Awaiting Acceptance',
        value: stats.scoutersTotalMarketsAwaitingAcceptance || 0,
        status: 'pending',
      },
    ];

    // Update recent hires in the RecentHiresDashboardComponent
    if (stats.recentHires && stats.recentHires.length > 0) {
      this.updateRecentHiresComponent(stats.recentHires);
    }

    // Update recent market ratings
    if (stats.marketRatings && stats.marketRatings.length > 0) {
      this.updateRecentMarketRatingsComponent(stats.marketRatings);
    }

    // Recalculate percentages
    this.initializeDashboardData();
  }

  private updateRecentHiresComponent(recentHires: any[]): void {
    console.log('🔄 Processing recent hires:', recentHires);

    if (!recentHires || recentHires.length === 0) {
      console.log('No recent hires data');
      this.RecentHires = [];
      return;
    }

    // Transform API data to match the structure expected by the template
    const transformedHires = recentHires.map((hire) => {
      console.log('Processing hire object:', hire);

      let formattedDate = '';
      let formattedTime = '';
      let dateTime = '';

      if (hire.dateOfHire) {
        try {
          const dateString = hire.dateOfHire.toString();
          console.log('Original date string:', dateString);

          // Handle format like "Jan 16, 2026, 1:31 PM"
          if (dateString.includes(',')) {
            const parts = dateString.split(',');
            if (parts.length >= 3) {
              // Date part: "Jan 16, 2026" -> "Jan 16, 2026"
              formattedDate = `${parts[0].trim()}, ${parts[1].trim()}`;

              // Time part: " 1:31 PM" -> "1:31 PM"
              formattedTime = parts[2].trim();

              // Full datetime: "Jan 16, 2026 at 1:31 PM"
              dateTime = `${formattedDate} at ${formattedTime}`;
            }
          }
          // Handle format like "16/January/2026:1:31pm"
          else if (dateString.includes('/') && dateString.includes(':')) {
            const [datePart, timePart] = dateString.split(':');
            if (datePart) {
              // Format date from "16/January/2026" to "Jan 16, 2026"
              const dateParts = datePart.split('/');
              if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2];

                // Convert month to short format
                const monthShort = month.substring(0, 3);
                formattedDate = `${monthShort} ${day}, ${year}`;

                // Format time from "1:31pm" to "1:31 PM"
                if (timePart) {
                  let time = timePart;
                  // Convert to uppercase AM/PM
                  if (time.includes('am') || time.includes('pm')) {
                    time = time
                      .replace('am', ' AM')
                      .replace('pm', ' PM')
                      .toUpperCase();
                  }
                  formattedTime = time;
                }
              }
            }
          }
          // Handle ISO date format
          else if (hire.createdAt) {
            try {
              const date = new Date(hire.createdAt);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                formattedTime = date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                });
                dateTime = `${formattedDate} at ${formattedTime}`;
              }
            } catch (e) {
              console.error('Error parsing createdAt:', e);
            }
          }

          console.log('Date/time transformation:', {
            original: hire.dateOfHire,
            date: formattedDate,
            time: formattedTime,
            datetime: dateTime,
          });
        } catch (e) {
          console.error(
            'Error parsing date/time:',
            e,
            'Date string:',
            hire.dateOfHire,
          );
          formattedDate = hire.dateOfHire;
        }
      }

      // Parse amount from "450,000" to number
      let amount = 0;
      if (hire.amountToPay) {
        try {
          // Remove commas and any non-numeric characters except decimal point
          const cleaned = hire.amountToPay.toString().replace(/[^\d.]/g, '');
          amount = parseFloat(cleaned) || 0;
          console.log('Amount transformation:', hire.amountToPay, '->', amount);
        } catch (e) {
          console.error(
            'Error parsing amount:',
            e,
            'Amount string:',
            hire.amountToPay,
          );
          amount = 0;
        }
      }

      // Extract talent name
      const talentName = this.extractTalentName(hire);

      const transformedHire = {
        id: hire.id?.toString() || '',
        profilePic: hire.talentPicture || 'assets/images/default-avatar.png',
        name: talentName,
        date: formattedDate,
        time: formattedTime,
        dateTime: dateTime,
        amount: amount,
        offerStatus: this.mapHireStatus(
          hire.hireStatus || 'awaiting-acceptance',
        ),
        status: this.mapActiveStatus(hire.hireStatus || 'awaiting-acceptance'),
        talentId: hire.talentId || '',
        scouterId: hire.scouterId || '',
        marketHireId: hire.marketHireId || '',
        _raw: hire,
      };

      console.log('Transformed hire:', transformedHire);
      return transformedHire;
    });

    // Update the component's RecentHires array
    this.RecentHires = transformedHires;
    console.log('✅ Updated RecentHires with', transformedHires.length, 'hires');
  }

  private extractTalentName(hire: any): string {
    // Check talent object
    if (hire.talent) {
      const talent = hire.talent;
      if (talent.fullName) return talent.fullName;
      if (talent.name) return talent.name;
      if (talent.firstName || talent.lastName) {
        return `${talent.firstName || ''} ${talent.lastName || ''}`.trim();
      }
    }

    // Try details object
    if (hire.details?.talent) {
      const talent = hire.details.talent;
      if (talent.fullName) return talent.fullName;
      if (talent.name) return talent.name;
      if (talent.firstName || talent.lastName) {
        return `${talent.firstName || ''} ${talent.lastName || ''}`.trim();
      }
    }

    // If nothing found, check the hire data structure
    console.warn(
      '⚠️ Could not find talent name in hire data. Available keys:',
      Object.keys(hire),
    );

    // Log the full hire object for debugging
    console.log(
      '🔍 Full hire object for debugging:',
      JSON.stringify(hire, null, 2),
    );

    return 'Unknown Talent';
  }

  // Update the mapHireStatus method to handle all possible statuses:
  private mapHireStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Offer Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-declined': 'Offer Rejected',
      accepted: 'Offer Accepted',
      declined: 'Offer Rejected',
      pending: 'Awaiting Acceptance',
    };
    return statusMap[apiStatus?.toLowerCase()] || 'Awaiting Acceptance';
  }

  private mapActiveStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Active',
      'awaiting-acceptance': 'Pending',
      'offer-declined': 'Away',
      accepted: 'Active',
      declined: 'Away',
      pending: 'Pending',
    };
    return statusMap[apiStatus?.toLowerCase()] || 'Pending';
  }

  // Add this method to check if there are recent hires
  get hasRecentHires(): boolean {
    return this.RecentHires && this.RecentHires.length > 0;
  }

  private updateRecentMarketRatingsComponent(marketRatings: any[]): void {
    // Transform API data for the chart component
    // You'll need to update RecentMarketRatingDashboardComponent
    // based on your actual chart requirements
    console.log('Market ratings data:', marketRatings);
  }

  private parseAmount(amountString: string): number {
    if (!amountString) return 0;
    // Remove commas and convert to number
    const cleaned = amountString.replace(/,/g, '');
    return parseFloat(cleaned) || 0;
  }

  initializeDashboardData() {
    console.log('🔄 Initializing dashboard data...');

    // Calculate totals based ONLY on the three status cards (Accepted, Rejected, Awaiting)
    // NOT including "Total Market Engagement" (index 0)

    // For unpaid dashboard
    const unpaidAccepted = this.dashboardCardsUnpaid[1].value || 0;
    const unpaidRejected = this.dashboardCardsUnpaid[2].value || 0;
    const unpaidAwaiting = this.dashboardCardsUnpaid[3].value || 0;
    const unpaidStatusTotal = unpaidAccepted + unpaidRejected + unpaidAwaiting;

    console.log('📊 Unpaid Status Totals:', {
      accepted: unpaidAccepted,
      rejected: unpaidRejected,
      awaiting: unpaidAwaiting,
      total: unpaidStatusTotal,
    });

    // For paid dashboard
    const paidAccepted = this.dashboardCardsPaid[1].value || 0;
    const paidRejected = this.dashboardCardsPaid[2].value || 0;
    const paidAwaiting = this.dashboardCardsPaid[3].value || 0;
    const paidStatusTotal = paidAccepted + paidRejected + paidAwaiting;

    console.log('📊 Paid Status Totals:', {
      accepted: paidAccepted,
      rejected: paidRejected,
      awaiting: paidAwaiting,
      total: paidStatusTotal,
    });

    // Update the dashboardStatCards with correct percentages
    // Calculate percentages based only on status cards total
    this.dashboardStatCardsUnpaid = [
      {
        title: 'Offer Accepted',
        value:
          unpaidStatusTotal > 0
            ? Math.round((unpaidAccepted / unpaidStatusTotal) * 100)
            : 0,
        status: 'active',
      },
      {
        title: 'Awaiting Acceptance',
        value:
          unpaidStatusTotal > 0
            ? Math.round((unpaidAwaiting / unpaidStatusTotal) * 100)
            : 0,
        status: 'pending',
      },
      {
        title: 'Offer Rejected',
        value:
          unpaidStatusTotal > 0
            ? Math.round((unpaidRejected / unpaidStatusTotal) * 100)
            : 0,
        status: 'inactive',
      },
    ];

    this.dashboardStatCardsPaid = [
      {
        title: 'Offer Accepted',
        value:
          paidStatusTotal > 0
            ? Math.round((paidAccepted / paidStatusTotal) * 100)
            : 0,
        status: 'active',
      },
      {
        title: 'Awaiting Acceptance',
        value:
          paidStatusTotal > 0
            ? Math.round((paidAwaiting / paidStatusTotal) * 100)
            : 0,
        status: 'pending',
      },
      {
        title: 'Offer Rejected',
        value:
          paidStatusTotal > 0
            ? Math.round((paidRejected / paidStatusTotal) * 100)
            : 0,
        status: 'inactive',
      },
    ];

    console.log(
      '📈 Calculated Percentages - Unpaid:',
      this.dashboardStatCardsUnpaid,
    );
    console.log(
      '📈 Calculated Percentages - Paid:',
      this.dashboardStatCardsPaid,
    );

    // Check if percentages add up (for debugging)
    const unpaidPercentTotal = this.dashboardStatCardsUnpaid.reduce(
      (sum, card) => sum + card.value,
      0,
    );
    const paidPercentTotal = this.dashboardStatCardsPaid.reduce(
      (sum, card) => sum + card.value,
      0,
    );
    console.log(
      '🔢 Percentage Totals - Unpaid:',
      unpaidPercentTotal + '%',
      'Paid:',
      paidPercentTotal + '%',
    );

    // Build circle layers with proper sizing
    const baseSize = 120;

    this.percentageCirclesUnpaid = this.dashboardStatCardsUnpaid
      .map((card, index) => {
        const size = baseSize + index * 40;
        return {
          size: size,
          color: this.getPercentageStatusColor(card.status),
          percentage: card.value,
          title: card.title,
        };
      })
      .reverse();

    this.percentageCirclesPaid = this.dashboardStatCardsPaid
      .map((card, index) => {
        const size = baseSize + index * 40;
        return {
          size: size,
          color: this.getPercentageStatusColor(card.status),
          percentage: card.value,
          title: card.title,
        };
      })
      .reverse();
  }

  async goToViewHires(): Promise<void> {
    await this.router.navigate(['/scouter/view-hires']);
  }

  async goToHireTalent(): Promise<void> {
    // Get user email
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const email = parsedUser.email || parsedUser.details?.user?.email;

        if (email) {
          // Call OTP endpoint (fire and forget - don't wait for response)
          this.scouterEndpointsService.resendOtp({ email }).subscribe({
            next: (response) => console.log('✅ OTP sent:', response),
            error: (error) => console.error('❌ OTP failed:', error),
          });
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      }
    }

    await this.router.navigate(['/scouter/hire-talent']);
  }

  async goToHireDetails(hireId: string) {
    await this.router.navigate([
      `/market-engagement-market-price-preparation`,
      hireId,
    ]);
  }

  // Keep this method but ensure it uses the same logic
  getPercentageForStatus(value: number, statusType: string): number {
    // Get the correct total based on status type
    let total = 0;

    if (statusType === 'unpaid') {
      const unpaidAccepted = this.dashboardCardsUnpaid[1].value || 0;
      const unpaidRejected = this.dashboardCardsUnpaid[2].value || 0;
      const unpaidAwaiting = this.dashboardCardsUnpaid[3].value || 0;
      total = unpaidAccepted + unpaidRejected + unpaidAwaiting;
    } else if (statusType === 'paid') {
      const paidAccepted = this.dashboardCardsPaid[1].value || 0;
      const paidRejected = this.dashboardCardsPaid[2].value || 0;
      const paidAwaiting = this.dashboardCardsPaid[3].value || 0;
      total = paidAccepted + paidRejected + paidAwaiting;
    }

    if (total === 0) {
      return 0;
    }

    const percentage = Math.round((value / total) * 100);
    console.log(
      `📐 Percentage calculation: ${value} / ${total} = ${percentage}%`,
    );
    return percentage;
  }

  // Calculate the circumference for the SVG circles
  getCircumference(radius: number): number {
    return 2 * Math.PI * radius;
  }

  // Calculate the stroke dashoffset for the progress
  getStrokeDashoffset(radius: number, percentage: number): number {
    // Handle NaN case when percentage is not a number
    if (isNaN(percentage)) {
      percentage = 0;
    }

    const circumference = this.getCircumference(radius);
    return circumference - (percentage / 100) * circumference;
  }

  // Calculate the position for the progress dot
  getProgressDotPosition(
    radius: number,
    percentage: number,
    circleSize: number,
  ): { x: number; y: number } {
    if (isNaN(percentage)) {
      percentage = 0;
    }

    const center = circleSize / 2;
    const angleInDegrees = (percentage / 100) * 360;
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);

    const x = center + radius * Math.cos(angleInRadians);
    const y = center + radius * Math.sin(angleInRadians);

    return { x, y };
  }

  // Handle scroll events
  onContentScroll(event: any) {
    this.scrollPosition = event.detail.scrollTop;

    // Show/hide header based on scroll direction
    if (
      this.scrollPosition > this.previousScrollPosition &&
      this.scrollPosition > 100
    ) {
      // Scrolling down and past a threshold
      this.headerHidden = true;
    } else if (this.scrollPosition < this.previousScrollPosition) {
      // Scrolling up
      this.headerHidden = false;
    }

    this.previousScrollPosition = this.scrollPosition;
  }

  trackByCircle(index: number, circle: any): number {
    return index;
  }

  async openMakePaymentPopup() {
    const modal = await this.modalCtrl.create({
      component: MakePaymentPopupModalComponent,
      cssClass: 'make-payment-modal', // optional custom style
      backdropDismiss: true, // allow closing on backdrop click
    });
    return await modal.present();
  }

  private setTimeOfDay(): void {
    const hour = new Date().getHours();

    if (hour < 5) {
      this.timeOfDay = "It's Bed Time";
      this.timeIcon = imageIcons.Night;
    } else if (hour < 12) {
      this.timeOfDay = 'Good Morning';
      this.timeIcon = imageIcons.Morning;
    } else if (hour < 17) {
      this.timeOfDay = 'Good Afternoon';
      this.timeIcon = imageIcons.Afternoon;
    } else if (hour < 21) {
      this.timeOfDay = 'Good Evening';
      this.timeIcon = imageIcons.Evening;
    } else {
      this.timeOfDay = "It's Bed Time";
      this.timeIcon = imageIcons.Night;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#189537'; //GREEN
      case 'pending':
        return '#FFA086'; //YELLOWISH
      case 'inactive':
        return '#CC0000'; //RED
      default:
        return '#79797B'; //GRAY
    }
  }

  getPercentageStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return '#189537'; //GREEN
      case 'pending':
        return '#FFA086'; //YELLOWISH
      case 'inactive':
        return '#CC0000'; //RED
      default:
        return '#79797B'; //GRAY
    }
  }

  get formattedBalance(): string {
    return this.balance.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  get formattedWalletBalance(): string {
    return this.walletBalance.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }
}