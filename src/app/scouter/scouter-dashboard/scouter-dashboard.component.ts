// scouter-dashboard.component.ts
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
import { PaymentStatusValue } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { ToastsService } from 'src/app/services/toasts.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToggleVisibilitySharedStateService } from 'src/app/services/toggleVisibilitySharedState.service';
import { firstValueFrom } from 'rxjs';

export interface RecentHire {
  id: string;
  profilePic: string;
  name: string;
  date: string;
  time?: string;
  dateTime?: string;
  amount: number;
  offerStatus: string;
  status: string;
  marketHireId: string;
  talentId: string;
  scouterId: string;
  _raw?: any;
}

@Component({
  selector: 'app-scouter-dashboard',
  templateUrl: './scouter-dashboard.component.html',
  styleUrls: ['./scouter-dashboard.component.scss'],
  standalone: false,
})
export class ScouterDashboardComponent implements OnInit, OnChanges {
  RecentHires: RecentHire[] = [];
  marketRatingsData: any[] = [];

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
  paymentStatus: PaymentStatusValue = 'false';
  scouterDetails: any;

  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  dashboardCardsUnpaid = [
    {
      title: 'Total Market Engagement',
      value: 0,
      status: '',
    },
    {
      title: 'Total Offer Accepted',
      value: 0,
      status: 'active',
    },
    {
      title: 'Total Offer Rejected',
      value: 0,
      status: 'inactive',
    },
    {
      title: 'Total Offer Awaiting Acceptance',
      value: 0,
      status: 'pending',
    },
  ];

  dashboardCardsPaid = [
    {
      title: 'Total Market Engagement',
      value: 0,
      status: '',
    },
    {
      title: 'Total Offer Accepted',
      value: 0,
      status: 'active',
    },
    {
      title: 'Total Offer Rejected',
      value: 0,
      status: 'inactive',
    },
    {
      title: 'Total Offer Awaiting Acceptance',
      value: 0,
      status: 'pending',
    },
  ];

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

  hasWalletProfile: boolean | null = null;

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

  async getWalletProfile(): Promise<void> {
    try {
      const userData: any = localStorage.getItem('user_data');
      if (!userData) {
        this.hasWalletProfile = false;
        return;
      }

      const parsed = JSON.parse(userData);
      console.log('🔍 Checking wallet profile in user_data:', parsed);

      // Method 1: Check completeOnboarding JSON string (primary source)
      if (parsed.completeOnboarding) {
        try {
          const onboarding = JSON.parse(parsed.completeOnboarding);
          console.log('📦 Parsed completeOnboarding:', onboarding);

          // IMPORTANT: Check the value explicitly
          if (onboarding.hasWalletProfile === true) {
            this.hasWalletProfile = true;
            console.log('✅ Wallet profile found in completeOnboarding (true)');
            return;
          } else if (onboarding.hasWalletProfile === false) {
            this.hasWalletProfile = false;
            console.log('❌ Wallet profile false in completeOnboarding');
            return;
          } else {
            // If hasWalletProfile is undefined or null in onboarding, continue to other checks
            console.log('⚠️ hasWalletProfile not explicitly set in onboarding');
          }
        } catch (e) {
          console.error('Error parsing completeOnboarding:', e);
        }
      }

      // Method 2: Check direct hasWalletProfile property
      if (parsed.hasWalletProfile !== undefined) {
        this.hasWalletProfile = parsed.hasWalletProfile === true;
        console.log(
          '💰 Wallet profile from direct property:',
          this.hasWalletProfile,
        );
        return;
      }

      // Method 3: Check wallet identifiers (if they exist, wallet exists)
      if (parsed.walletId || parsed.walletAccountNumber) {
        this.hasWalletProfile = true;
        console.log('💰 Wallet profile from identifiers');
        return;
      }

      // Method 4: Check if wallet balance was successfully fetched
      // This is a fallback - if we have wallet balance > 0, wallet must exist
      if (this.walletBalance > 0) {
        this.hasWalletProfile = true;
        console.log('💰 Wallet profile inferred from positive balance');
        return;
      }

      // Default to false
      this.hasWalletProfile = false;
      console.log('💰 No wallet profile found');
    } catch (e: any) {
      console.error('Error checking wallet profile:', e);
      this.hasWalletProfile = false;
    }
  }

  async routeToWalletOnboarding() {
    console.clear();
    await this.router.navigateByUrl('/scouter/wallet-page/wallet-profile');
  }

