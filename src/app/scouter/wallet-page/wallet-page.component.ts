import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { imageIcons } from 'src/app/models/stores';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastController } from '@ionic/angular';
import { ChartOptions, ChartData } from 'chart.js';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

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
  userName: string = 'Loading...';
  walletBalance: number = 0;
  accountNumber: string = 'Loading...';
  balanceHidden: boolean = false;

  // Additional wallet data
  totalDeposit: number = 0;
  totalWithdrawal: number = 0;
  totalTransfer: number = 0;

  copied: boolean = false;
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

  loadingWallet = false;
  walletError = false;
  walletNotFound = false; // New flag for wallet not created

  constructor(
    private clipboard: Clipboard,
    private toastCtrl: ToastController,
    private endpointService: EndpointService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    this.initializeUserData();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.fetchWalletDetails();
  }

  /**
   * Initialize user data from various sources
   */
  private initializeUserData(): void {
    // Try to get user data from multiple sources
    const currentUser = this.authService.getCurrentUser();
    const userProfile = this.userService.getProfileData();
    const localStorageUser = JSON.parse(
      localStorage.getItem('user_data') || '{}'
    );

    // Set username from available sources
    this.userName = this.extractUserName(
      currentUser,
      userProfile,
      localStorageUser
    );
  }

  /**
   * Extract username from multiple data sources
   */
  private extractUserName(...userDataSources: any[]): string {
    for (const userData of userDataSources) {
      if (!userData) continue;

      const nameCandidates = [
        userData.fullName,
        userData.name,
        userData.username,
        userData.user?.fullName,
        userData.user?.name,
        userData.user?.username,
        userData.details?.user?.fullName,
        userData.details?.user?.name,
        `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      ];

      const validName = nameCandidates.find(
        (name) => name && typeof name === 'string' && name.trim().length > 0
      );

      if (validName) {
        return validName;
      }
    }
    return 'User'; // Fallback
  }

  /**
   * Fetch wallet details from API with proper parameters
   */
  private async fetchWalletDetails(): Promise<void> {
    try {
      this.loadingWallet = true;
      this.walletError = false;
      this.walletNotFound = false;

      const { walletId, uniqueId } = this.getUserIdentifiers();

      this.endpointService.fetchMyWallet(walletId, uniqueId).subscribe({
        next: (res: any) => {
          this.handleWalletResponse(res);
          this.loadingWallet = false;
        },
        error: (err: any) => {
          this.handleWalletError(err);
          this.loadingWallet = false;
        },
      });
    } catch (err) {
      console.error('Unexpected error in fetchWalletDetails:', err);
      this.loadingWallet = false;
      this.walletError = true;
    }
  }

  /**
   * Extract walletId and uniqueId from user data
   */
  private getUserIdentifiers(): {
    walletId: string | null;
    uniqueId: string | null;
  } {
    const currentUser = this.authService.getCurrentUser();
    const userProfile = this.userService.getProfileData();
    const localStorageUser = JSON.parse(
      localStorage.getItem('user_data') || '{}'
    );

    const userData = currentUser || userProfile || localStorageUser;

    // Extract walletId from various possible locations
    const walletId =
      userData?.walletId ||
      userData?.wallet?.id ||
      userData?.walletAccountNumber ||
      userData?.user?.walletId;

    // Extract uniqueId (scouterId or talentId) from various possible locations
    const uniqueId =
      userData?.uniqueId ||
      userData?.id ||
      userData?.userId ||
      userData?.scouterId ||
      userData?.talentId ||
      userData?.user?.uniqueId ||
      userData?.user?.id;

    console.log('User identifiers:', { walletId, uniqueId, userData });
    return { walletId, uniqueId };
  }

  /**
   * Handle successful wallet API response
   */
  private handleWalletResponse(res: any): void {
    // Check if wallet was not found (special case)
    if (res?.walletNotFound) {
      this.walletNotFound = true;
      console.log('Wallet profile not created yet');
      return;
    }

    if (res && res.data) {
      const walletData = res.data;

      // Extract and display wallet information from the payload
      console.log('🔍 Wallet Data Received:', walletData);

      // 1. Wallet Account Number (wallet_id)
      this.accountNumber = walletData.wallet_id || 'Not available';

      // 2. Wallet Name
      if (walletData.firstName || walletData.lastName) {
        this.userName = `${walletData.firstName || ''} ${walletData.middleName || ''} ${walletData.lastName || ''}`.trim();
      } else if (walletData.firstName) {
        this.userName = walletData.firstName;
      }

      // 3. Wallet Account Balance
      this.walletBalance = parseFloat(walletData.currentAcctBalance) || 0;

      // Additional debug logging
      console.log('💰 Wallet Info Extracted:', {
        accountNumber: this.accountNumber,
        userName: this.userName,
        walletBalance: this.walletBalance,
        fullName: walletData.firstName,
        middleName: walletData.middleName,
        lastName: walletData.lastName
      });

      // Update transaction totals if available
      if (walletData.totalDeposit !== undefined) {
        this.totalDeposit = Number(walletData.totalDeposit) || 0;
      }
      if (walletData.totalWithdrawal !== undefined) {
        this.totalWithdrawal = Number(walletData.totalWithdrawal) || 0;
      }
      if (walletData.totalTransfer !== undefined) {
        this.totalTransfer = Number(walletData.totalTransfer) || 0;
      }

      console.log('✅ Wallet data loaded successfully:', walletData);
    } else {
      console.warn('No wallet data found in response:', res);
      this.walletError = true;
    }
  }

  /**
   * Handle wallet API errors
   */
  private handleWalletError(err: any): void {
    console.error('Error fetching wallet details:', err);

    // Check if it's a "wallet not found" error
    if (err.status === 400 && err.error?.message === 'Wallet not found') {
      this.walletNotFound = true;
      this.walletError = false;
    } else {
      this.walletError = true;
      this.walletNotFound = false;
      this.showToast(
        'Unable to load wallet details. Please try again later.',
        'danger'
      );
    }
  }

  /**
   * Navigate to wallet profile creation
   */
  navigateToWalletProfile(): void {
    this.router.navigate(['/scouter/wallet-page/wallet-profile']);
  }

  /**
   * Show toast message
   */
  private async showToast(
    message: string,
    color: string = 'primary'
  ): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }

  // Existing methods remain the same...
  toggleBalance() {
    this.balanceHidden = !this.balanceHidden;
  }

  copyAccountNumber() {
    if (this.accountNumber && this.accountNumber !== 'Loading...') {
      this.clipboard.copy(this.accountNumber);
      this.copied = true;
      this.showToast('Account number copied!', 'success');

      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }
  }

  toggleFilter() {
    this.filterOpen = !this.filterOpen;

    if (this.filterOpen) {
      setTimeout(() => {
        const yOffset = this.dropdownSection.nativeElement.offsetTop;
        this.content.scrollToPoint(0, yOffset, 500);
      }, 50);
    }
  }

  selectFilter(year: string) {
    this.selectedFilter = year;
    this.filterOpen = false;

    const [deposits, withdrawals, transfers] = this.transactionData[year] || [
      [],
      [],
      [],
    ];
    this.monthlyBarChartData.datasets[0].data = deposits;
    this.monthlyBarChartData.datasets[1].data = withdrawals;
    this.monthlyBarChartData.datasets[2].data = transfers;

    this.monthlyBarChartData = { ...this.monthlyBarChartData };
  }

  /**
   * Refresh wallet data
   */
  refreshWalletData(event?: any): void {
    this.fetchWalletDetails().finally(() => {
      if (event) {
        event.target.complete();
      }
    });
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
