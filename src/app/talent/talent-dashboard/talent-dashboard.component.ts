import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Chart, registerables } from 'chart.js';
import { Router } from '@angular/router';
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

  userName: string = 'Samuel';
  timeOfDay: string = '';
  timeIcon: string = '';
  myIcon: string = imageIcons.infoIcon;
  // Header scroll state
  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  // Wallet
  walletBalance: number = 30000.0;

  constructor(private router: Router) { }

  goToViewHires() {
    this.router.navigate(['/view-hires']);
  }
  // Greeting


  // Dashboard stats (numbers only)
  dashboardCards = [
    { title: 'Total Market Engagement', value: 21, status: '' },
    { title: 'Total Offer Accepted', value: 18, status: 'active' },
    { title: 'Total Offer Rejected', value: 1, status: 'pending' },
    { title: 'Total Offer Awaiting Acceptance', value: 2, status: 'inactive' },
  ];

  // For donut chart
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

  routeToWallet() {
    this.router.navigate(['/scouter/wallet-page']);
  }
  ngOnInit(): void {
    this.setTimeOfDay();

    // Simulate spinner
    setTimeout(() => (this.showSpinner = false), 1500);

    // Donut chart percentages
    this.dashboardStatCards = [
      { title: 'Offers Accepted', value: 85.71, status: 'active' },
      { title: 'Waiting Acceptance', value: 9.25, status: 'pending' },
      { title: 'Offers Rejected', value: 4.76, status: 'inactive' },
    ];

    // Build concentric circles
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

    // Ratings chart
    this.initRatingsChart();
  }

  private initRatingsChart(): void {
    const ctx = document.getElementById('ratingsChart') as HTMLCanvasElement;

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
        indexAxis: 'y', // horizontal bars
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            min: 0,
            max: 6,
            ticks: { stepSize: 2 },
          },
        },
      },
    });
  }

  // Scroll toggle for header
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

  // Helpers
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
    circleSize: number
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
}
