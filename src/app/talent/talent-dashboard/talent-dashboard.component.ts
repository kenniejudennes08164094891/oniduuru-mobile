import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
import { AuthService } from "../../services/auth.service";
import { EndpointService } from 'src/app/services/endpoint.service';
import { PaginationParams } from 'src/app/models/mocks';
import { Observable } from 'rxjs';
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
  loading: string = 'Loading...';
  showSpinner: boolean = true;
  currentYear: number = new Date().getFullYear();


  // User details
  talentStats: any = null;
  talentId: string = '';

  userName: string = 'User';
  timeOfDay: string = '';
  timeIcon: string = '';
  myIcon: string = imageIcons.infoIcon;

  // Header scroll state
  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  // Wallet
  walletBalance: number = 30000.0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private endpointService: EndpointService,
    private toastr: ToastrService

  ) { }
  //async goToViewHires(): Promise<void> {…}
  async goToViewHires(): Promise<void> {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');

    if (!talentId) {
      console.warn('talentId not found — navigating to view-hires without preloaded data');
      await this.router.navigate(['/view-hires']);
      return;
    }

    const paginationParams = { limit: 10, pageNo: 1 }; // Example pagination params
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

    this.endpointService.fetchMarketsByTalent(talentId, paginationParams, '', '').subscribe({
      next: (response: any) => {
        const markets = base64JsonDecode(response?.details) || [];
        this.router.navigate(['/view-hires'], { state: { markets } });
      },
      error: (error) => {
        console.error('Error fetching markets by talent:', error);
        this.router.navigate(['/view-hires']);
      }
    });
  }
  // ✅ Get user details (name) from localStorage or decoded auth data
  getTalentDetails() {
    try {
      //Try to get saved profile first
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        console.log('Loaded talent profile from localStorage:', parsedProfile);

        this.userName =
          parsedProfile.fullName ||
          parsedProfile.details?.user?.fullName ||
          'User';

        if (this.userName !== 'User') return; // Found name, stop here
      }

      // Otherwise, decode from token as fallback
      const talentDetails = this.authService.decodeTalentDetails();
      console.log("talent details>>", talentDetails);
      console.log('Decoded Talent Details (fallback):', talentDetails);

      this.userName =
        talentDetails?.fullName ||
        talentDetails?.details?.user?.fullName ||
        'User';
    } catch (error) {
      console.error('Error loading talent details:', error);
      this.userName = 'User';
    }
  }
  private async loadTalentProfile(): Promise<void> {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) return;
    try {
      const res: any = await firstValueFrom(this.endpointService.fetchTalentProfile(talentId));
      if (res) {
        const name = res?.details?.fullName || res?.fullName;
        if (name) this.userName = name;
        // Optionally cache
        localStorage.setItem('talentProfile', JSON.stringify(res));
      }
    } catch (err) {
      console.error('Failed to load talent profile:', err);
    }
  }


  proceedToMarketProfile(): void {
    const talentProfile = localStorage.getItem('user_data') || localStorage.getItem('user_profile_data');
    const talentId = talentProfile ? JSON.parse(talentProfile)?.talentId : null;

    if (!talentId) {
      alert('Talent ID not found. Please log in again.');
      return;
    }

    this.router.navigate(['/create-record', talentId]);
  }

  // async goToViewHires(): Promise<void> {
  //   await this.router.navigate(['/view-hires']);
  // }

  // Dashboard stats
  dashboardCards = [
    { title: 'Total Market Engagement', value: 21, status: '' },
    { title: 'Total Offer Accepted', value: 18, status: 'active' },
    { title: 'Total Offer Rejected', value: 1, status: 'pending' },
    { title: 'Total Offer Awaiting Acceptance', value: 2, status: 'inactive' },
  ];

  dashboardStatCards: { title: string; value: number; status: string }[] = [];
  percentageCircles: {
    size: number;
    color: string;
    percentage: number;
    title: string;
  }[] = [];

  // Ratings chart data
  ratingsData = [
    { date: '17/September/2024 8:15AM', yourRating: 5, scouterRating: 4 },
    { date: '17/September/2024 8:25AM', yourRating: 3, scouterRating: 5 },
    { date: '17/September/2024 8:15AM', yourRating: 3, scouterRating: 4 },
    { date: '17/September/2024 8:25AM', yourRating: 3, scouterRating: 5 },
  ];

  // Recent hires data
  recentHires: {
    name: string;
    date: string;
    amount: number;
    avatar: string;
  }[] = [];

  async routeToWallet(): Promise<void> {
    await this.router.navigate(['/scouter/wallet-page']);
  }
  async fetchTalentStats(): Promise<void> {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.warn('Talent ID not found, skipping stats fetch');
      return;
    }

    try {
      const response = await firstValueFrom(this.endpointService.fetchTalentStats(talentId));
      console.log('Talent Stats Response:', response);

      this.talentStats = response?.details || response;

      // ✅ Update dashboard cards dynamically
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
        },
      ];

      // ✅ Calculate percentages for offers
      const totalOffers =
        (this.talentStats?.totalOffersAccepted || 0) +
        (this.talentStats?.totalOffersRejected || 0) +
        (this.talentStats?.totalOffersAwaitingAcceptance || 0);

      const offersAcceptedPct = totalOffers ? (this.talentStats?.totalOffersAccepted / totalOffers) * 100 : 0;
      const offersRejectedPct = totalOffers ? (this.talentStats?.totalOffersRejected / totalOffers) * 100 : 0;
      const waitingAcceptancePct = totalOffers ? (this.talentStats?.totalOffersAwaitingAcceptance / totalOffers) * 100 : 0;

      // ✅ Update donut chart data
      this.dashboardStatCards = [
        { title: 'Offers Accepted', value: offersAcceptedPct, status: 'active' },
        { title: 'Waiting Acceptance', value: waitingAcceptancePct, status: 'pending' },
        { title: 'Offers Rejected', value: offersRejectedPct, status: 'inactive' },
      ];

      // ✅ Rebuild concentric circles
      const baseSize = 120;
      this.percentageCircles = this.dashboardStatCards
        .map((card, index) => {
          const size = baseSize + index * 40;
          return {
            size,
            color: this.getPercentageStatusColor(card.status),
            percentage: card.value,
            title: card.title,
          };
        })
        .reverse();

      // ✅ Refresh the ratings chart if your backend returns ratings
      if (this.talentStats?.ratingsData) {
        this.ratingsData = this.talentStats.ratingsData;
        this.initRatingsChart();
      }

    } catch (error) {
      console.error('Error fetching talent stats:', error);
      this.toastr.error('Unable to load dashboard statistics.');
    }
  }


  ngOnInit(): void {
    this.setTimeOfDay();
    this.getTalentDetails();


    // Simulate spinner
    setTimeout(() => (this.showSpinner = false), 1500);
    this.fetchTalentStats();
    // Donut chart percentages
    // this.dashboardStatCards = [
    //   { title: 'Offers Accepted', value: 85.71, status: 'active' },
    //   { title: 'Waiting Acceptance', value: 9.25, status: 'pending' },
    //   { title: 'Offers Rejected', value: 4.76, status: 'inactive' },
    // ];

    // // Build concentric circles
    // const baseSize = 120;
    // this.percentageCircles = this.dashboardStatCards
    //   .map((card, index) => {
    //     const size = baseSize + index * 40;
    //     return {
    //       size,
    //       color: this.getPercentageStatusColor(card.status),
    //       percentage: card.value,
    //       title: card.title,
    //     };
    //   })
    //   .reverse();

    // Recent hires
    this.recentHires = [
      {
        name: 'Adediji Samuel Oluwaseyi',
        date: 'Oct 17, 2024, 8:25AM',
        amount: 40000.0,
        avatar: 'assets/images/portrait-african-american-man.jpg',
      },
      {
        name: 'Kehinde Jude Omosehin',
        date: 'Sep 22, 2024, 11:25AM',
        amount: 400000.0,
        avatar: 'assets/images/portrait-man-cartoon-style.jpg',
      },
      {
        name: 'Adediji Samuel Oluwaseyi',
        date: 'Sep 19, 2024, 8:15PM',
        amount: 70000.0,
        avatar: 'assets/images/portrait-man-cartoon-style.jpg',
      },
      {
        name: 'Kehinde Jude Omosehin',
        date: 'Sep 17, 2024, 9:45AM',
        amount: 700000.0,
        avatar: 'assets/images/portrait-african-american-man.jpg',
      },
    ];

    this.initRatingsChart();
  }

  private initRatingsChart(): void {
    const ctx = document.getElementById('ratingsChart') as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.ratingsData.map((r) => r.date),
        datasets: [
          {
            label: 'Your Ratings',
            data: this.ratingsData.map((r) => r.yourRating),
            backgroundColor: '#3B82F6', // blue
          },
          {
            label: "Scouter's Ratings",
            data: this.ratingsData.map((r) => r.scouterRating),
            backgroundColor: '#7C3AED', // purple
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 6, ticks: { stepSize: 2 } },
        },
      },
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
      case 'active': return '#189537';
      case 'pending': return '#FFA086';
      case 'inactive': return '#CC0000';
      default: return '#79797B';
    }
  }

  getPercentageStatusColor(status: string): string {
    return this.getStatusColor(status);
  }
}

