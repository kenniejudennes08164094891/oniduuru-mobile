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
import { ToastsService } from 'src/app/services/toasts.service';
import { ToggleVisibilitySharedStateService } from 'src/app/services/toggleVisibilitySharedState.service';

@Component({
  selector: 'app-wallet-page',
  templateUrl: './wallet-page.component.html',
  styleUrls: ['./wallet-page.component.scss'],
  standalone: false,
})
export class WalletPageComponent implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  @ViewChild('dropdownSection') dropdownSection!: ElementRef;
  @ViewChild('chartCanvas') chartCanvas!: any;

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

  // Histogram data
  histogramLoading = false;
  histogramData: any = null;
  selectedYear: string = '';
  selectedFilter: string = '';

  copied: boolean = false;
  filterOpen: boolean = false;
  years: string[] = [];

  loadingWallet = false;
  walletError = false;
  walletNotFound = false;

  constructor(
    private clipboard: Clipboard,
    private toast: ToastsService,
    private endpointService: EndpointService,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toggleVisibilityService: ToggleVisibilitySharedStateService
  ) { }

  async ngOnInit(): Promise<void> {
    // Initialize balance visibility state
    await this.initializeBalanceVisibility();
    
    // Continue with other initialization
    this.initializeUserData();
    this.generateYears();
    await this.fetchHistogramData();
  }

  async ngAfterViewInit(): Promise<void> {
    await this.fetchWalletDetails();
  }

  async toggleBalance(): Promise<void> {
    // Use the service to toggle and save
    this.balanceHidden = await this.toggleVisibilityService.toggleBalanceVisibility(this.balanceHidden);
    console.log('👁️ Balance visibility toggled to:', this.balanceHidden);
  }

  private async initializeBalanceVisibility(): Promise<void> {
    try {
      this.balanceHidden = await this.toggleVisibilityService.getBalanceVisibility();
      console.log('🔍 Initialized balance visibility:', this.balanceHidden);
    } catch (error) {
      console.error('Error initializing balance visibility:', error);
      this.balanceHidden = false; // Default value
    }
  }



  // ========== YEAR FILTER METHODS ==========
  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    const startYear = 2020; // Adjust based on your app's start year
    this.years = [];

    for (let year = currentYear; year >= startYear; year--) {
      this.years.push(year.toString());
    }

    this.selectedYear = currentYear.toString();
    this.selectedFilter = this.selectedYear;
  }

  selectFilter(year: string): void {
    console.log('🔍 Selecting year filter:', year);

    this.selectedFilter = year;
    this.selectedYear = year;
    this.filterOpen = false;
    this.histogramData = null;

    this.fetchHistogramData();

    setTimeout(() => {
      const yOffset = this.dropdownSection.nativeElement.offsetTop;
      this.content.scrollToPoint(0, yOffset + 100, 500);
    }, 300);
  }

  // ========== HISTOGRAM DATA METHODS ==========
  private fetchHistogramData(): void {
    this.histogramLoading = true;

    const { uniqueId } = this.getUserIdentifiers();

    if (!uniqueId) {
      console.error('❌ No uniqueId found for histogram data');
      this.histogramLoading = false;
      this.useFallbackHistogramData();
      return;
    }

    console.log('📊 Fetching histogram data for:', {
      uniqueId: uniqueId,
      year: this.selectedYear,
      currentYear: new Date().getFullYear()
    });

    this.endpointService.fetchMonthlyStats(uniqueId, this.selectedYear).subscribe({
      next: (res: any) => {
        console.log('✅ Histogram API Response Status:', res?.message || 'No message');
        console.log('✅ Histogram Data Structure:', {
          hasData: !!res?.data,
          hasLabels: !!res?.data?.labels,
          depositAmounts: res?.data?.fundDeposits?.amounts,
          withdrawalAmounts: res?.data?.fundWithdrawals?.amounts,
          transferAmounts: res?.data?.fundTransfers?.amounts
        });

        // Check if we actually got data
        if (res?.data?.fundDeposits?.amounts) {
          console.log('💰 Deposit amounts:', res.data.fundDeposits.amounts);
          console.log('💰 Withdrawal amounts:', res.data.fundWithdrawals.amounts);
          console.log('💰 Transfer amounts:', res.data.fundTransfers.amounts);

          // Check if any data is non-zero
          const hasData = res.data.fundDeposits.amounts.some((val: number) => val > 0) ||
            res.data.fundWithdrawals.amounts.some((val: number) => val > 0) ||
            res.data.fundTransfers.amounts.some((val: number) => val > 0);

          console.log('📈 Has non-zero data:', hasData);
        }

        this.handleHistogramResponse(res);
        this.histogramLoading = false;
      },
      error: (err: any) => {
        console.error('❌ Error fetching histogram data:', {
          status: err?.status,
          message: err?.message,
          error: err?.error
        });
        this.histogramLoading = false;
        this.useFallbackHistogramData();
      }
    });
  }

  private handleHistogramResponse(res: any): void {
    if (res && res.data) {
      this.histogramData = res.data;
      console.log('📦 Setting histogramData:', {
        labels: this.histogramData.labels,
        depositAmounts: this.histogramData.fundDeposits?.amounts,
        withdrawalAmounts: this.histogramData.fundWithdrawals?.amounts,
        transferAmounts: this.histogramData.fundTransfers?.amounts
      });
      this.updateChartWithHistogramData();
    } else {
      console.warn('⚠️ No histogram data found in response:', res);
      this.useFallbackHistogramData();
    }
  }

  private updateChartWithHistogramData(): void {
    if (!this.histogramData) {
      console.error('❌ No histogramData available for chart update');
      return;
    }

    console.log('📊 Updating chart with histogram data:', {
      labels: this.histogramData.labels,
      depositAmounts: this.histogramData.fundDeposits?.amounts,
      withdrawalAmounts: this.histogramData.fundWithdrawals?.amounts,
      transferAmounts: this.histogramData.fundTransfers?.amounts
    });

    // Ensure we have arrays
    const depositData = Array.isArray(this.histogramData.fundDeposits?.amounts)
      ? [...this.histogramData.fundDeposits.amounts]
      : [];

    const withdrawalData = Array.isArray(this.histogramData.fundWithdrawals?.amounts)
      ? [...this.histogramData.fundWithdrawals.amounts]
      : [];

    const transferData = Array.isArray(this.histogramData.fundTransfers?.amounts)
      ? [...this.histogramData.fundTransfers.amounts]
      : [];

    console.log('📈 Extracted data arrays:', {
      depositData,
      withdrawalData,
      transferData
    });

    // Create a completely new object to trigger change detection
    const newChartData: ChartData<'bar'> = {
      labels: this.histogramData.labels?.map((label: string) =>
        label.substring(0, 3)
      ) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Deposits',
          data: depositData,
          backgroundColor: '#0033FF',
          borderRadius: 6,
          barPercentage: 0.7,
        },
        {
          label: 'Withdrawals',
          data: withdrawalData,
          backgroundColor: '#434348',
          borderRadius: 6,
          barPercentage: 0.7,
        },
        {
          label: 'Transfers',
          data: transferData,
          backgroundColor: '#9CA3AF',
          borderRadius: 6,
          barPercentage: 0.7,
        }
      ]
    };

    // Assign to the component property
    this.monthlyBarChartData = newChartData;

    console.log('✅ Chart data updated. New chart data:', {
      labels: this.monthlyBarChartData.labels,
      datasets: this.monthlyBarChartData.datasets.map(d => ({
        label: d.label,
        data: d.data
      }))
    });

    // Force Angular to detect changes
    setTimeout(() => {
      this.refreshChart();
      // Also trigger change detection
      this.monthlyBarChartData = { ...this.monthlyBarChartData };
    }, 100);
  }

  private useFallbackHistogramData(): void {
    console.log('🔄 Using fallback data for year:', this.selectedYear);

    const yearData = this.transactionData[this.selectedYear];

    if (yearData) {
      this.monthlyBarChartData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Deposits',
            data: [...yearData[0]],
            backgroundColor: '#0033FF',
            borderRadius: 6,
          },
          {
            label: 'Withdrawals',
            data: [...yearData[1]],
            backgroundColor: '#434348',
            borderRadius: 6,
          },
          {
            label: 'Transfers',
            data: [...yearData[2]],
            backgroundColor: '#9CA3AF',
            borderRadius: 6,
          }
        ]
      };
    }

    setTimeout(() => this.refreshChart(), 100);
  }

  hasNoData(): boolean {
    if (!this.histogramData) return true;

    // Check if all amounts are zero or undefined
    const depositAmounts = this.histogramData.fundDeposits?.amounts || [];
    const withdrawalAmounts = this.histogramData.fundWithdrawals?.amounts || [];
    const transferAmounts = this.histogramData.fundTransfers?.amounts || [];

    const allDepositsZero = depositAmounts.every((val: number) => val === 0 || val === undefined);
    const allWithdrawalsZero = withdrawalAmounts.every((val: number) => val === 0 || val === undefined);
    const allTransfersZero = transferAmounts.every((val: number) => val === 0 || val === undefined);

    const hasNoData = allDepositsZero && allWithdrawalsZero && allTransfersZero;

    console.log('📊 Checking if has no data:', {
      depositAmounts,
      withdrawalAmounts,
      transferAmounts,
      allDepositsZero,
      allWithdrawalsZero,
      allTransfersZero,
      hasNoData
    });

    return hasNoData;
  }

  private refreshChart(): void {
    try {
      if (this.chartCanvas && this.chartCanvas.chart) {
        console.log('🔄 Refreshing chart...');
        this.chartCanvas.chart.update('none'); // Use 'none' for instant update
      } else {
        console.warn('⚠️ Chart canvas not found for refresh');
      }
    } catch (error) {
      console.error('❌ Error refreshing chart:', error);
    }
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
   *  refresh histogram
   */
  refreshWalletData(event?: any): void {
    this.fetchWalletDetails();
    this.fetchHistogramData(); // Refresh histogram data too
    if (event) {
      event.target.complete();
    }
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
    
      this.toast.openSnackBar('Unable to load wallet details. Please try again later.', 'error');

    }
  }

  /**
   * Navigate to wallet profile creation
   */
  navigateToWalletProfile(): void {
    this.router.navigate(['/scouter/wallet-page/wallet-profile']);
  }




  copyAccountNumber() {
    if (this.accountNumber && this.accountNumber !== 'Loading...') {
      this.clipboard.copy(this.accountNumber);
      this.copied = true;
      this.toast.openSnackBar('Account number copied!', 'success');
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

  // ========== CHART CONFIGURATION ==========
  monthlyBarChartData: ChartData<'bar'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Deposits',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#0033FF',
        borderRadius: 6,
      },
      {
        label: 'Withdrawals',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#434348',
        borderRadius: 6,
      },
      {
        label: 'Transfers',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#9CA3AF',
        borderRadius: 6,
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
          color: '#49536E',
          font: { size: 14 },
          padding: 20
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.raw as number;
            return `${label}: ₦${value.toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#49536E' },
        grid: {
          color: '#D9DCE5',
          drawBorder: false // This should be valid
        } as any, // Use type assertion to fix TypeScript error
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#49536E',
          callback: function (value: any) {
            if (typeof value === 'number') {
              return '₦' + Number(value).toLocaleString('en-NG', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              });
            }
            return value;
          }
        },
        grid: {
          color: '#D9DCE5',
          drawBorder: false
        } as any,
      },
    },
  };
}