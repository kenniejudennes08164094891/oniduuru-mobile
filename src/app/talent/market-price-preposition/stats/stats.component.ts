import { Component } from '@angular/core';
import { ChartOptions, ChartData } from 'chart.js';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  standalone: false,

})
export class StatsComponent {
  headerHidden: false | undefined;
  hire: MockPayment | undefined;
  userName: string = 'SeyiAde'; // default name
  isLoading: boolean = false;

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

  constructor(
    private route: ActivatedRoute,
    private endpoint: EndpointService,
    private toastr: ToastrService

  ) { }

  ngOnInit() {
//     console.log('Stats page loaded');
// console.log('Talent ID:', sessionStorage.getItem('talentId'));
// console.log('Scouter ID:', sessionStorage.getItem('scouterId'));

    // Step 1: Retrieve IDs from sessionStorage
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
  const navState: any = history?.state || {};
  const scouterId = navState?.scouterId || navState?.hire?.scouterId;

  console.log('Talent ID:', talentId, 'Scouter ID:', scouterId);

    if (!scouterId || !talentId) {
      this.toastr.error('Missing IDs! Please log in again.');
      return;
    }

    // Step 2: Fetch the market stats from API
    this.isLoading = true;
    this.endpoint.fetchScouterMarketStatsWithTalent(talentId, scouterId).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('API Response:', res);

        // Example structure assumption (adjust to your backend response):
        // res = {
        //   pieData: [25, 15, 20, 10, 20, 10],
        //   barLabels: ['A', 'B', 'C', 'D'],
        //   barData1: [5, 4, 3, 2],
        //   barData2: [3, 2, 4, 5],
        //   name: 'TalentName'
        // }

        // ✅ Step 3: Update charts dynamically
        this.userName = res?.name || this.userName;

        this.pieChartData = {
          ...this.pieChartData,
          datasets: [
            {
              ...this.pieChartData.datasets[0],
              data: res?.pieData || [25, 15, 20, 10, 20, 10], // fallback
            },
          ],
        };

        this.barChartData = {
          labels: res?.barLabels || ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
          datasets: [
            {
              label: 'Your rating',
              data: res?.barData1 || [5, 4, 3, 5, 2, 4, 3],
              backgroundColor: '#1E40AF',
            },
            {
              label: `${this.userName}'s average rating`,
              data: res?.barData2 || [3, 2, 4, 3, 5, 2, 4],
              backgroundColor: '#4B5563',
            },
          ],
        };
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching stats:', err);
        this.toastr.error('Failed to load market stats.');
      },
    });
  }
}
