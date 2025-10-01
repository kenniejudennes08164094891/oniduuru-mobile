import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { Clipboard } from '@angular/cdk/clipboard'; // <-- Angular CDK Clipboard
import { ToastController } from '@ionic/angular';
import { ChartOptions, ChartData } from 'chart.js';

@Component({
  selector: 'app-wallet-page',
  templateUrl: './wallet-page.component.html',
  styleUrls: ['./wallet-page.component.scss'],
  standalone: false,
})
export class WalletPageComponent implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('dropdownSection') dropdownSection!: ElementRef;

  headerHidden: boolean = false;
  images = imageIcons;
  userName = 'Viki West';
  walletBalance: number = 170000;
  accountNumber: string = '0447429947';
  balanceHidden: boolean = false;

  copied: boolean = false; // track icon state

  filterOpen: boolean = false;
  selectedFilter: string = 'Last 10 years';
  years: string[] = [
    '2025',
    '2024',
    '2023',
    '2022',
    '2021',
    '2020',
    '2019',
    '2018',
    '2017',
    '2016',
  ];

  constructor(
    private clipboard: Clipboard,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {}

  toggleBalance() {
    this.balanceHidden = !this.balanceHidden;
  }

  copyAccountNumber() {
    this.clipboard.copy(this.accountNumber);
    this.copied = true;
    // this.showToast('Account number copied!');

    // reset icon back after 2 seconds
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  // async showToast(message: string) {
  //   const toast = await this.toastCtrl.create({
  //     message,
  //     duration: 2000,
  //     color: 'success',
  //     position: 'bottom',
  //   });
  //   toast.present();
  // }

  toggleFilter() {
    this.filterOpen = !this.filterOpen;

    if (this.filterOpen) {
      // give Angular time to render the dropdown
      setTimeout(() => {
        const yOffset = this.dropdownSection.nativeElement.offsetTop;
        this.content.scrollToPoint(0, yOffset, 500); // smooth scroll
      }, 50);
    }
  }

  // Store different datasets per year
  transactionData: Record<string, number[][]> = {
    '2025': [
      [5, 4, 5, 3, 5, 2, 3, 4, 5, 1, 5, 3],
      [4, 2, 2, 4, 5, 5, 4, 5, 3, 3, 1, 4],
      [1, 3, 2, 4, 3, 5, 2, 6, 4, 3, 2, 1],
    ],
    '2024': [
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2023': [
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
    ],
    '2022': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2021': [
      [5, 10, 8, 12, 15, 7, 9, 11, 6, 13, 14, 10], // deposits
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2020': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2019': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2018': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2017': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [3, 5, 2, 4, 6, 1, 3, 2, 4, 5, 6, 3],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2],
    ],
    '2016': [
      [7, 12, 9, 10, 16, 8, 14, 13, 11, 15, 10, 12],
      [2, 4, 3, 5, 2, 6, 4, 3, 2, 5, 4, 2], // withdrawal
      [1, 3, 2, 4, 3, 5, 2, 6, 4, 3, 2, 1], // transfers
    ],
    // add more years here
  };

  selectFilter(year: string) {
    this.selectedFilter = year;
    this.filterOpen = false;

    // update chart with the selected year's dataset
    const [deposits, withdrawals, transfers] = this.transactionData[year];
    this.monthlyBarChartData.datasets[0].data = deposits;
    this.monthlyBarChartData.datasets[1].data = withdrawals;
    this.monthlyBarChartData.datasets[2].data = transfers;

    // trigger Angular change detection for chart.js
    this.monthlyBarChartData = { ...this.monthlyBarChartData };
  }

  // --- MONTHLY BAR CHART ---
  monthlyBarChartData: ChartData<'bar'> = {
    labels: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],

    datasets: [
      {
        label: 'Deposits',
        data: [5, 4, 5, 3, 5, 2, 3, 4, 5, 1, 5, 3],
        backgroundColor: '#0033FF', // blue-dot
        // borderRadius: 6,
      },
      {
        label: 'Withdrawals',
        data: [4, 2, 2, 4, 5, 5, 4, 5, 3, 3, 1, 4],
        backgroundColor: '#434348', // gray-dot
        // borderRadius: 6,
      },
      {
        label: 'Transfers',
        data: [1, 3, 2, 4, 3, 5, 2, 6, 4, 3, 2, 1],
        backgroundColor: '#9CA3AF', // dark-dot
        // borderRadius: 6,
      },
    ],
  };

  monthlyBarChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#49536E', // matches text color in Wallet
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#49536E' },
        grid: { color: '#D9DCE5' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#49536E', stepSize: 2 },
        grid: { color: '#D9DCE5' },
      },
    },
  };
}
