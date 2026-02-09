// stats.component.ts - Fixed with proper types

import { Component, OnInit } from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  standalone: false,
})
export class StatsComponent implements OnInit {
  // Loading state
  isLoading: boolean = false;
  hasRealData: boolean = false;
  dataSourceInfo: string = '📊 Loading data...';
  warningMessage: string = 'Loading performance data...';

  // Selected scouter
  selectedScouter: any = null;

  // API response data
  statsResponse: any = null;

  // Pagination properties for engagement history
  currentEngagementPage: number = 1;
  engagementsPerPage: number = 10;
  paginatedRatingList: any[] = [];

  // Chart data
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 12,
          },
          padding: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage =
              total > 0 ? Math.round((value / total) * 100) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
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
        borderColor: '#fff',
      },
    ],
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            if (value === null || value === undefined || value === 0) {
              return `${context.dataset.label}: No rating`;
            }
            const numValue =
              typeof value === 'number' ? value : parseFloat(value as any) || 0;
            const fullStars = Math.floor(numValue);
            const halfStar = numValue % 1 >= 0.5;
            let stars = '';
            if (fullStars > 0) stars = '⭐'.repeat(fullStars);
            if (halfStar) stars += '½';
            if (stars === '' && numValue > 0 && numValue < 1) stars = '½';
            return `${context.dataset.label}: ${numValue.toFixed(1)} ${stars}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function (value: any) {
            if (typeof value === 'number') {
              return value + '⭐';
            }
            return value;
          },
        },
        max: 5,
        title: {
          display: true,
          text: 'Rating (1-5 stars)',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Market Engagements',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  barChartData: ChartData<'bar'> = {
    labels: ['Loading...'],
    datasets: [
      {
        label: 'Your Rating',
        data: [0],
        backgroundColor: '#1E40AF',
        borderColor: '#1E3A8A',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
      {
        label: 'Scouter Rating',
        data: [0],
        backgroundColor: '#4B5563',
        borderColor: '#374151',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6,
      },
    ],
  };

  // Performance metrics - UPDATED to use API response structure
  performanceMetrics = {
    yourRating: 0,
    scouterRating: 0,
    averageRating: 0,
    totalEngagements: 0,
    ratedEngagements: 0,
    successRate: 0,
    performanceScore: 0,
    totalScouterScore: 0,
    totalTalentScore: 0,
  };

  // Rating list from API
  ratingList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private endpoint: EndpointService,
    private toast: ToastsService,
  ) {}

  ngOnInit() {
    console.log('Stats page loaded');
    // Auto-load stats when component is initialized
    this.loadStatsData();
  }

  async loadStatsData() {
    this.isLoading = true;
    this.dataSourceInfo = '📊 Fetching data...';
    this.warningMessage = 'Loading scouter performance data...';

    try {
      // Step 1: Get selected scouter from sessionStorage
      const storedScouter = sessionStorage.getItem('selectedScouter');
      if (storedScouter) {
        this.selectedScouter = JSON.parse(storedScouter);
        console.log('Loaded scouter for stats:', this.selectedScouter);
      } else {
        console.warn('No scouter selected in sessionStorage');
        this.showErrorMessage(
          'No scouter selected. Please select a scouter first.',
        );
        return;
      }

      // Step 2: Retrieve IDs from storage
      const talentId =
        localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
      const scouterId =
        this.selectedScouter?.id || sessionStorage.getItem('scouterId');

      console.log('Loading stats for:', { talentId, scouterId });

      if (!scouterId || !talentId) {
        this.showErrorMessage('Missing scouter or talent information!');
        return;
      }

      // Step 3: Fetch market stats from API
      await this.fetchMarketStats(talentId, scouterId);

      // Step 4: Calculate performance metrics from API data
      this.calculateMetricsFromApiData();

      // Step 5: Update charts with real data
      this.updateChartsWithApiData();

      // Step 6: Update UI
      this.hasRealData = true;
      this.dataSourceInfo = '📊 Real-time Data';

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading stats:', error);
      this.showErrorMessage('Failed to load market stats.');
      this.isLoading = false;
    }
  }

  private fetchMarketStats(talentId: string, scouterId: string) {
    return new Promise<void>((resolve, reject) => {
      this.endpoint
        .fetchScouterMarketStatsWithTalent(talentId, scouterId)
        .subscribe({
          next: (res: any) => {
            console.log('Market Stats API Response:', res);
            this.statsResponse = res;

            if (res?.data?.allScouterMarketWithTalent) {
              console.log(
                'Market engagements found:',
                res.data.allScouterMarketWithTalent.length,
              );
            }

            resolve();
          },
          error: (err: any) => {
            console.error('Error fetching market stats:', err);
            reject(err);
          },
        });
    });
  }

  private calculateMetricsFromApiData() {
    if (!this.statsResponse?.data?.allScouterMarketWithTalent) {
      console.warn('No market engagements data found');
      this.useFallbackData();
      return;
    }

    const engagements = this.statsResponse.data.allScouterMarketWithTalent;
    const totalEngagements = engagements.length;

    // Calculate scores from the API data
    let totalTalentScore = 0;
    let totalScouterScore = 0;
    let ratedTalentEngagements = 0;
    let ratedScouterEngagements = 0;

    // Process each engagement
    engagements.forEach((engagement: any) => {
      // Talent rating and score
      if (engagement.talentScore > 0) {
        totalTalentScore += engagement.talentScore;
        ratedTalentEngagements++;
      }

      // Scouter rating and score
      if (engagement.scouterScore > 0) {
        totalScouterScore += engagement.scouterScore;
        ratedScouterEngagements++;
      }
    });

    // Calculate averages
    const avgTalentScore =
      ratedTalentEngagements > 0
        ? totalTalentScore / ratedTalentEngagements
        : 0;
    const avgScouterScore =
      ratedScouterEngagements > 0
        ? totalScouterScore / ratedScouterEngagements
        : 0;
    const overallAvg = (avgTalentScore + avgScouterScore) / 2;

    // Calculate success rate (assuming any engagement is a "success")
    const successRate = totalEngagements > 0 ? 100 : 0;

    // Calculate performance score (0-100)
    let performanceScore = 0;
    if (totalEngagements > 0) {
      // Rating component (max 50 points)
      const ratingScore = Math.min(50, (overallAvg / 5) * 50);

      // Engagement count component (max 30 points)
      const engagementScore = Math.min(30, (totalEngagements / 10) * 30);

      // Rating completion component (max 20 points)
      const totalRated = ratedTalentEngagements + ratedScouterEngagements;
      const ratingCompletionScore = Math.min(
        20,
        (totalRated / (totalEngagements * 2)) * 20,
      );

      performanceScore = ratingScore + engagementScore + ratingCompletionScore;
    }

    this.performanceMetrics = {
      yourRating: avgTalentScore,
      scouterRating: avgScouterScore,
      averageRating: overallAvg,
      totalEngagements: totalEngagements,
      ratedEngagements: ratedTalentEngagements + ratedScouterEngagements,
      successRate: successRate,
      performanceScore: performanceScore,
      totalScouterScore: totalScouterScore,
      totalTalentScore: totalTalentScore,
    };

    // Generate rating list from API engagements
    this.generateRatingListFromApi(engagements);

    // Update warning message
    this.updateWarningMessage();
  }

  private generateRatingListFromApi(engagements: any[]) {
    if (!engagements || engagements.length === 0) {
      this.ratingList = [];
      this.updatePaginatedRatingList();
      return;
    }

    // Sort by date (oldest first) - ensure we handle invalid dates
    const sortedEngagements = [...engagements].sort((a: any, b: any) => {
      const dateA = this.parseDateString(a.dateOfHire);
      const dateB = this.parseDateString(b.dateOfHire);

      // Handle invalid dates by putting them at the end
      const timeA = isNaN(dateA.getTime()) ? Infinity : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? Infinity : dateB.getTime();

      return timeA - timeB; // Ascending order (oldest first)
    });

    this.ratingList = sortedEngagements.map(
      (engagement: any, index: number) => {
        const yourRating = engagement.talentScore || 0;
        const scouterRating = engagement.scouterScore || 0;
        const hasRating = yourRating > 0 || scouterRating > 0;

        // Format date
        let formattedDate = 'Date not available';
        let dateObj: Date | null = null;

        if (engagement.dateOfHire) {
          try {
            dateObj = this.parseDateString(engagement.dateOfHire);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
            } else {
              formattedDate = engagement.dateOfHire;
            }
          } catch (e) {
            formattedDate = engagement.dateOfHire;
          }
        }

        // Map ratings to descriptive text
        const getRatingText = (score: number, ratingText: string) => {
          if (score > 0) {
            return `${score.toFixed(1)} stars (${ratingText})`;
          }
          return 'No rating';
        };

        // CHANGED: Use number instead of letter
        return {
          number: index + 1, // Start from 1 instead of letter
          date: formattedDate,
          hasRating: hasRating,
          yourRating: getRatingText(
            yourRating,
            engagement.talentRating || 'Not rated',
          ),
          scouterRating: getRatingText(
            scouterRating,
            engagement.scouterRating || 'Not rated',
          ),
          rawData: engagement,
          rawDate: engagement.dateOfHire,
          dateObject: dateObj,
        };
      },
    );

    // Debug: Log the order
    console.log(
      'Engagement History Order (#1 = Oldest, #' +
        this.ratingList.length +
        ' = Newest):',
    );
    this.ratingList.forEach((item, index) => {
      console.log(`#${item.number}: ${item.date} (${item.rawDate})`);
    });

    // Update the bar chart with correct order
    this.updateChartsWithApiData();

    // Update paginated list
    this.updatePaginatedRatingList();
  }

  // Get total pages for pagination
  get totalEngagementPages(): number {
    return Math.ceil(this.ratingList.length / this.engagementsPerPage) || 1;
  }

  nextEngagementPage() {
    if (this.currentEngagementPage < this.totalEngagementPages) {
      this.currentEngagementPage++;
      this.updatePaginatedRatingList();
    }
  }

  getPageRange(): number[] {
    const totalPages = this.totalEngagementPages;
    const currentPage = this.currentEngagementPage;
    const range: number[] = [];

    // Show up to 3 pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }

  prevEngagementPage() {
    if (this.currentEngagementPage > 1) {
      this.currentEngagementPage--;
      this.updatePaginatedRatingList();
    }
  }

  goToEngagementPage(page: number) {
    if (page >= 1 && page <= this.totalEngagementPages) {
      this.currentEngagementPage = page;
      this.updatePaginatedRatingList();
    }
  }

  // Update paginated rating list based on current page
  private updatePaginatedRatingList() {
    const startIndex =
      (this.currentEngagementPage - 1) * this.engagementsPerPage;
    const endIndex = startIndex + this.engagementsPerPage;
    this.paginatedRatingList = this.ratingList.slice(startIndex, endIndex);
  }

  private parseDateString(dateStr: string): Date {
    // Handle format like "24/January/2026:1:27am"
    if (dateStr.includes('/') && dateStr.includes(':')) {
      const parts = dateStr.split(':');
      const datePart = parts[0]; // "24/January/2026"
      const timePart = parts.slice(1).join(':'); // "1:27am"

      const dateParts = datePart.split('/');
      if (dateParts.length === 3) {
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];

        // Parse time
        let hours = 0,
          minutes = 0;
        if (timePart) {
          const timeMatch = timePart.match(/(\d+):(\d+)(am|pm)?/i);
          if (timeMatch) {
            hours = parseInt(timeMatch[1]);
            minutes = parseInt(timeMatch[2]);
            const ampm = timeMatch[3]?.toLowerCase();
            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;
          }
        }

        const date = new Date(
          `${month} ${day}, ${year} ${hours}:${minutes}:00`,
        );
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Fallback to Date constructor
    return new Date(dateStr);
  }

  private updateChartsWithApiData() {
    const displayName = this.selectedScouter?.name || 'Scouter';

    // Update pie chart with rating distribution
    const pieData = this.calculatePieDataFromApi();

    this.pieChartData = {
      labels: [
        `Excellent with  [⭐⭐⭐⭐⭐]`,
        `Good with  [⭐⭐⭐⭐]`,
        `Average with  [⭐⭐⭐]`,
        `Fair with  [⭐⭐]`,
        `Poor with  [⭐]`,
        'No Rating Available',
      ],
      datasets: [
        {
          data: pieData,
          backgroundColor: [
            '#6A1B9A', // Excellent - Purple
            '#8E24AA', // Good - Light Purple
            '#BA68C8', // Average - Pink
            '#FF7043', // Fair - Orange
            '#D32F2F', // Poor - Red
            '#BDBDBD', // No Rating - Gray
          ],
          borderWidth: 1,
          borderColor: '#fff',
        },
      ],
    };

    // Update bar chart with recent ratings from API
    const recentRatings = this.getRecentRatingsForBarChart();

    this.barChartData = {
      labels: recentRatings.labels,
      datasets: [
        {
          label: 'Your Rating',
          data: recentRatings.yourRatings,
          backgroundColor: '#1E40AF',
          borderColor: '#1E3A8A',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
        {
          label: `${displayName}'s Rating`,
          data: recentRatings.scouterRatings,
          backgroundColor: '#4B5563',
          borderColor: '#374151',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.6,
        },
      ],
    };
  }

  private calculatePieDataFromApi(): number[] {
    const engagements =
      this.statsResponse?.data?.allScouterMarketWithTalent || [];
    if (engagements.length === 0) return [0, 0, 0, 0, 0, 100];

    // Count ratings by category
    const counts = [0, 0, 0, 0, 0, 0]; // [5-star, 4-star, 3-star, 2-star, 1-star, no-rating]

    engagements.forEach((engagement: any) => {
      const talentScore = engagement.talentScore || 0;
      const scouterScore = engagement.scouterScore || 0;
      const avgScore = (talentScore + scouterScore) / 2;

      if (avgScore >= 4.5)
        counts[0]++; // Excellent
      else if (avgScore >= 4.0)
        counts[1]++; // Good
      else if (avgScore >= 3.0)
        counts[2]++; // Average
      else if (avgScore >= 2.0)
        counts[3]++; // Fair
      else if (avgScore > 0)
        counts[4]++; // Poor
      else counts[5]++; // No rating
    });

    // Convert to percentages
    const total = engagements.length;
    return counts.map((count) => (count / total) * 100);
  }

  private getRecentRatingsForBarChart(): {
    labels: string[];
    yourRatings: number[];
    scouterRatings: number[];
  } {
    const engagements =
      this.statsResponse?.data?.allScouterMarketWithTalent || [];

    // Take up to 10 most recent engagements
    const recentEngagements = engagements.slice(0, 10);

    // CHANGED: Use numbers instead of letters
    const labels = recentEngagements.map(
      (_: any, index: number) => `Engagement #${index + 1}`,
    );
    const yourRatings = recentEngagements.map((e: any) => e.talentScore || 0);
    const scouterRatings = recentEngagements.map(
      (e: any) => e.scouterScore || 0,
    );

    return { labels, yourRatings, scouterRatings };
  }

  private updateWarningMessage() {
    const totalEngagements = this.performanceMetrics.totalEngagements;
    const ratedEngagements = this.performanceMetrics.ratedEngagements;

    if (totalEngagements === 0) {
      this.warningMessage = '⚠️ No engagements found with this scouter';
    } else if (ratedEngagements === 0) {
      this.warningMessage =
        '⚠️ No ratings submitted yet. Ratings provide performance insights.';
    } else if (ratedEngagements < totalEngagements * 2) {
      // Each engagement has 2 possible ratings
      const unrated = totalEngagements * 2 - ratedEngagements;
      this.warningMessage = `📊 ${ratedEngagements} ratings (${unrated} ratings pending)`;
    } else {
      this.warningMessage = `📊 Complete performance data based on ${totalEngagements} engagement${totalEngagements !== 1 ? 's' : ''}`;
    }
  }

  private useFallbackData() {
    this.hasRealData = false;
    this.dataSourceInfo = '📊 Sample Data';
    this.warningMessage = '⚠️ Using sample data - real-time stats unavailable';

    // Sample performance metrics
    this.performanceMetrics = {
      yourRating: 4.2,
      scouterRating: 4.0,
      averageRating: 4.1,
      totalEngagements: 8,
      ratedEngagements: 6,
      successRate: 75,
      performanceScore: 82,
      totalScouterScore: 0,
      totalTalentScore: 0,
    };

    // Sample rating list - CHANGED to use numbers
    this.ratingList = Array.from({ length: 8 }, (_: any, i: number) => ({
      number: i + 1, // Changed from letter to number
      date: new Date(Date.now() - i * 86400000).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      hasRating: i < 6,
      yourRating:
        i < 6 ? `${(4.0 + Math.random() * 0.5).toFixed(1)} stars` : 'No rating',
      scouterRating:
        i < 6 ? `${(3.8 + Math.random() * 0.4).toFixed(1)} stars` : 'No rating',
    }));
  }

  private showErrorMessage(message: string) {
    this.toast.openSnackBar(message, 'error');
    this.useFallbackData();
    this.dataSourceInfo = '⚠️ Error Loading Data';
  }

  // Template helper methods
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
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let stars = '⭐'.repeat(fullStars);
    if (halfStar) stars += '½';
    return stars;
  }
}
