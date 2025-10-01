import { Component } from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-stats',
  templateUrl: './market-stats.component.html',
  styleUrls: ['./market-stats.component.scss'],
  standalone: false,
})
export class MarketStatsComponent {
  hire: MockPayment | undefined;
  userName: string = 'Viki West'; // default name
  // --- PIE CHART ---
  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
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

  // --- BAR CHART ---
  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false, // <-- keep height & width intact
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  barChartData!: ChartData<'bar'>; // will be set dynamically

  // LETTER LIST
  ratingList = Array.from({ length: 15 }, (_, i) => ({
    letter: String.fromCharCode(65 + i), // A → O
    date: `13/June/2024 6:${i + 30}pm`,
  }));

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.hire = MockRecentHires.find((h) => h.id === id);

    if (this.hire) {
      this.userName = this.hire.name; // ✅ dynamically update name
    }

    this.barChartData = {
      labels: [
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
      ],
      datasets: [
        {
          label: 'Your rating',
          data: [5, 4, 5, 3, 3, 4, 5, 2, 3, 4, 1, 5, 4, 3, 2],
          backgroundColor: '#1E40AF', // blue
        },
        {
          label: `${this.userName}'s average rating`,
          data: [0, 3, 5, 4, 0, 2, 4, 3, 1, 5, 3, 0, 4, 2, 3],
          backgroundColor: '#4B5563', // gray
        },
      ],
    };
  }
}
