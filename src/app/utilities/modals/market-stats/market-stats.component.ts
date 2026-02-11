import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { TotalHires } from 'src/app/models/mocks';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';
import { Subject, takeUntil, catchError, of, finalize } from 'rxjs';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-market-stats',
  templateUrl: './market-stats.component.html',
  styleUrls: ['./market-stats.component.scss'],
  standalone: false,
})
export class MarketStatsComponent implements OnInit, OnChanges, OnDestroy {
  @Output() hireSelected = new EventEmitter<TotalHires>();
  @Input() selectedHire: TotalHires | undefined;
  @Input() showAllEngagements: boolean = false;

  private destroy$ = new Subject<void>();

  hire: TotalHires | undefined;
  userName: string = 'Loading...';
  isLoading: boolean = false;
  error: string | null = null;

  // Real API data
  statsData: any = null;

  private isProcessingHireChange: boolean = false;
  private lastProcessedHireId: string | null = null;

  // Chart data
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: { font: { size: 12 }, padding: 20 }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  pieChartData: ChartData<'pie'> = {
    labels: ['Loading data...'],
    datasets: [{ data: [100], backgroundColor: ['#BDBDBD'] }]
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 12 } } }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, callback: (value) => value + '⭐' },
        max: 5,
        title: { display: true, text: 'Rating (1-5 stars)' }
      },
      x: {
        title: { display: true, text: 'Engagement Number' },
        ticks: { maxRotation: 45, minRotation: 45, autoSkip: true, maxTicksLimit: 20 }
      }
    }
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
        barPercentage: 0.6
      },
      {
        label: 'Talent Rating',
        data: [0],
        backgroundColor: '#4B5563',
        borderColor: '#374151',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6
      }
    ]
  };

  ratingList: any[] = [];
  dataSourceInfo: string = '📊 Loading real data...';
  warningMessage: string = 'Loading performance data...';

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
    private authService: AuthService,
    private toastService: ToastsService
  ) {}

  ngOnInit() {
    if (!this.selectedHire) {
      this.loadInitialData();
    } else {
      this.setSelectedHire(this.selectedHire);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedHire'] && changes['selectedHire'].currentValue) {
      const newHire = changes['selectedHire'].currentValue;
      const newHireId = newHire.id || newHire.talentId;

      if (this.isProcessingHireChange || this.lastProcessedHireId === newHireId) {
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
    if (this.selectedHire) {
      this.setSelectedHire(this.selectedHire);
    } else {
      const talentId = this.route.snapshot.paramMap.get('id');
      if (talentId) {
        this.loadHireData(talentId);
      }
    }
  }

  private setSelectedHire(hire: TotalHires) {
    this.isProcessingHireChange = true;
    this.hire = hire;
    this.userName = hire.name || 'Talent';
    this.lastProcessedHireId = hire.id || hire.talentId;

    if (hire.id === 'all-engagements' || (hire as any).showAllEngagements) {
      this.loadAllEngagementsForScouter();
    } else {
      this.loadRealStatsData(hire.id);
    }

    if (!this.selectedHire || this.selectedHire.id !== hire.id) {
      this.hireSelected.emit(hire);
    }

    setTimeout(() => {
      this.isProcessingHireChange = false;
    }, 100);
  }

  private loadHireData(talentId: string) {
    this.isLoading = true;
    this.error = null;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      this.error = 'Scouter ID not found';
      this.showPlaceholderData();
      this.isLoading = false;
      return;
    }

    this.scouterService
      .getAllMarketsByScouter(scouterId, { talentId, limit: 10 })
      .pipe(
        catchError((error) => {
          this.error = 'Failed to load hire data';
          this.showPlaceholderData();
          return of({ data: [] });
        }),
        finalize(() => { this.isLoading = false; })
      )
      .subscribe((response) => {
        if (response?.data?.length > 0) {
          this.setSelectedHire(response.data[0]);
        } else {
          this.showPlaceholderData();
        }
      });
  }

  private loadRealStatsData(talentId: string) {
    if (this.isLoading) return;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      this.showPlaceholderData();
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.scouterService
      .getScouterTalentStats(scouterId, talentId)
      .pipe(
        catchError((error) => {
          console.error('Failed to load stats, loading all engagements:', error);
          this.loadAllEngagementsForScouter();
          return of(null);
        }),
        finalize(() => { this.isLoading = false; })
      )
      .subscribe((response) => {
        if (response) {
          this.statsData = response;
          this.processRealData(response);
        }
      });
  }

  private loadAllEngagementsForScouter() {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      this.showPlaceholderData();
      return;
    }

    this.isLoading = true;
    this.dataSourceInfo = '📊 Complete Scouter History';
    this.userName = 'All Engagements';

    this.scouterService
      .getAllMarketsByScouter(scouterId, { limit: 100, pageNo: 1 })
      .pipe(
        catchError((error) => {
          console.error('Failed to load all engagements:', error);
          this.warningMessage = 'Could not load complete engagement history.';
          this.showPlaceholderData();
          return of({ data: [] });
        }),
        finalize(() => { this.isLoading = false; })
      )
      .subscribe((response) => {
        if (response?.data?.length > 0) {
          const allEngagements = response.data.map((hire: any) => ({
            marketId: hire.marketId || `${hire.talentId}/${hire.id}`,
            talentRating: this.mapRatingToString(hire.talentRating || 0),
            talentScore: hire.talentRating || 0,
            scouterRating: this.mapRatingToString(hire.yourRating || 0),
            scouterScore: hire.yourRating || 0,
            dateOfHire: hire.dateOfHire || hire.date || new Date().toLocaleDateString()
          }));

          this.statsData = {
            allScouterMarketWithTalent: allEngagements,
            thierTotalMarketEngagements: allEngagements.length
          };

          this.processRealData(this.statsData);
          this.dataSourceInfo = '📊 Complete Engagement History';
        } else {
          this.showPlaceholderData();
        }
      });
  }

  private processRealData(apiData: any) {
    this.dataSourceInfo = '📊 Real-time API Data';
    this.processPerformanceData(apiData);
    this.processRatingHistory(apiData);
    this.calculatePerformanceMetrics();
    this.updateWarningMessage();
  }

  private processPerformanceData(data: any) {
    const engagements = data?.allScouterMarketWithTalent || [];
    
    let excellent = 0, good = 0, average = 0, fair = 0, poor = 0, noRating = 0;

    engagements.forEach((engagement: any) => {
      const scouterRating = this.mapRatingToNumber(engagement.scouterRating);
      
      if (scouterRating === 0) noRating++;
      else if (scouterRating >= 4.5) excellent++;
      else if (scouterRating >= 3.5) good++;
      else if (scouterRating >= 2.5) average++;
      else if (scouterRating >= 1.5) fair++;
      else if (scouterRating > 0) poor++;
    });

    if (engagements.length === 0) noRating = 1;

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
        data: [excellent, good, average, fair, poor, noRating],
        backgroundColor: ['#6A1B9A', '#8E24AA', '#BA68C8', '#FF7043', '#D32F2F', '#BDBDBD']
      }]
    };
  }

  private processRatingHistory(data: any) {
    const engagements = data?.allScouterMarketWithTalent || [];

    if (engagements.length === 0) {
      if (this.hire) this.initializeWithHireData();
      return;
    }

    const sortedEngagements = [...engagements].sort((a, b) => {
      const dateA = this.parseDate(a.dateOfHire);
      const dateB = this.parseDate(b.dateOfHire);
      return dateA.getTime() - dateB.getTime();
    });

    const labels = sortedEngagements.map((_, i) => `Engagement #${i + 1}`);
    const scouterRatings = sortedEngagements.map(e => this.mapRatingToNumber(e.scouterRating));
    const talentRatings = sortedEngagements.map(e => this.mapRatingToNumber(e.talentRating));

    this.barChartData = {
      labels,
      datasets: [
        {
          label: 'Your Rating',
          data: scouterRatings,
          backgroundColor: '#1E40AF',
          borderColor: '#1E3A8A',
          borderRadius: 4,
          barPercentage: 0.6
        },
        {
          label: `${this.userName}'s Rating`,
          data: talentRatings,
          backgroundColor: '#4B5563',
          borderColor: '#374151',
          borderRadius: 4,
          barPercentage: 0.6
        }
      ]
    };

    this.ratingList = sortedEngagements
      .map((engagement, i) => {
        const scouterRating = this.mapRatingToNumber(engagement.scouterRating);
        const talentRating = this.mapRatingToNumber(engagement.talentRating);
        
        let formattedDate = 'Date not available';
        if (engagement.dateOfHire) {
          const parsedDate = this.parseDate(engagement.dateOfHire);
          if (!isNaN(parsedDate.getTime())) {
            formattedDate = parsedDate.toLocaleDateString('en-US', {
              day: '2-digit', month: 'short', year: 'numeric'
            });
          }
        }

        return {
          number: i + 1,
          date: formattedDate,
          hasRating: !!(scouterRating > 0 || talentRating > 0),
          scouterRating: scouterRating > 0 ? `${scouterRating.toFixed(1)} stars` : 'No rating',
          talentRating: talentRating > 0 ? `${talentRating.toFixed(1)} stars` : 'No rating'
        };
      })
      .reverse();
  }

  private mapRatingToString(rating: number): string {
    if (!rating || rating === 0) return 'not available';
    const map: Record<number, string> = { 5: 'very impressive', 4: 'impressive', 3: 'average', 2: 'manageable', 1: 'poor' };
    return map[rating] || rating.toString();
  }

  private mapRatingToNumber(rating: string | number): number {
    if (typeof rating === 'number') return rating;
    if (!rating || rating === 'not available') return 0;
    
    const map: Record<string, number> = {
      'very impressive': 5, 'impressive': 4, 'manageable': 2, 'poor': 1,
      'excellent': 5, 'good': 4, 'average': 3, 'fair': 2, 'needs improvement': 1
    };
    return map[rating.toLowerCase()] || 0;
  }

  private parseDate(dateString: string): Date {
    if (!dateString) return new Date(0);
    try {
      const [datePart, timePart] = dateString.split(':');
      const [day, month, year] = datePart.split('/');
      let hours = 0, minutes = 0;
      
      if (timePart) {
        const match = timePart.match(/(\d+):(\d+)(am|pm)/i);
        if (match) {
          hours = parseInt(match[1], 10);
          minutes = parseInt(match[2], 10);
          if (match[3].toLowerCase() === 'pm' && hours < 12) hours += 12;
          if (match[3].toLowerCase() === 'am' && hours === 12) hours = 0;
        }
      }
      return new Date(`${month} ${day}, ${year} ${hours}:${minutes}:00`);
    } catch {
      return new Date(0);
    }
  }

  private initializeWithHireData() {
    if (!this.hire) return;

    this.dataSourceInfo = '📊 Current Engagement Only';
    const scouterRating = this.hire.yourRating || 0;
    const talentRating = this.hire.talentRating || 0;

    this.pieChartData = {
      labels: ['Excellent', 'Good', 'Average', 'Fair', 'Poor', 'No Rating'],
      datasets: [{
        data: this.calculatePerformanceFromRatings(scouterRating, talentRating),
        backgroundColor: ['#6A1B9A', '#8E24AA', '#BA68C8', '#FF7043', '#D32F2F', '#BDBDBD']
      }]
    };

    this.barChartData = {
      labels: ['Engagement #1'],
      datasets: [
        { label: 'Your Rating', data: [scouterRating], backgroundColor: '#1E40AF' },
        { label: `${this.userName}'s Rating`, data: [talentRating], backgroundColor: '#4B5563' }
      ]
    };

    this.ratingList = [{
      number: 1,
      date: this.hire.date || new Date().toLocaleDateString(),
      hasRating: scouterRating > 0 || talentRating > 0,
      scouterRating: scouterRating > 0 ? `${scouterRating.toFixed(1)} stars` : 'No rating',
      talentRating: talentRating > 0 ? `${talentRating.toFixed(1)} stars` : 'No rating'
    }];

    this.calculatePerformanceMetrics();
  }

  private calculatePerformanceFromRatings(scouterRating: number, talentRating: number): number[] {
    const avg = scouterRating > 0 && talentRating > 0 
      ? (scouterRating + talentRating) / 2 
      : Math.max(scouterRating, talentRating);
    
    if (avg >= 4.5) return [85, 10, 3, 1, 1, 0];
    if (avg >= 3.5) return [15, 60, 15, 5, 3, 2];
    if (avg >= 2.5) return [5, 15, 50, 20, 7, 3];
    if (avg >= 1.5) return [2, 5, 15, 55, 18, 5];
    if (avg > 0) return [1, 2, 5, 15, 72, 5];
    return [0, 0, 0, 0, 0, 100];
  }

  private calculatePerformanceMetrics() {
    if (!this.statsData?.allScouterMarketWithTalent) {
      if (this.hire) {
        const scouterRating = this.mapRatingToNumber(this.hire.yourRating || 0);
        const talentRating = this.mapRatingToNumber(this.hire.talentRating || 0);
        const rated = this.ratingList.filter(r => r.hasRating).length;

        this.performanceMetrics = {
          scouterRating,
          talentRating,
          averageRating: scouterRating > 0 && talentRating > 0 
            ? (scouterRating + talentRating) / 2 
            : Math.max(scouterRating, talentRating),
          totalEngagements: this.ratingList.length,
          ratedEngagements: rated,
          ratingRatio: this.ratingList.length > 0 ? (rated / this.ratingList.length) * 100 : 0,
          performanceScore: this.calculatePerformanceScore(scouterRating, talentRating, rated)
        };
      }
      return;
    }

    const engagements = this.statsData.allScouterMarketWithTalent;
    
    let totalScouter = 0, scouterCount = 0, totalTalent = 0, talentCount = 0;
    
    engagements.forEach((e: any) => {
      const sr = this.mapRatingToNumber(e.scouterRating);
      if (sr > 0) { totalScouter += sr; scouterCount++; }
      const tr = this.mapRatingToNumber(e.talentRating);
      if (tr > 0) { totalTalent += tr; talentCount++; }
    });

    const avgScouter = scouterCount > 0 ? totalScouter / scouterCount : 0;
    const avgTalent = talentCount > 0 ? totalTalent / talentCount : 0;
    const rated = this.ratingList.filter(r => r.hasRating).length;

    this.performanceMetrics = {
      scouterRating: avgScouter,
      talentRating: avgTalent,
      averageRating: (avgScouter + avgTalent) / 2,
      totalEngagements: engagements.length,
      ratedEngagements: rated,
      ratingRatio: engagements.length > 0 ? (rated / engagements.length) * 100 : 0,
      performanceScore: this.calculatePerformanceScore(avgScouter, avgTalent, rated)
    };
  }

  private calculatePerformanceScore(scouterRating: number, talentRating: number, ratedEngagements: number): number {
    const ratingScore = ((scouterRating + talentRating) / 10) * 40;
    const consistencyScore = (ratedEngagements / Math.max(this.ratingList.length, 1)) * 30;
    const balanceScore = (Math.min(scouterRating, talentRating) / Math.max(scouterRating, talentRating, 1)) * 30;
    return Math.min(100, ratingScore + consistencyScore + balanceScore);
  }

  private updateWarningMessage() {
    if (!this.hire) {
      this.warningMessage = 'No hire data available';
      return;
    }

    const sr = this.hire.yourRating || 0;
    const tr = this.hire.talentRating || 0;

    if (sr === 0 && tr === 0) {
      this.warningMessage = 'No ratings submitted yet. Submit ratings to see performance data.';
    } else if (sr === 0) {
      this.warningMessage = "You haven't rated this talent yet. Your rating will provide better insights.";
    } else if (tr === 0) {
      this.warningMessage = "Talent hasn't rated you yet. Ratings from both sides provide complete insights.";
    } else {
      this.warningMessage = 'Performance analysis based on submitted ratings.';
    }
  }

  private showPlaceholderData() {
    this.dataSourceInfo = '⚠️ No Data Available';
    this.warningMessage = 'No engagement data found for this talent.';

    this.pieChartData = {
      labels: ['No Data'],
      datasets: [{ data: [100], backgroundColor: ['#BDBDBD'] }]
    };

    this.barChartData = {
      labels: ['N/A'],
      datasets: [
        { label: 'Your Rating', data: [0], backgroundColor: '#BDBDBD' },
        { label: 'Talent Rating', data: [0], backgroundColor: '#BDBDBD' }
      ]
    };

    this.ratingList = [];
    this.performanceMetrics = {
      scouterRating: 0, talentRating: 0, averageRating: 0,
      totalEngagements: 0, ratedEngagements: 0, ratingRatio: 0, performanceScore: 0
    };
  }

  get hasRealData(): boolean { return !!this.statsData; }
  get totalEngagements(): number { return this.ratingList.length; }

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

  getStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(full);
    if (half) stars += '½';
    return stars;
  }
}