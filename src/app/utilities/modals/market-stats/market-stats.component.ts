// market-stats.component.ts

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
import { TotalHires, MockRecentHires } from 'src/app/models/mocks';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-market-stats',
  templateUrl: './market-stats.component.html',
  styleUrls: ['./market-stats.component.scss'],
  standalone: false,
})
export class MarketStatsComponent implements OnInit, OnChanges {
  @Output() hireSelected = new EventEmitter<TotalHires>();
  @Input() selectedHire: TotalHires | undefined;
    private destroy$ = new Subject<void>();


  hire: TotalHires | undefined;
  userName: string = 'Loading...';
  isLoading: boolean = false;

  // Real API data
  statsData: any = null;
  performanceData: any = null;

  // Add this property to track if we're already processing
  private isProcessingHireChange: boolean = false;
  private lastProcessedHireId: string | null = null;


  // Chart data - Fixed pieChartOptions
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12
          },
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;

            // FIX: Type-safe reduce function
            const total = (context.dataset.data as number[]).reduce(
              (acc: number, curr: number) => {
                // Ensure both are numbers
                const a = typeof acc === 'number' ? acc : 0;
                const b = typeof curr === 'number' ? curr : 0;
                return a + b;
              },
              0
            );

            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10
      },
    },
  };

  pieChartData: ChartData<'pie'> = {
    labels: ['Loading data...'],
    datasets: [
      {
        data: [100],
        backgroundColor: ['#BDBDBD'],
        borderWidth: 1,
        borderColor: '#fff'
      },
    ],
  };

  // Update the barChartOptions tooltip callback
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        callbacks: {
          label: (context) => {
            // Fix: Check if value is not null
            const value = context.parsed.y;
            if (value === null || value === undefined) {
              return `${context.dataset.label}: No rating`;
            }

            // Ensure value is a number
            const numValue = typeof value === 'number' ? value : parseFloat(value as any) || 0;

            // Generate star string safely
            const fullStars = Math.floor(numValue);
            const halfStar = numValue % 1 >= 0.5;

            let stars = '';
            if (fullStars > 0) {
              stars = '⭐'.repeat(fullStars);
            }
            if (halfStar) {
              stars += '½';
            }
            if (stars === '' && numValue > 0 && numValue < 1) {
              stars = '½';
            }

            return `${context.dataset.label}: ${numValue.toFixed(1)} ${stars}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            if (typeof value === 'number') {
              return value + '⭐';
            }
            return value;
          }
        },
        max: 5,
        title: {
          display: true,
          text: 'Rating (1-5 stars)',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Market Engagements',
          font: {
            size: 12,
            weight: 'bold'
          }
        },
        grid: {
          display: false
        }
      }
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Loading...'],
    datasets: [
      {
        label: 'Scouter Rating',
        data: [0],
        backgroundColor: '#1E40AF',
        borderColor: '#1E3A8A',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Talent Rating',
        data: [0],
        backgroundColor: '#4B5563',
        borderColor: '#374151',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  ratingList: any[] = [];
  dataSourceInfo: string = '📊 Loading real data...';
  warningMessage: string = 'Loading performance data...';

  // Performance metrics
  performanceMetrics = {
    scouterRating: 0,
    talentRating: 0,
    averageRating: 0,
    totalEngagements: 0,
    ratedEngagements: 0,
    ratingRatio: 0,
    performanceScore: 0
  };

  constructor(
    private route: ActivatedRoute,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    console.log('🔄 MarketStats: ngOnInit - initializing');

    // Only load initial data if we don't already have a selected hire
    if (!this.selectedHire) {
      this.loadInitialData();
    } else {
      console.log('✅ Already have selected hire, skipping initial load');
      this.setSelectedHire(this.selectedHire);
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedHire'] && changes['selectedHire'].currentValue) {
      const newHire = changes['selectedHire'].currentValue;
      const newHireId = newHire.id || newHire.talentId;

      console.log('🔄 MarketStats: Selected hire changed:', {
        name: newHire.name,
        id: newHireId,
        previousId: this.lastProcessedHireId,
        isProcessing: this.isProcessingHireChange
      });

      // Prevent infinite loop: don't process if we're already processing or if it's the same hire
      if (this.isProcessingHireChange || this.lastProcessedHireId === newHireId) {
        console.log('⏸️ Skipping hire change - already processing or same hire');
        return;
      }

      this.setSelectedHire(newHire);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

private loadInitialData() {
  console.log('🔄 MarketStats: Loading initial data');
  
  // First check if we have a selected hire from parent
  if (this.selectedHire) {
    this.setSelectedHire(this.selectedHire);
  } else {
    // Otherwise load from URL
    const talentId = this.route.snapshot.paramMap.get('id');
    if (talentId) {
      this.loadHireData(talentId);
    }
  }
}

  private setSelectedHire(hire: TotalHires) {
    console.log('🔄 MarketStats: Setting selected hire:', hire.name);

    // Set processing flag
    this.isProcessingHireChange = true;

    this.hire = hire;
    this.userName = hire.name || 'Talent';
    this.lastProcessedHireId = hire.id || hire.talentId;

    // Load real stats data for the selected hire
    this.loadRealStatsData(hire.id);

    // Emit event to parent (but only if it's a different hire than current)
    if (!this.selectedHire || this.selectedHire.id !== hire.id) {
      this.hireSelected.emit(hire);
    }

    // Reset processing flag after a delay
    setTimeout(() => {
      this.isProcessingHireChange = false;
    }, 100);
  }

  private loadHireData(talentId: string) {
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.loadMockData(talentId);
      this.isLoading = false;
      return;
    }

    this.scouterService.getAllMarketsByScouter(scouterId, {
      talentId: talentId,
      limit: 10
    }).subscribe({
      next: (response) => {
        if (response?.data && response.data.length > 0) {
          this.setSelectedHire(response.data[0]);
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
  }

  private loadRealStatsData(talentId: string) {
    console.log('📊 Fetching real stats for talent:', talentId);
    
  if (this.isLoading) {
    console.log('⏸️ Already loading stats, skipping');
    return;
  }
  
  const currentUser = this.authService.getCurrentUser();
  const scouterId = currentUser?.scouterId || currentUser?.id;

  if (!scouterId) {
    console.error('❌ No scouter ID found for stats');
    this.showPlaceholderData();
    return;
  }

  this.isLoading = true;

  // Fetch scouter-talent stats from API with unsubscribe
  this.scouterService.getScouterTalentStats(scouterId, talentId)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        console.log('✅ Real stats loaded:', response);
        this.statsData = response;
        this.processRealData(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Failed to load real stats:', error);
        this.warningMessage = '⚠️ Could not load real-time data. Using calculated data from current engagement.';
        this.initializeWithHireData();
        this.isLoading = false;
      }
    });
  }
  

  private processRealData(apiData: any) {
    // Process and transform API data into chart formats
    this.dataSourceInfo = '📊 Real-time API Data';

    // Process performance percentages
    this.processPerformanceData(apiData);

    // Process rating history
    this.processRatingHistory(apiData);

    // Calculate performance metrics
    this.calculatePerformanceMetrics();

    // Update warning message based on data quality
    this.updateWarningMessage();
  }

  private processPerformanceData(data: any) {
    // Extract performance percentages from API response
    const performance = data.performanceMetrics || data.ratingsDistribution || {};

    // Type-safe array creation
    const performanceData = [
      performance.excellent || performance.fiveStar || 0,
      performance.good || performance.fourStar || 0,
      performance.average || performance.threeStar || 0,
      performance.fair || performance.twoStar || 0,
      performance.poor || performance.oneStar || 0,
      performance.noRating || 0
    ];

    this.pieChartData = {
      labels: [
        'Excellent (4.5-5 stars)',
        'Good (3.5-4.4 stars)',
        'Average (2.5-3.4 stars)',
        'Fair (1.5-2.4 stars)',
        'Poor (1-1.4 stars)',
        'No Rating'
      ],
      datasets: [{
        data: performanceData,
        backgroundColor: [
          '#6A1B9A', // Excellent - Purple
          '#8E24AA', // Good - Light Purple
          '#BA68C8', // Average - Pink
          '#FF7043', // Fair - Orange
          '#D32F2F', // Poor - Red
          '#BDBDBD'  // No Rating - Gray
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };
  }

  private processRatingHistory(data: any) {
    // Extract rating history from API
    const engagements = data.engagementHistory || data.hireHistory || [];

    if (engagements.length === 0 && this.hire) {
      // Fallback to current hire data if no history
      this.initializeWithHireData();
      return;
    }

    // Create labels (A, B, C, etc.)
    const labels = engagements.slice(0, 15).map((_: any, i: number) =>
      String.fromCharCode(65 + i)
    );

    // Extract ratings - ensure numbers
    const scouterRatings = engagements.slice(0, 15).map((engagement: any) => {
      const rating = engagement.scouterRating || engagement.yourRating || 0;
      return typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    });

    const talentRatings = engagements.slice(0, 15).map((engagement: any) => {
      const rating = engagement.talentRating || 0;
      return typeof rating === 'number' ? rating : parseFloat(rating) || 0;
    });

    this.barChartData = {
      labels: labels,
      datasets: [
        {
          label: 'Your Rating',
          data: scouterRatings,
          backgroundColor: '#1E40AF',
          borderColor: '#1E3A8A',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: `${this.userName}'s Rating`,
          data: talentRatings,
          backgroundColor: '#4B5563',
          borderColor: '#374151',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        }
      ]
    };

    // Generate rating list
    this.ratingList = engagements.slice(0, 15).map((engagement: any, i: number) => {
      const scouterRating = engagement.scouterRating || engagement.yourRating || 0;
      const talentRating = engagement.talentRating || 0;

      return {
        letter: String.fromCharCode(65 + i),
        date: engagement.date
          ? new Date(engagement.date).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
          : 'Date not available',
        hasRating: !!(scouterRating > 0 || talentRating > 0),
        scouterRating: scouterRating > 0 ? `${scouterRating.toFixed(1)} stars` : 'No rating',
        talentRating: talentRating > 0 ? `${talentRating.toFixed(1)} stars` : 'No rating'
      };
    }).reverse();
  }

  private initializeWithHireData() {
    if (!this.hire) return;

    this.dataSourceInfo = '📊 Calculated from Current Engagement';

    // Calculate performance based on current ratings
    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    // Performance pie chart based on ratings
    this.pieChartData = {
      labels: [
        'Excellent (4.5-5 stars)',
        'Good (3.5-4.4 stars)',
        'Average (2.5-3.4 stars)',
        'Fair (1.5-2.4 stars)',
        'Poor (1-1.4 stars)',
        'No Rating'
      ],
      datasets: [{
        data: this.calculatePerformanceFromRatings(scouterRating, talentRating),
        backgroundColor: [
          '#6A1B9A',
          '#8E24AA',
          '#BA68C8',
          '#FF7043',
          '#D32F2F',
          '#BDBDBD'
        ],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };

    // Bar chart with current rating
    this.barChartData = {
      labels: ['Current Engagement'],
      datasets: [
        {
          label: 'Your Rating',
          data: [scouterRating],
          backgroundColor: '#1E40AF',
          borderColor: '#1E3A8A',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: `${this.userName}'s Rating`,
          data: [talentRating],
          backgroundColor: '#4B5563',
          borderColor: '#374151',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        }
      ]
    };

    // Single rating in the list
    this.ratingList = [{
      letter: 'A',
      date: this.hire.date || new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      hasRating: scouterRating > 0 || talentRating > 0,
      scouterRating: scouterRating > 0 ? `${scouterRating.toFixed(1)} stars` : 'No rating',
      talentRating: talentRating > 0 ? `${talentRating.toFixed(1)} stars` : 'No rating'
    }];

    // Calculate performance metrics
    this.calculatePerformanceMetrics();
  }

  private calculatePerformanceFromRatings(scouterRating: number, talentRating: number): number[] {
    // Calculate performance percentages based on ratings
    const avgRating = scouterRating > 0 && talentRating > 0
      ? (scouterRating + talentRating) / 2
      : Math.max(scouterRating, talentRating);

    if (avgRating >= 4.5) return [85, 10, 3, 1, 1, 0];
    else if (avgRating >= 3.5) return [15, 60, 15, 5, 3, 2];
    else if (avgRating >= 2.5) return [5, 15, 50, 20, 7, 3];
    else if (avgRating >= 1.5) return [2, 5, 15, 55, 18, 5];
    else if (avgRating > 0) return [1, 2, 5, 15, 72, 5];
    else return [0, 0, 0, 0, 0, 100];
  }

  private calculatePerformanceMetrics() {
    // Calculate comprehensive performance metrics
    if (!this.hire) return;

    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;
    const totalEngagements = this.ratingList.length;
    const ratedEngagements = this.ratingList.filter(r => r.hasRating).length;

    this.performanceMetrics = {
      scouterRating: scouterRating,
      talentRating: talentRating,
      averageRating: scouterRating > 0 && talentRating > 0
        ? (scouterRating + talentRating) / 2
        : Math.max(scouterRating, talentRating),
      totalEngagements: totalEngagements,
      ratedEngagements: ratedEngagements,
      ratingRatio: totalEngagements > 0 ? (ratedEngagements / totalEngagements) * 100 : 0,
      performanceScore: this.calculatePerformanceScore(scouterRating, talentRating, ratedEngagements)
    };
  }

  private calculatePerformanceScore(scouterRating: number, talentRating: number, ratedEngagements: number): number {
    // Calculate a comprehensive performance score (0-100)
    const ratingScore = ((scouterRating + talentRating) / 10) * 40; // Max 40 points
    const consistencyScore = (ratedEngagements / Math.max(this.ratingList.length, 1)) * 30; // Max 30 points
    const balanceScore = (Math.min(scouterRating, talentRating) / Math.max(scouterRating, talentRating, 1)) * 30; // Max 30 points

    return Math.min(100, ratingScore + consistencyScore + balanceScore);
  }

  private updateWarningMessage() {
    if (!this.hire) {
      this.warningMessage = '⚠️ No hire data available';
      return;
    }

    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    if (scouterRating === 0 && talentRating === 0) {
      this.warningMessage = '⚠️ No ratings submitted yet. Submit ratings to see performance data.';
    } else if (scouterRating === 0) {
      this.warningMessage = '⚠️ You haven\'t rated this talent yet. Your rating will provide better insights.';
    } else if (talentRating === 0) {
      this.warningMessage = '⚠️ Talent hasn\'t rated you yet. Ratings from both sides provide complete insights.';
    } else {
      this.warningMessage = '📊 Performance analysis based on submitted ratings.';
    }
  }

  private showPlaceholderData() {
    this.dataSourceInfo = '⚠️ Unable to load data';
    this.warningMessage = 'Please check your connection or try again later.';

    this.pieChartData = {
      labels: ['Data unavailable'],
      datasets: [{
        data: [100],
        backgroundColor: ['#BDBDBD'],
        borderWidth: 1,
        borderColor: '#fff'
      }]
    };

    this.barChartData = {
      labels: ['N/A'],
      datasets: [
        {
          label: 'Your Rating',
          data: [0],
          backgroundColor: '#BDBDBD',
          borderColor: '#9CA3AF',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Talent Rating',
          data: [0],
          backgroundColor: '#BDBDBD',
          borderColor: '#9CA3AF',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    };

    this.ratingList = [];
    this.performanceMetrics = {
      scouterRating: 0,
      talentRating: 0,
      averageRating: 0,
      totalEngagements: 0,
      ratedEngagements: 0,
      ratingRatio: 0,
      performanceScore: 0
    };
  }

  private loadMockData(talentId: string) {
    const mock = MockRecentHires.find((m) => String(m.id) === String(talentId));
    if (mock) {
      this.setSelectedHire({
        ...mock,
        jobDescription: mock.jobDescription ?? '',
        yourComment: mock.yourComment ?? '',
        yourRating: mock.yourRating ?? 0,
        talentComment: mock.talentComment ?? '',
        talentRating: mock.talentRating ?? 0,
      } as TotalHires);
    } else {
      this.showPlaceholderData();
    }
  }

  // Helper methods for template - FIXED TYPE SAFETY
  get hasRealData(): boolean {
    return !!this.statsData;
  }

  get totalEngagements(): number {
    return this.ratingList.length;
  }

  get averageScouterRating(): string {
    const ratings = this.barChartData.datasets[0].data.filter((r: any) =>
      typeof r === 'number' && r > 0
    ) as number[];

    if (ratings.length === 0) return 'N/A';

    const sum = ratings.reduce((acc: number, curr: number) => acc + curr, 0);
    return (sum / ratings.length).toFixed(1);
  }

  get averageTalentRating(): string {
    const ratings = this.barChartData.datasets[1].data.filter((r: any) =>
      typeof r === 'number' && r > 0
    ) as number[];

    if (ratings.length === 0) return 'N/A';

    const sum = ratings.reduce((acc: number, curr: number) => acc + curr, 0);
    return (sum / ratings.length).toFixed(1);
  }

  get performanceScoreClass(): string {
    const score = this.performanceMetrics.performanceScore;
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  }

  get performanceLabel(): string {
    const score = this.performanceMetrics.performanceScore;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Needs Improvement';
    return 'Poor';
  }

  // Add this method to generate star ratings
  getStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (halfStar) stars += '½';
    return stars;
  }
}