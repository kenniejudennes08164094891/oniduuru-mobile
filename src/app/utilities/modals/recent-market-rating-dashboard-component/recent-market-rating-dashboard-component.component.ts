import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-recent-market-rating-dashboard-component',
  templateUrl: './recent-market-rating-dashboard-component.component.html',
  styleUrls: ['./recent-market-rating-dashboard-component.component.scss'],
  standalone: false,
})
export class RecentMarketRatingDashboardComponent implements OnInit, OnChanges {
  @Input() marketRatingsData: any[] = [];

  images = imageIcons

  hasRatings: boolean = false;
  allScoresZero: boolean = false;

  // Chart data
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Your Ratings',
        data: [],
        backgroundColor: '#3BBEF6',
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.6,
      },
      {
        label: "Talent's Ratings",
        data: [],
        backgroundColor: '#6556E9',
        borderRadius: 0,
        barPercentage: 0.9,
        categoryPercentage: 0.6,
      },
    ],
  };

  // Chart options
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 10,
          boxWidth: 10,
          font: {
            size: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 12 : 14
          }
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += context.parsed.x + '%';
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 20,
          callback: function (value) {
            return value + '%';
          },
          font: {
            size: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 12 : 14
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 12 : 14
          }
        }
      },
    },
  };

  ngOnInit() {
    this.updateChartData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['marketRatingsData']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    console.log('📊 Market ratings data received:', this.marketRatingsData);

    if (this.marketRatingsData && this.marketRatingsData.length > 0) {
      this.hasRatings = true;

      // Use ALL market ratings, even if scores are 0
      // This shows that ratings exist but haven't been given yet
      const validRatings = this.marketRatingsData;

      if (validRatings.length > 0) {
        // Format dates properly
        this.barChartData.labels = validRatings.map(rating => {
          const dateStr = rating.dateOfHire || '';
          // Format date from "16/January/2026:1:31pm" to "16 Jan 2026"
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length >= 3) {
              const day = parts[0];
              const month = parts[1];
              const yearTime = parts[2];
              const year = yearTime.split(':')[0];
              // Short month name
              const monthShort = month.substring(0, 3);
              return `${day} ${monthShort} ${year}`;
            }
          }
          return dateStr;
        }).slice(0, 5); // Limit to last 5

        this.barChartData.datasets[0].data = validRatings
          .map(rating => rating.scouterScore || 0)
          .slice(0, 5);

        this.barChartData.datasets[1].data = validRatings
          .map(rating => rating.talentScore || 0)
          .slice(0, 5);

        // Check if all scores are zero
        this.allScoresZero = this.checkIfAllScoresZero();

        console.log('📈 Chart data updated:', {
          labels: this.barChartData.labels,
          scouterScores: this.barChartData.datasets[0].data,
          talentScores: this.barChartData.datasets[1].data,
          allScoresZero: this.allScoresZero
        });
      } else {
        this.hasRatings = false;
        this.allScoresZero = false;
      }
    } else {
      this.hasRatings = false;
      this.allScoresZero = false;
      console.log('📊 No market ratings data available');
    }
  }

  private checkIfAllScoresZero(): boolean {
    // Check if dataset 0 has data and all scores are 0
    const dataset0 = this.barChartData.datasets[0].data;
    const dataset1 = this.barChartData.datasets[1].data;

    if (dataset0.length === 0 && dataset1.length === 0) {
      return false;
    }

    const allZero0 = dataset0.every(score => score === 0);
    const allZero1 = dataset1.every(score => score === 0);

    return allZero0 && allZero1;
  }

  // Helper method to check if chart should be shown
  shouldShowChart(): boolean {
    return this.hasRatings &&
      (this.barChartData.datasets[0].data.length > 0 ||
        this.barChartData.datasets[1].data.length > 0);
  }
}