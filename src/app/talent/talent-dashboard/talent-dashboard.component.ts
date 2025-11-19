import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-talent-dashboard',
  templateUrl: './talent-dashboard.component.html',
  styleUrls: ['./talent-dashboard.component.scss'],
  standalone: false,
})
export class TalentDashboardComponent implements OnInit {
  // Spinner
  loading = 'Loading...';
  showSpinner = true;
  currentYear = new Date().getFullYear();

  // User details
  talentStats: any = null;
  talentId = '';

  userName = 'User';
  timeOfDay = '';
  timeIcon = '';
  myIcon = imageIcons.infoIcon;

  // Header scroll state
  headerHidden = false;
  scrollPosition = 0;
  previousScrollPosition = 0;

  // Wallet
  walletBalance = 0; // default zero, update from API if available
  async routeToWallet(): Promise<void> {
    await this.router.navigate(['/scouter/wallet-page']);
  }

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
  percentageCircles: { size: number; color: string; percentage: number; title?: string }[] = [];

  // Ratings chart data (fallback)
  ratingsData: { date: string; yourRating: number; scouterRating: number }[] = [];

  // Recent hires (fallback empty)
  recentHires: { name: string; date: string; amount: number; avatar: string }[] = [];

  // simple image object if you store a common NoData image
  images = {
    NoDataImage: 'assets/images/NoDataImage.svg' // adjust path to your project image
  };

  constructor(
    private router: Router,
    private authService: AuthService,
    private endpointService: EndpointService,
    private toastr: ToastrService

  ) { }

  // ---------- REPLACE ngOnInit() ----------

  async ngOnInit(): Promise<void> {
    console.log("ngOnInit has started running...");

    this.setTimeOfDay();
    this.getTalentDetails();

    // 1. Load profile (API + store onboarding)
    await this.loadTalentProfile();

    // 2. Parse onboarding and set new/existing user flags
    this.checkMarketProfileStatus();

    console.warn('User onboarding state -> isNewUser:', this.isNewUser, 'hasMarketProfile:', this.hasMarketProfile);

    // 3. Load dashboard depending on user type
    if (this.isNewUser) {
      this.prepareNewUserDashboard();
    } else {
      this.fetchTalentStats().catch((err) => {
        console.error('fetchTalentStats failed:', err);
        this.prepareNewUserDashboard();
      });
    }

    // 4. Hide spinner after short delay
    setTimeout(() => (this.showSpinner = false), 900);
  }



  private prepareNewUserDashboard(): void {
    // Ensure all dashboard values are zeroed for new users
    this.dashboardCards = [
      { title: 'Total Market Engagement', value: 0, status: '' },
      { title: 'Total Offer Accepted', value: 0, status: 'active' },
      { title: 'Total Offer Rejected', value: 0, status: 'inactive' },
      { title: 'Total Offer Awaiting Acceptance', value: 0, status: 'pending' }
    ];

    // breakdown cards with 0%
    this.dashboardStatCards = [
      { title: 'Offers Accepted', value: 0, status: 'active' },
      { title: 'Waiting Acceptance', value: 0, status: 'pending' },
      { title: 'Offers Rejected', value: 0, status: 'inactive' }
    ];

    // concentric circles for the "Total Market by Percentage" visual
    const baseSize = 120;
    this.percentageCircles = this.dashboardStatCards
      .map((card, index) => ({
        size: baseSize + index * 40,
        color: this.getPercentageStatusColor(card.status),
        percentage: 0,
        title: card.title
      }))
      .reverse();

    // Ratings and recent hires stay empty arrays so UI shows "No Data Available"
    this.ratingsData = [];
    this.recentHires = [];
    this.walletBalance = 0;
  }

  // fetch and build stats for existing user
  async fetchTalentStats(): Promise<void> {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.warn('Talent ID not found, skipping stats fetch');
      return;
    }