  getPaymentStatus(): PaymentStatusValue {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        let paidStatus =
          parsed.paid || parsed.details?.user?.paid || parsed.user?.paid;

        if (paidStatus === true || paidStatus === 'true') {
          return 'true';
        } else if (paidStatus === 'pendingPaymentVerification') {
          return 'pendingPaymentVerification';
        } else {
          return 'false';
        }
      } catch (error) {
        console.error('Error parsing user_data for payment status:', error);
      }
    }
    return 'false';
  }

  // Add this debug method to your component
  debugWalletCheck(): void {
    console.log('🔍 DEBUG - Current hasWalletProfile:', this.hasWalletProfile);
    console.log('🔍 DEBUG - Current paymentStatus:', this.paymentStatus);

    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      console.log('🔍 DEBUG - Raw user_data:', parsed);

      if (parsed.completeOnboarding) {
        try {
          const onboarding = JSON.parse(parsed.completeOnboarding);
          console.log('🔍 DEBUG - Parsed completeOnboarding:', onboarding);
          console.log(
            '🔍 DEBUG - hasWalletProfile in onboarding:',
            onboarding.hasWalletProfile,
          );
        } catch (e) {
          console.error('Error parsing completeOnboarding:', e);
        }
      }
    }
  }

  // Update ngOnInit to call debug after wallet check
  ngOnInit(): void {
    this.getScouterDetails();
    this.setTimeOfDay();
    this.initializeBalanceVisibility();
    this.loadNotificationCount();
    this.setupNotificationListener();

    // Get payment status from service first
    this.paymentService.paymentStatus$.subscribe((paymentStatus) => {
      this.paymentStatus = paymentStatus.status;
      console.log(
        '💰 Payment status updated in dashboard:',
        this.paymentStatus,
      );

      // Only fetch wallet-related data if paid
      if (this.paymentStatus === 'true') {
        this.fetchWalletBalance();
        this.getWalletProfile().then(() => {
          // Debug after wallet profile is checked
          this.debugWalletCheck();
        });
      } else {
        // Reset wallet profile for unpaid users
        this.hasWalletProfile = false;
        this.walletBalance = 0;
      }
    });

    this.initializeDashboardData();
    this.loadDashboardData();

    setTimeout(() => (this.showSpinner = false), 1500);
  }

  async toggleBalanceVisibility(): Promise<void> {
    this.balanceHidden =
      await this.toggleVisibilityService.toggleBalanceVisibility(
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
    } catch (error) {
      console.error('Error initializing balance visibility:', error);
      this.balanceHidden = false;
    }
  }

  private fetchWalletBalance(): void {
    this.walletLoading = true;

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

    this.endpointService.fetchMyWallet(walletId, uniqueId).subscribe({
      next: (res: any) => {
        this.walletLoading = false;
        if (res?.walletNotFound) {
          this.walletBalance = 0;
          // If wallet not found, ensure hasWalletProfile is false
          if (this.hasWalletProfile !== false) {
            this.hasWalletProfile = false;
          }
          return;
        }
        if (res && res.data) {
          const walletData = res.data;
          this.walletBalance = parseFloat(walletData.currentAcctBalance) || 0;

          // If we successfully got wallet data, wallet profile exists
          if (this.hasWalletProfile !== true) {
            this.hasWalletProfile = true;
            console.log('💰 Wallet profile confirmed from API response');
          }
        }
      },
      error: (error: any) => {
        this.walletLoading = false;
        console.error('Error fetching wallet balance:', error);
        this.walletBalance = 0;

        // On error, don't change hasWalletProfile - it might be a temporary issue
      },
    });
  }

  private loadNotificationCount(): void {
    const storedCount = localStorage.getItem('notification_count');
    this.notificationCount = storedCount ? parseInt(storedCount, 10) : 0;
  }

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
    console.warn('No user details found');
    this.userName = 'User';
  }

  private extractUserName(userData: any): string {
    if (!userData) return 'User';

    const user =
      userData.details?.user ||
      userData.user ||
      userData.data?.user ||
      userData;
    let fullName = 'User';

    if (user.firstName && user.lastName) {
      fullName = `${user.firstName} ${user.lastName}`.trim();
    } else if (user.fullName) {
      fullName = user.fullName;
    } else if (user.fullname) {
      fullName = user.fullname;
    } else if (user.name) {
      fullName = user.name;
    } else if (user.username) {
      fullName = user.username;
    } else if (user.displayName) {
      fullName = user.displayName;
    } else if (user.email) {
      const emailUsername = user.email.split('@')[0];
      fullName = emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    return fullName;
  }

  private loadDashboardData(): void {
    const scouterId =
      this.authService.getCurrentUser()?.scouterId ||
      localStorage.getItem('id');

    if (!scouterId) {
      console.warn('No scouter ID found, using mock data');
      return;
    }

    this.scouterEndpointsService.getScouterStats(scouterId).subscribe({
      next: (stats: any) => {
        this.updateDashboardWithRealData(stats);
      },
      error: (error: any) => {
        console.error('❌ Failed to load dashboard stats:', error);
      },
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['RecentHires']) {
      console.log('🔄 RecentHires changed in parent');
    }
  }

  private updateDashboardWithRealData(stats: any): void {
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

    if (stats.recentHires && stats.recentHires.length > 0) {
      this.updateRecentHiresComponent(stats.recentHires);
    }

    if (stats.marketRatings && stats.marketRatings.length > 0) {
      this.updateRecentMarketRatingsComponent(stats.marketRatings);
    }

    this.initializeDashboardData();
  }

  private updateRecentHiresComponent(recentHires: any[]): void {
    if (!recentHires || recentHires.length === 0) {
      this.RecentHires = [];
      return;
    }

    const transformedHires = recentHires.map((hire) => {
      let formattedDate = '';
      let formattedTime = '';
      let dateTime = '';

      if (hire.dateOfHire) {
        try {
          const dateString = hire.dateOfHire.toString();
          if (dateString.includes(',')) {
            const parts = dateString.split(',');
            if (parts.length >= 3) {
              formattedDate = `${parts[0].trim()}, ${parts[1].trim()}`;
              formattedTime = parts[2].trim();
              dateTime = `${formattedDate} at ${formattedTime}`;
            }
          } else if (dateString.includes('/') && dateString.includes(':')) {
            const [datePart, timePart] = dateString.split(':');
            if (datePart) {
              const dateParts = datePart.split('/');
              if (dateParts.length === 3) {
                const day = dateParts[0];
                const month = dateParts[1];
                const year = dateParts[2];
                const monthShort = month.substring(0, 3);
                formattedDate = `${monthShort} ${day}, ${year}`;
                if (timePart) {
                  let time = timePart;
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
          } else if (hire.createdAt) {
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
        } catch (e) {
          console.error('Error parsing date/time:', e);
          formattedDate = hire.dateOfHire;
        }
      }

      let amount = 0;
      if (hire.amountToPay) {
        try {
          const cleaned = hire.amountToPay.toString().replace(/[^\d.]/g, '');
          amount = parseFloat(cleaned) || 0;
        } catch (e) {
          console.error('Error parsing amount:', e);
          amount = 0;
        }
      }

      const talentName = this.extractTalentName(hire);

      return {
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
    });

    this.RecentHires = transformedHires;
  }

  private extractTalentName(hire: any): string {
    if (hire.talent) {
      const talent = hire.talent;
      if (talent.fullName) return talent.fullName;
      if (talent.name) return talent.name;
      if (talent.firstName || talent.lastName) {
        return `${talent.firstName || ''} ${talent.lastName || ''}`.trim();
      }
    }
    if (hire.details?.talent) {
      const talent = hire.details.talent;
      if (talent.fullName) return talent.fullName;
      if (talent.name) return talent.name;
      if (talent.firstName || talent.lastName) {
        return `${talent.firstName || ''} ${talent.lastName || ''}`.trim();
      }
    }
    return 'Unknown Talent';
  }

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

  get hasRecentHires(): boolean {
    return this.RecentHires && this.RecentHires.length > 0;
  }

  private updateRecentMarketRatingsComponent(marketRatings: any[]): void {
    console.log('Market ratings data:', marketRatings);
  }

  initializeDashboardData() {
    const unpaidAccepted = this.dashboardCardsUnpaid[1].value || 0;
    const unpaidRejected = this.dashboardCardsUnpaid[2].value || 0;
    const unpaidAwaiting = this.dashboardCardsUnpaid[3].value || 0;
    const unpaidStatusTotal = unpaidAccepted + unpaidRejected + unpaidAwaiting;

    const paidAccepted = this.dashboardCardsPaid[1].value || 0;
    const paidRejected = this.dashboardCardsPaid[2].value || 0;
    const paidAwaiting = this.dashboardCardsPaid[3].value || 0;
    const paidStatusTotal = paidAccepted + paidRejected + paidAwaiting;

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
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        const email = parsedUser.email || parsedUser.details?.user?.email;
        if (email) {
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

  getPercentageForStatus(value: number, statusType: string): number {
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
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
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
  ): { x: number; y: number } {
    if (isNaN(percentage)) percentage = 0;
    const center = circleSize / 2;
    const angleInDegrees = (percentage / 100) * 360;
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(angleInRadians);
    const y = center + radius * Math.sin(angleInRadians);
    return { x, y };
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

  trackByCircle(index: number, circle: any): number {
    return index;
  }

  async openMakePaymentPopup() {
    const modal = await this.modalCtrl.create({
      component: MakePaymentPopupModalComponent,
      cssClass: 'make-payment-modal',
      backdropDismiss: true,
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
