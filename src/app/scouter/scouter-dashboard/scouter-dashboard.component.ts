// Modified TypeScript component
import { Component, OnInit, HostListener } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-scouter-dashboard',
  templateUrl: './scouter-dashboard.component.html',
  styleUrls: ['./scouter-dashboard.component.scss'],
})
export class ScouterDashboardComponent implements OnInit {
  images = imageIcons;
  loading: string = 'Loading...';
  showSpinner: boolean = true;
  userName: string = 'Vikiwest';
  timeOfDay: string = '';
  timeIcon: string = '';
  currentYear: number = new Date().getFullYear();
  totalValue: number = 0;
  percentageCircles: {
    size: number;
    color: string;
    percentage: number;
    title: string;
  }[] = [];

  // New properties for header scroll behavior
  headerHidden: boolean = false;
  scrollPosition: number = 0;
  previousScrollPosition: number = 0;

  constructor() {}

  ngOnInit(): void {
    this.setTimeOfDay();

    // Delay spinner
    setTimeout(() => {
      this.showSpinner = false;
    }, 2000);

    // Calculate total
    this.totalValue = this.dashboardCards.reduce(
      (sum, card) => sum + card.value,
      0
    );

    // Update the dashboardStatCards with correct percentages
    this.dashboardStatCards = [
      {
        title: 'Market Engagement',
        value: this.getPercentage(this.dashboardCards[0].value),
        status: '',
      },
      {
        title: 'Offer Accepted',
        value: this.getPercentage(this.dashboardCards[1].value),
        status: 'active',
      },
      {
        title: 'Awaiting Acceptance',
        value: this.getPercentage(this.dashboardCards[3].value),
        status: 'pending',
      },
      {
        title: 'Offer Rejected',
        value: this.getPercentage(this.dashboardCards[2].value),
        status: 'inactive',
      },
    ];

    // Build circle layers with proper sizing
    const maxSize = 280; // Maximum size of the largest circle
    const baseSize = 120; // Minimum size of the smallest circle

    this.percentageCircles = this.dashboardStatCards
      .map((card, index) => {
        // Calculate size based on index (larger index = larger circle)
        const size = baseSize + index * 40;
        return {
          size: size,
          color: this.getPercentageStatusColor(card.status),
          percentage: card.value,
          title: card.title,
        };
      })
      .reverse(); // Reverse to show largest circle at the back
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
    console.log('Dot position calculation:', {
      radius,
      percentage,
      circleSize,
    });

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


  dashboardCards = [
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
  dashboardStatCards = [
    { title: 'Market Engagement', value: 0, status: '' },
    { title: 'Offer Accepted', value: 0, status: 'active' },
    { title: 'Awaiting Acceptance', value: 0, status: 'pending' },
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
}
