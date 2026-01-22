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
  private readonly MAX_DISPLAY_ITEMS = 4; // Show max 4 items at a time

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

  // Chart options - Updated for star ratings (1-5)
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
              // Show star rating in tooltip
              const rating = context.parsed.x;
              const stars = '★'.repeat(Math.floor(rating)) + 
                           (rating % 1 >= 0.5 ? '½' : '') + 
                           '☆'.repeat(5 - Math.ceil(rating));
              label += `${rating.toFixed(1)} ${stars}`;
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        min: 0,
        max: 5, // Changed from 100 to 5 for star ratings
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          stepSize: 1, // Changed from 20 to 1
          callback: function (value) {
            // Show stars instead of percentage
            const numValue = Number(value);
            if (numValue >= 0 && numValue <= 5) {
              // Show star icons or numbers
              if (numValue === 0) return '0';
              if (numValue === 1) return '1★';
              if (numValue === 2) return '2★';
              if (numValue === 3) return '3★';
              if (numValue === 4) return '4★';
              if (numValue === 5) return '5★';
            }
            return '';
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

      // Sort by date (newest first) based on dateOfHire
      const sortedRatings = [...this.marketRatingsData].sort((a, b) => {
        const dateA = this.parseDateString(a.dateOfHire);
        const dateB = this.parseDateString(b.dateOfHire);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });

      // Take only the latest MAX_DISPLAY_ITEMS
      const latestRatings = sortedRatings.slice(0, this.MAX_DISPLAY_ITEMS);
      
      // Format dates for labels (show newest at top) with time
      this.barChartData.labels = latestRatings.map(rating => {
        const dateStr = rating.dateOfHire || '';
        // Format date from "16/January/2026:1:31pm" to "16 Jan 2026, 1:31pm"
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length >= 3) {
            const day = parts[0];
            const month = parts[1];
            const yearTime = parts[2];
            
            // Split year and time
            const [yearPart, ...timeParts] = yearTime.split(':');
            const timeStr = timeParts.join(':');
            
            // Short month name
            const monthShort = month.substring(0, 3);
            
            // Format time to 12-hour format with am/pm
            let formattedTime = '';
            if (timeStr) {
              // Check if timeStr already has am/pm
              if (timeStr.includes('am') || timeStr.includes('pm')) {
                // Remove any extra colons and format
                formattedTime = timeStr.replace(/:am|:pm/i, (match: string) => {
                  return match.toLowerCase();
                });
              } else {
                // If no am/pm, assume 24-hour format
                const timePartsArray = timeStr.split(':');
                if (timePartsArray.length >= 2) {
                  let hours = parseInt(timePartsArray[0], 10);
                  const minutes = timePartsArray[1];
                  const period = hours >= 12 ? 'pm' : 'am';
                  hours = hours % 12 || 12; // Convert to 12-hour format
                  formattedTime = `${hours}:${minutes}${period}`;
                }
              }
            }
            
            // Return date with time
            if (formattedTime) {
              return `${day} ${monthShort} ${yearPart}, ${formattedTime}`;
            } else {
              return `${day} ${monthShort} ${yearPart}`;
            }
          }
        }
        return dateStr;
      });

      // Use scores directly (already in star format 0-5)
      this.barChartData.datasets[0].data = latestRatings
        .map(rating => rating.scouterScore || 0);

      this.barChartData.datasets[1].data = latestRatings
        .map(rating => rating.talentScore || 0);

      // Check if all scores are zero
      this.allScoresZero = this.checkIfAllScoresZero();

      console.log('📈 Chart data updated:', {
        totalItems: this.marketRatingsData.length,
        displayItems: latestRatings.length,
        labels: this.barChartData.labels,
        scouterScores: this.barChartData.datasets[0].data,
        talentScores: this.barChartData.datasets[1].data,
        allScoresZero: this.allScoresZero
      });
    } else {
      this.hasRatings = false;
      this.allScoresZero = false;
      console.log('📊 No market ratings data available');
    }
  }

  private parseDateString(dateStr: string): Date {
    if (!dateStr) return new Date(0); // Return epoch if no date
    
    try {
      // Parse format: "16/January/2026:1:31pm"
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length >= 3) {
          const day = parts[0];
          const month = parts[1];
          const yearTime = parts[2];
          
          // Split year and time
          const [yearPart, ...timeParts] = yearTime.split(':');
          const timeStr = timeParts.join(':');
          
          // Convert month name to number (0-11)
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const monthIndex = monthNames.findIndex(m => 
            m.toLowerCase().startsWith(month.toLowerCase().substring(0, 3))
          );
          
          // Parse time (e.g., "1:31pm")
          let hours = 0, minutes = 0;
          if (timeStr) {
            const timeMatch = timeStr.match(/(\d+):(\d+)(am|pm)/i);
            if (timeMatch) {
              hours = parseInt(timeMatch[1], 10);
              minutes = parseInt(timeMatch[2], 10);
              const period = timeMatch[3].toLowerCase();
              
              if (period === 'pm' && hours < 12) hours += 12;
              if (period === 'am' && hours === 12) hours = 0;
            }
          }
          
          return new Date(
            parseInt(yearPart, 10),
            monthIndex >= 0 ? monthIndex : 0,
            parseInt(day, 10),
            hours,
            minutes
          );
        }
      }
    } catch (error) {
      console.warn('Could not parse date:', dateStr, error);
    }
    
    // Fallback to current date
    return new Date();
  }

  private checkIfAllScoresZero(): boolean {
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
    return this.hasRatings;
  }
}