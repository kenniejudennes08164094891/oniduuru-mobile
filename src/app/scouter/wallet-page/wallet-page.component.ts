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
})
export class WalletPageComponent implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('dropdownSection') dropdownSection!: ElementRef;

  headerHidden: boolean = false;
  images = imageIcons;
  userName = 'Vikiwest';
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

  selectFilter(year: string) {
    this.selectedFilter = year;
    this.filterOpen = false;
  }

  // --- MONTHLY BAR CHART ---
  monthlyBarChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
      },
    },
  };

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
        data: [5, 10, 8, 12, 15, 7, 9, 11, 6, 13, 14, 10],
        backgroundColor: '#1E40AF', // blue
      },
      {
        label: 'Withdrawals',
        data: [2, 4, 3, 6, 5, 2, 4, 3, 1, 7, 5, 4],
        backgroundColor: '#4B5563', // gray
      },
      {
        label: 'Transfers',
        data: [1, 3, 2, 4, 3, 5, 2, 6, 4, 3, 2, 1],
        backgroundColor: '#16A34A', // green
      },
    ],
  };
}
