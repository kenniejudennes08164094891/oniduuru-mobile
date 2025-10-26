// Modified TypeScript component
import { Component, OnInit, HostListener } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { MakePaymentPopupModalComponent } from 'src/app/utilities/modals/make-payment-popup-modal/make-payment-popup-modal.component';
import { PaymentService } from 'src/app/services/payment.service';
import { Router } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-scouter-dashboard',
  templateUrl: './scouter-dashboard.component.html',
  styleUrls: ['./scouter-dashboard.component.scss'],
  standalone: false,
})
export class ScouterDashboardComponent implements OnInit {
  MockRecentHires: MockPayment[] = MockRecentHires; // ✅ now available to template

  notificationCount: number = 0;

  hire: MockPayment | undefined;
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

  constructor(
    private modalCtrl: ModalController,
    private paymentService: PaymentService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.getScouterDetails();
    this.setTimeOfDay();

    // Just load from localStorage - data is already initialized by AppInitService
    this.loadNotificationCount();

    // ✅ Set up listener for real-time updates
    this.setupNotificationListener();

    const id = this.route.snapshot.paramMap.get('id');
    this.hire = MockRecentHires.find((h) => h.id === id);

    // Subscribe to paymentStatus
    this.paymentService.paymentStatus$.subscribe((status) => {
      this.paymentStatus = status;
    });

    setTimeout(() => {
      this.showSpinner = false;
    }, 2000);

    this.initializeDashboardData();
  }

  // ✅ ENHANCED: Load notification count
  private loadNotificationCount(): void {
    const storedCount = localStorage.getItem('notification_count');
    this.notificationCount = storedCount ? parseInt(storedCount, 10) : 0;
    console.log(
      '📬 Dashboard: Loaded notification count:',
      this.notificationCount
    );
  }

  // ✅ NEW: Setup notification listener for dashboard
  private setupNotificationListener(): void {
    const storageHandler = (event: StorageEvent) => {
      if (event.key === 'notification_count') {
        const newCount = parseInt(event.newValue || '0', 10);
        console.log('🔄 Dashboard: Notification count updated to', newCount);
        this.notificationCount = newCount;
      }
    };

    window.addEventListener('storage', storageHandler);

    // Clean up would be handled by Angular automatically for components
  }

  getScouterDetails() {
    // // Method 1: Try to get from AuthService directly
    // const currentUser = this.authService.getCurrentUser();
    // console.log('🔍 Current User from AuthService:', currentUser);

    // if (currentUser) {
    //   this.userName = this.extractUserName(currentUser);
    //   console.log('✅ User name from AuthService:', this.userName);
    //   return;
    // }

    // // Method 2: Try to decode from token
    // this.scouterDetails = this.authService.decodeScouterDetails();
    // console.log('🔍 Decoded Scouter Details:', this.scouterDetails);

    // if (this.scouterDetails) {
    //   this.userName = this.extractUserName(this.scouterDetails);
    //   console.log('✅ User name from decoded details:', this.userName);
    //   return;yy
    // }

    // Method 3: Try localStorage as fallback
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        this.userName = this.extractUserName(parsedUser);
        console.log('✅ User name from localStorage:', this.userName);
        return;
      } catch (error) {
        console.error('Error parsing user_data from localStorage:', error);
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
    const fullName =
      user.fullName ||
      user.fullname ||
      user.name ||
      user.username ||
      user.displayName ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      user.email?.split('@')[0] || // Use email username as fallback
      'User';

    console.log('✅ Extracted user name:', fullName);
    return fullName;
  }

  initializeDashboardData() {
    // Calculate total
    this.totalValue = this.dashboardCardsUnpaid.reduce(
      (sum, card) => sum + card.value,
      0
    );
    this.totalValue = this.dashboardCardsPaid.reduce(
      (sum, card) => sum + card.value,
      0
    );

    // Update the dashboardStatCards with correct percentages
    this.dashboardStatCardsUnpaid = [
      {
        title: 'Offer Accepted',
        value: this.getPercentage(this.dashboardCardsUnpaid[1].value),
        status: 'active',
      },
      {
        title: 'Awaiting Acceptance',
        value: this.getPercentage(this.dashboardCardsUnpaid[3].value),
        status: 'pending',
      },
      {
        title: 'Offer Rejected',
        value: this.getPercentage(this.dashboardCardsUnpaid[2].value),
        status: 'inactive',
      },
    ];

    this.dashboardStatCardsPaid = [
      {
        title: 'Offer Accepted',
        value: this.getPercentage(this.dashboardCardsPaid[1].value),
        status: 'active',
      },
      {
        title: 'Awaiting Acceptance',
        value: this.getPercentage(this.dashboardCardsPaid[3].value),
        status: 'pending',
      },
      {
        title: 'Offer Rejected',
        value: this.getPercentage(this.dashboardCardsPaid[2].value),
        status: 'inactive',
      },
    ];

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
    await this.router.navigate(['/scouter/hire-talent']);
  }

  async goToWalletPage(): Promise<void> {
    await this.router.navigate(['/scouter/wallet-page']);
  }

  async goToHireDetails(hireId: string) {
    await this.router.navigate([
      `/market-engagement-market-price-preparation`,
      hireId,
    ]);
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

  getPercentage(value: number): number {
    // Handle division by zero when total is 0
    if (this.totalValue === 0) {
      return 0;
    }
    return Math.round((value / this.totalValue) * 100);
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

  // Calculate the position for the progress dot - FIXED VERSION
  // Calculate the position for the progress dot - FIXED VERSION
  getProgressDotPosition(
    radius: number,
    percentage: number,
    circleSize: number
  ): { x: number; y: number } {
    // console.log('Dot position calculation:', {
    //   radius,
    //   percentage,
    //   circleSize,
    // });

    if (isNaN(percentage)) {
      percentage = 0;
    }

    const center = circleSize / 2;
    const angleInDegrees = (percentage / 100) * 360;
    // console.log('Angle in degrees:', angleInDegrees);

    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    // console.log('Angle in radians:', angleInRadians);

    const x = center + radius * Math.cos(angleInRadians);
    const y = center + radius * Math.sin(angleInRadians);
    // console.log('Final position:', { x, y });

    return { x, y };
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
    // { title: 'Market Engagement', value: 0, status: '' },
    { title: 'Awaiting Acceptance', value: 0, status: 'pending' },
    { title: 'Offer Accepted', value: 0, status: 'active' },
    { title: 'Offer Rejected', value: 0, status: 'inactive' },
  ];
  dashboardStatCardsPaid = [
    // { title: 'Market Engagement', value: 0, status: '' },
    { title: 'Awaiting Acceptance', value: 0, status: 'pending' },
    { title: 'Offer Accepted', value: 0, status: 'active' },
    { title: 'Offer Rejected', value: 0, status: 'inactive' },
  ];

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
}
