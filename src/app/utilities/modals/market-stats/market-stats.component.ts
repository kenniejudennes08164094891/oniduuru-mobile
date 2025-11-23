import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-market-stats',
  templateUrl: './market-stats.component.html',
  styleUrls: ['./market-stats.component.scss'],
  standalone: false,
})
export class MarketStatsComponent implements OnInit, OnChanges {
  @Output() hireSelected = new EventEmitter<MockPayment>();

  hire: MockPayment | undefined;
  userName: string = 'Viki West';
  isLoading: boolean = false;

  // Track if we've already loaded data to prevent re-initialization
  private dataLoaded: boolean = false;

  // Store API stats data
  statsData: any = null;

  // Chart data and options...
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value}%`;
          },
        },
      },
    },
  };

  pieChartData: ChartData<'pie'> = {
    labels: [
      'Very impressive [⭐⭐⭐⭐⭐]',
      'Impressive [⭐⭐⭐⭐]',
      'Fairly impressive [⭐⭐⭐]',
      'Manageable [⭐⭐]',
      'Poor delivery [⭐]',
      'Not available',
    ],
    datasets: [
      {
        data: [25, 15, 20, 10, 20, 10],
        backgroundColor: [
          '#6A1B9A',
          '#8E24AA',
          '#BA68C8',
          '#FF7043',
          '#D32F2F',
          '#BDBDBD',
        ],
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        max: 5,
      },
    },
  };

  barChartData!: ChartData<'bar'>;
  ratingList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Only load from URL if we don't have a selected hire from input
    if (!this.selectedHire) {
      const talentId = this.route.snapshot.paramMap.get('id');
      if (talentId) {
        this.loadHireData(talentId);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedHire'] && changes['selectedHire'].currentValue) {
      console.log(
        '🔄 MarketStats: Selected hire changed to:',
        changes['selectedHire'].currentValue.name
      );
      this.setSelectedHire(changes['selectedHire'].currentValue);
      this.dataLoaded = true;
    }
  }

  @Input() selectedHire: MockPayment | undefined;

  setSelectedHire(hire: MockPayment) {
    console.log('🔄 MarketStats: Setting selected hire:', hire.name);
    this.hire = hire;
    this.userName = hire.name;

    // Load stats data for the selected hire
    this.loadStatsData(hire.id);

    this.hireSelected.emit(hire);
  }

  loadHireData(talentId: string) {
    if (this.dataLoaded) {
      console.log('ℹ️ MarketStats: Skipping URL load, using selected hire');
      return;
    }

    this.isLoading = true;

    // 🚨 DEVELOPMENT: Comment this block in production
    this.loadMockData(talentId);
    this.isLoading = false;

    /* 🚨 PRODUCTION: Uncomment this block and comment the mock data block above
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.isLoading = false;
      return;
    }

    this.scouterService.getAllMarketsByScouter(scouterId, { talentId }).subscribe({
      next: (response) => {
        if (response?.data && response.data.length > 0) {
          this.setSelectedHire(response.data[0]);
          this.dataLoaded = true;
        } else {
          this.loadMockData(talentId);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading hire data:', error);
        this.loadMockData(talentId);
        this.isLoading = false;
      }
    });
    */
  }

  private loadStatsData(talentId: string) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found for stats');
      this.initializeChartsWithMockData();
      return;
    }

    // 🚨 DEVELOPMENT: Comment this block in production
    console.log('📊 Using mock stats data for development');
    this.initializeChartsWithMockData();

    /* 🚨 PRODUCTION: Uncomment this block and comment the mock data initialization above
    console.log('📊 Fetching scouter-talent stats for:', { scouterId, talentId });
    
    this.scouterService.getScouterTalentStats(scouterId, talentId).subscribe({
      next: (response) => {
        console.log('✅ Scouter-talent stats loaded:', response);
        this.statsData = response;
        this.initializeChartsWithApiData(response);
      },
      error: (error) => {
        console.error('❌ Failed to load scouter-talent stats:', error);
        console.log('🔄 Falling back to mock data...');
        this.initializeChartsWithMockData();
      }
    });
    */
  }

  private initializeChartsWithApiData(apiData: any) {
    if (!this.hire) return;

    console.log('📊 Initializing charts with API data for:', this.hire.name);

    // Transform API data to chart format
    this.transformApiDataToCharts(apiData);
  }

  private initializeChartsWithMockData() {
    if (!this.hire) return;

    console.log('📊 Initializing charts with mock data for:', this.hire.name);

    // Calculate statistics based on actual ratings from hire data
    this.initializePieChart();
    this.initializeBarChart();
    this.initializeRatingList();
  }

  private transformApiDataToCharts(apiData: any) {
    // Example transformation - adjust based on your actual API response structure
    const ratingsDistribution = apiData.ratingsDistribution || {};
    const engagementHistory = apiData.engagementHistory || [];
    const performanceMetrics = apiData.performanceMetrics || {};

    // Update pie chart with API data
    this.pieChartData = {
      labels: [
        'Very impressive [⭐⭐⭐⭐⭐]',
        'Impressive [⭐⭐⭐⭐]',
        'Fairly impressive [⭐⭐⭐]',
        'Manageable [⭐⭐]',
        'Poor delivery [⭐]',
        'Not available',
      ],
      datasets: [
        {
          data: [
            ratingsDistribution.fiveStar || 0,
            ratingsDistribution.fourStar || 0,
            ratingsDistribution.threeStar || 0,
            ratingsDistribution.twoStar || 0,
            ratingsDistribution.oneStar || 0,
            ratingsDistribution.noRating || 0,
          ],
          backgroundColor: [
            '#6A1B9A',
            '#8E24AA',
            '#BA68C8',
            '#FF7043',
            '#D32F2F',
            '#BDBDBD',
          ],
        },
      ],
    };

    // Update bar chart with API data
    const labels = engagementHistory
      .map((_: any, i: number) => String.fromCharCode(65 + i))
      .slice(0, 15);

    const yourRatings = engagementHistory
      .map((engagement: any) => engagement.scouterRating || 0)
      .slice(0, 15);

    const talentRatings = engagementHistory
      .map((engagement: any) => engagement.talentRating || 0)
      .slice(0, 15);

    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Your rating',
          data: yourRatings,
          backgroundColor: '#1E40AF',
        },
        {
          label: `${this.userName}'s average rating`,
          data: talentRatings,
          backgroundColor: '#4B5563',
        },
      ],
    };

    // Update rating list with API data
    this.ratingList = engagementHistory
      .slice(0, 15)
      .map((engagement: any, i: number) => ({
        letter: String.fromCharCode(65 + i),
        date: engagement.date
          ? new Date(engagement.date).toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }) + ` ${this.getRandomTime()}`
          : 'N/A',
        hasRating: !!(engagement.scouterRating || engagement.talentRating),
      }))
      .reverse();
  }

  private loadMockData(talentId: string) {
    if (this.dataLoaded && this.selectedHire) {
      console.log('ℹ️ MarketStats: Skipping mock load, using selected hire');
      return;
    }

    const mock = MockRecentHires.find((m) => String(m.id) === String(talentId));
    if (mock) {
      this.setSelectedHire({
        ...mock,
        jobDescription: mock.jobDescription ?? '',
        yourComment: mock.yourComment ?? '',
        yourRating: mock.yourRating ?? 0,
        talentComment: mock.talentComment ?? '',
        talentRating: mock.talentRating ?? 0,
      } as MockPayment);
      this.dataLoaded = true;
    }
  }

  private initializeCharts() {
    // This method now delegates to either API or mock data initialization
    if (this.statsData) {
      this.initializeChartsWithApiData(this.statsData);
    } else {
      this.initializeChartsWithMockData();
    }
  }

  private initializePieChart() {
    if (!this.hire) return;

    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    const ratingDistribution = this.calculateRatingDistribution(
      scouterRating,
      talentRating
    );

    this.pieChartData = {
      ...this.pieChartData,
      datasets: [
        {
          ...this.pieChartData.datasets[0],
          data: ratingDistribution,
        },
      ],
    };
  }

  private calculateRatingDistribution(
    scouterRating: number,
    talentRating: number
  ): number[] {
    const hasScouterRating = scouterRating > 0;
    const hasTalentRating = talentRating > 0;

    if (!hasScouterRating && !hasTalentRating) {
      return [0, 0, 0, 0, 0, 100];
    }

    let effectiveRating = 0;
    if (hasScouterRating && hasTalentRating) {
      effectiveRating = (scouterRating + talentRating) / 2;
    } else if (hasScouterRating) {
      effectiveRating = scouterRating;
    } else {
      effectiveRating = talentRating;
    }

    if (effectiveRating >= 4.5) return [70, 15, 10, 3, 2, 0];
    else if (effectiveRating >= 3.5) return [20, 50, 20, 5, 3, 2];
    else if (effectiveRating >= 2.5) return [10, 20, 40, 20, 8, 2];
    else if (effectiveRating >= 1.5) return [5, 10, 20, 45, 15, 5];
    else return [2, 5, 10, 20, 58, 5];
  }

  private initializeBarChart() {
    if (!this.hire) return;

    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    const labels = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
    ];

    const yourRatingData = this.generateBarChartData(scouterRating, 15);
    const talentRatingData = this.generateBarChartData(talentRating, 15);

    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Your rating',
          data: yourRatingData,
          backgroundColor: '#1E40AF',
        },
        {
          label: `${this.userName}'s average rating`,
          data: talentRatingData,
          backgroundColor: '#4B5563',
        },
      ],
    };
  }

  private generateBarChartData(baseRating: number, count: number): number[] {
    if (baseRating === 0) {
      return Array(count).fill(0);
    }

    return Array.from({ length: count }, (_, i) => {
      const variation = (Math.random() - 0.5) * 1.5;
      let rating = baseRating + variation;
      rating = Math.max(0, Math.min(5, rating));
      return Math.round(rating * 2) / 2;
    });
  }

  private initializeRatingList() {
    if (!this.hire) return;

    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    const engagementCount = this.calculateEngagementCount(
      scouterRating,
      talentRating
    );

    this.ratingList = Array.from({ length: engagementCount }, (_, i) => {
      const letter = String.fromCharCode(65 + i);
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - (engagementCount - i - 1) * 3);

      return {
        letter: letter,
        date:
          baseDate.toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) + ` ${this.getRandomTime()}`,
        hasRating: i < this.countRatings(scouterRating, talentRating),
      };
    });

    this.ratingList.reverse();
  }

  private calculateEngagementCount(
    scouterRating: number,
    talentRating: number
  ): number {
    const hasAnyRating = scouterRating > 0 || talentRating > 0;

    if (!hasAnyRating) return 3;

    const avgRating =
      (scouterRating + talentRating) /
      ((scouterRating > 0 ? 1 : 0) + (talentRating > 0 ? 1 : 0));

    if (avgRating >= 4) return 15;
    if (avgRating >= 3) return 12;
    if (avgRating >= 2) return 8;
    return 5;
  }

  private countRatings(scouterRating: number, talentRating: number): number {
    return (scouterRating > 0 ? 1 : 0) + (talentRating > 0 ? 1 : 0);
  }

  private getRandomTime(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    const minutes = Math.floor(Math.random() * 60);
    const ampm = Math.random() > 0.5 ? 'am' : 'pm';
    return `${hours}:${minutes.toString().padStart(2, '0')}${ampm}`;
  }

  // Helper methods for template
  get hasRatings(): boolean {
    return !!(
      this.hire &&
      (this.hire.yourRating > 0 || this.hire.talentRating > 0)
    );
  }

  get isUsingApiData(): boolean {
    return !!this.statsData;
  }

  get warningMessage(): string {
    if (!this.hasRatings) {
      return '⚠️ Note!: No ratings have been submitted yet. The charts show placeholder data.';
    }

    const scouterRating = this.hire!.yourRating || 0;
    const talentRating = this.hire!.talentRating || 0;

    if (scouterRating === 0 && talentRating > 0) {
      return '⚠️ Note!: Only talent ratings are available. Your ratings will appear once submitted.';
    } else if (scouterRating > 0 && talentRating === 0) {
      return '⚠️ Note!: Only your ratings are available. Talent ratings will appear once submitted.';
    }

    return '⚠️ Note!: A blank bar indicates no ratings have been submitted yet.';
  }

  get dataSourceInfo(): string {
    return this.isUsingApiData
      ? '📊 Live data from API'
      : '🧪 Mock data for development';
  }
}