    try {
      const response: any = await firstValueFrom(this.endpointService.fetchTalentStats(talentId));
      console.log('Talent Stats Response:', response);

      this.talentStats = response?.details || response || {};

      // Update wallet if backend returns it
      if (this.talentStats?.walletBalance != null) {
        this.walletBalance = this.talentStats.walletBalance;
      }

      // Build dashboard cards from real stats (safe fallback to 0)
      this.dashboardCards = [
        {
          title: 'Total Market Engagement',
          value: this.talentStats?.totalMarketEngagement || 0,
          status: ''
        },
        {
          title: 'Total Offer Accepted',
          value: this.talentStats?.totalOffersAccepted || 0,
          status: 'active'
        },
        {
          title: 'Total Offer Rejected',
          value: this.talentStats?.totalOffersRejected || 0,
          status: 'inactive'
        },
        {
          title: 'Total Offer Awaiting Acceptance',
          value: this.talentStats?.totalOffersAwaitingAcceptance || 0,
          status: 'pending'
        }
      ];

      // Calculate percentages (guarded)
      const totalOffers =
        (this.talentStats?.totalOffersAccepted || 0) +
        (this.talentStats?.totalOffersRejected || 0) +
        (this.talentStats?.totalOffersAwaitingAcceptance || 0);

      const offersAcceptedPct = totalOffers ? (this.talentStats.totalOffersAccepted / totalOffers) * 100 : 0;
      const offersRejectedPct = totalOffers ? (this.talentStats.totalOffersRejected / totalOffers) * 100 : 0;
      const waitingAcceptancePct = totalOffers ? (this.talentStats.totalOffersAwaitingAcceptance / totalOffers) * 100 : 0;

      this.dashboardStatCards = [
        { title: 'Offers Accepted', value: Math.round(offersAcceptedPct * 100) / 100, status: 'active' },
        { title: 'Waiting Acceptance', value: Math.round(waitingAcceptancePct * 100) / 100, status: 'pending' },
        { title: 'Offers Rejected', value: Math.round(offersRejectedPct * 100) / 100, status: 'inactive' }
      ];

      // Build percentage circles
      const baseSize = 120;
      this.percentageCircles = this.dashboardStatCards
        .map((card, index) => ({
          size: baseSize + index * 40,
          color: this.getPercentageStatusColor(card.status),
          percentage: card.value,
          title: card.title
        }))
        .reverse();

      // If backend provides ratings
      if (this.talentStats?.ratingsData && Array.isArray(this.talentStats.ratingsData)) {
        this.ratingsData = this.talentStats.ratingsData;
        this.initRatingsChart();
      }

      // If backend provides recent hires (assumed decoded), set it
      if (this.talentStats?.recentHires && Array.isArray(this.talentStats.recentHires)) {
        this.recentHires = this.talentStats.recentHires;
      }
    } catch (error) {
      console.error('Error fetching talent stats:', error);
      this.toastr.error('Unable to load dashboard statistics.');
      // fallback to showing zeros (keep prepared new-user view)
      this.prepareNewUserDashboard();
    }
  }

  async goToViewHires(): Promise<void> {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.warn('talentId not found — navigating to view-hires without preloaded data');
      await this.router.navigate(['/view-hires']);
      return;
    }

    const paginationParams = { limit: 10, pageNo: 1 };
    const base64JsonDecode = (b64: string) => {
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
    };

    try {
      this.endpointService.fetchMarketsByTalent(talentId, paginationParams, '', '').subscribe({
        next: (response: any) => {
          const markets = base64JsonDecode(response?.details) || [];
          this.router.navigate(['/view-hires'], { state: { markets } });
        },
        error: (error) => {
          console.error('Error fetching markets by talent:', error);
          // navigate but view-hires should handle empty state
          this.router.navigate(['/view-hires']);
        }
      });
    } catch (err) {
      console.error('Error while requesting markets:', err);
      this.router.navigate(['/view-hires']);
    }
  }

  // Get user name first from local cache or decoded token
  getTalentDetails() {
    try {
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        this.userName = parsedProfile.fullName || parsedProfile.details?.user?.fullName || this.userName;
        if (this.userName !== 'User') return;
      }

      const talentDetails = this.authService.decodeTalentDetails();
      this.userName = talentDetails?.fullName || talentDetails?.details?.user?.fullName || this.userName;
    } catch (error) {
      console.error('Error loading talent details:', error);
    }
  }

  private async loadTalentProfile(): Promise<void> {
    console.log("✔️ loadTalentProfile() started");

    console.log("loadTalentProfile() HAS STARTED...");

    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    console.log("talentId found:", talentId);
    if (!talentId) return;
     console.warn(" No talentId found. Skipping loadTalentProfile.");
    
    try {
      const res: any = await firstValueFrom(this.endpointService.fetchTalentProfile(talentId));
      console.log("FULL API RESPONSE:", res);

      if (res) {
        // Get full name
        const name = res?.details?.user?.fullName;
        if (name) this.userName = name;

        // Persist full profile (you MUST NOT remove this)
        localStorage.setItem('talentProfile', JSON.stringify(res));

        // Store normalized onboarding object
        const onboardingRaw =
          res?.completeOnboarding ||
          res?.details?.completeOnboarding ||
          res?.details?.user?.completeOnboarding;

        console.log("Raw onboarding from API:", onboardingRaw);

        if (onboardingRaw) {
          try {
            let onboardingObj;

            // If API sent onboarding as a string
            if (typeof onboardingRaw === "string") {
              try {
                onboardingObj = JSON.parse(onboardingRaw);
              } catch {
                onboardingObj = JSON.parse(JSON.parse(onboardingRaw));
              }
            } else {
              onboardingObj = onboardingRaw;
            }

            sessionStorage.setItem("completeOnboarding", JSON.stringify(onboardingObj));
            console.log("Saved completeOnboarding object:", onboardingObj);
          } catch (err) {
            console.error("Failed to parse onboarding from API", err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching talent profile:', error);
    }
  }


  proceedToMarketProfile(): void {
    const talentProfile = localStorage.getItem('user_data') || localStorage.getItem('user_profile_data') || localStorage.getItem('talentProfile');
    const talentId = talentProfile ? JSON.parse(talentProfile)?.talentId : null;

    if (!talentId) {

      this.toastr.warning('Talent ID not found. Please log in again.');
      return;
    }

    this.router.navigate(['/create-record', talentId]);
  }

  // ----------  checkMarketProfileStatus() ----------
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

    console.debug('Onboarding parsed:', parsed, 'hasMarketProfile:', this.hasMarketProfile, 'isNewUser:', this.isNewUser);
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
  // ---------- initRatingsChart() ----------      

  private initRatingsChart(): void {
    // only init the chart if there is rating data
    if (!this.ratingsData || this.ratingsData.length === 0) return;

    const ctx = document.getElementById('ratingsChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart instance if any - optional (not included here) - ensure duplicate charts don't stack
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ratingsData.map((r) => r.date),
        datasets: [
          {
            label: 'Your Ratings',
            data: this.ratingsData.map((r) => r.yourRating),
            backgroundColor: '#3B82F6'
          },
          {
            label: "Scouter's Ratings",
            data: this.ratingsData.map((r) => r.scouterRating),
            backgroundColor: '#7C3AED'
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 6, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  onContentScroll(event: any) {
    this.scrollPosition = event.detail.scrollTop;
    if (this.scrollPosition > this.previousScrollPosition && this.scrollPosition > 100) {
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

  getProgressDotPosition(radius: number, percentage: number, circleSize: number) {
    if (isNaN(percentage)) percentage = 0;
    const center = circleSize / 2;
    const angleInRadians = ((percentage / 100) * 360 - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(angleInRadians),
      y: center + radius * Math.sin(angleInRadians)
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
}
