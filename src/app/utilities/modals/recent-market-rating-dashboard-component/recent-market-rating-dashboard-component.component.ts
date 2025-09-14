import { Component } from '@angular/core';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-recent-market-rating-dashboard-component',
  templateUrl: './recent-market-rating-dashboard-component.component.html',
  styleUrls: ['./recent-market-rating-dashboard-component.component.scss'],
})
export class RecentMarketRatingDashboardComponent {
  // Labels (dates from your image)
  barChartLabels: string[] = [
    '13/June/2024:6:33Pm',
    '13/June/2024:7:33Pm',
    '17/June/2024:9:33Pm',
    '13/August/2024:6:33Pm',
  ];

  // Chart data
  // Chart data
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: this.barChartLabels,
    datasets: [
      {
        label: 'Your Ratings',
        data: [80, 65, 90, 40],
        backgroundColor: '#3BBEF6',
        borderRadius: 0,
        barPercentage: 0.9, // slightly slimmer bars
        categoryPercentage: 0.6, // more space between bar groups
      },
      {
        label: "Talent's Ratings",
        data: [60, 50, 85, 70],
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
    maintainAspectRatio: false, // ✅ let height fill container
    indexAxis: 'y',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    scales: {
      x: {
        min: 0,
        max: 100,
        grid: { display: false },
      },
      y: {
        grid: { display: false },
      },
    },
  };
}
