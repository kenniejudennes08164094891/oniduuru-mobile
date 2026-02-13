import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';
import { WithdrawFundsPopupModalComponent } from 'src/app/utilities/modals/withdraw-funds-popup-modal/withdraw-funds-popup-modal.component';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-withdraw-fund',
  templateUrl: './withdraw-fund.component.html',
  styleUrls: ['./withdraw-fund.component.scss'],
  standalone: false,
})
export class WithdrawFundComponent implements OnInit, OnDestroy {
  images = imageIcons;

  // Current user data
  currentUser: any = null;
  userName: string = 'Viki West';

  // Years and months
  years: number[] = [];
  months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Selected filters
  selectedYear: number | null = null;
  selectedMonth: string | null = null;
  isYearDropdownOpen = false;
  isMonthDropdownOpen = false;

  // Active status filter
  activeStatusFilter: string | null = null;

  // Withdrawal data
  withdrawals: any[] = [];
  allWithdrawals: any[] = []; // Store all withdrawals for accurate counts
  isLoading: boolean = false;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalWithdrawals = 0;

  // Status counts
  successfulCount = 0;
  pendingCount = 0;
  reversedCount = 0;
  declinedCount = 0;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private endpointService: EndpointService,
    private authService: AuthService,
    private toastService: ToastsService,

  ) {
    // Initialize years (current year and 5 previous years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadWithdrawals();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadCurrentUser() {
    // Try to get user from localStorage
    const userData =
      localStorage.getItem('user_data') ||
      localStorage.getItem('user_profile_data');

    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);

        // Set user name
        if (this.currentUser?.fullName) {
          const nameParts = this.currentUser.fullName.split(' ');
          this.userName = nameParts[0] || 'Viki West';
        }

        console.log('👤 Current user data:', {
          scouterId: this.currentUser?.scouterId,
          talentId: this.currentUser?.talentId,
          uniqueId: this.currentUser?.uniqueId,
          wallet_id: this.currentUser?.wallet_id,
          fullName: this.currentUser?.fullName,
          role: this.currentUser?.role,
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      // Fallback: try to get from auth service
      const userFromAuth = this.authService.getCurrentUser();
      if (userFromAuth) {
        this.currentUser = userFromAuth;
        if (userFromAuth?.fullName) {
          const nameParts = userFromAuth.fullName.split(' ');
          this.userName = nameParts[0] || 'User';
        }
      }
    }
  }

  /**
   * Get the appropriate unique identifier based on user role
   */
  getUserUniqueId(): string | null {
    if (!this.currentUser) {
      return null;
    }

    if (this.currentUser.scouterId) {
      return this.currentUser.scouterId;
    }

    if (this.currentUser.talentId) {
      return this.currentUser.talentId;
    }

    if (this.currentUser.uniqueId) {
      return this.currentUser.uniqueId;
    }

    console.error('❌ No valid user ID found in user object');
    return null;
  }

  /**
   * Get wallet ID from user data
   */
  getWalletId(): string | null {
    if (this.currentUser?.wallet_id) {
      return this.currentUser.wallet_id;
    }
    // Fallback - you might want to fetch wallet ID from API
    return '0033392845'; // Default from your modal
  }

  /**
   * Check if current user is a Scouter
   */
  isScouter(): boolean {
    return !!this.currentUser?.scouterId;
  }

  /**
   * Check if current user is a Talent
   */
  isTalent(): boolean {
    return !!this.currentUser?.talentId;
  }

  /**
   * Load withdrawals from API
   */
  loadWithdrawals() {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot load withdrawals');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = null;

    console.log('📥 Loading withdrawals for user ID:', uniqueId);

    const subscription = this.endpointService
      .fetchMyWithdrawals(
        uniqueId,
        '', // No status filter
        this.pageSize,
        this.currentPage,
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('📡 Withdrawals API Response:', response);
          this.processWithdrawalsResponse(response, true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error loading withdrawals:', error);

          // Check for specific error messages
          if (
            error.status === 400 &&
            error.error?.message?.includes('Wallet not found')
          ) {
            console.log('ℹ️ No wallet profile found for user');
            this.withdrawals = [];
            this.allWithdrawals = [];
            this.totalWithdrawals = 0;
            this.totalPages = 1;
            this.resetCounts();
          } else {
            // Load mock data as fallback
            this.loadMockData();
          }
        },
      });

    this.subscriptions.add(subscription);
  }

  /**
   * Filter withdrawals by status
   */
  filterByStatus(status: string) {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot filter withdrawals');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = status;
    const apiStatus = this.getApiStatus(status);

    console.log(
      `🔍 Filtering withdrawals for ${status} (${apiStatus}) for user:`,
      uniqueId,
    );

    const subscription = this.endpointService
      .fetchMyWithdrawals(
        uniqueId,
        apiStatus,
        this.pageSize,
        1, // Reset to first page
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.processWithdrawalsResponse(response, false);
          this.currentPage = 1;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error filtering withdrawals:', error);
        },
      });

    this.subscriptions.add(subscription);
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.activeStatusFilter = null;
    this.selectedYear = null;
    this.selectedMonth = null;
    this.currentPage = 1;
    this.loadWithdrawals();
  }

  /**
   * Process API response
   */
  private processWithdrawalsResponse(
    response: any,
    storeAsAllWithdrawals: boolean = false,
  ) {
    // Check response structure - adjust based on actual API response
    if (response?.Withdrawals || response?.data?.Withdrawals) {
      const withdrawalsData =
        response.Withdrawals || response.data.Withdrawals || [];

      // Transform API data to match component structure
      const transformedWithdrawals = withdrawalsData.map((item: any) => ({
        id: item.withdrawalReferenceNumber || item.id || Date.now(),
        transactionId: item.withdrawalReferenceNumber || item.transactionId,
        amount: parseFloat(item.amount),
        bank: item.designatedNubanBank || item.bankName || 'Unknown Bank',
        nubamAccNo: item.designatedNubanAcctNo || item.accountNumber,
        walletId: item.wallet_id || this.getWalletId(),
        status: this.mapStatus(item.status),
        date: new Date(item.createdAt || item.dateOfWithdrawal || new Date()),
        reason: item.reasonForWithdrawal || '',
        receiptUrl: item.receiptUrl || null,
        walletName: item.walletName || 'Current User',
        identifier: 'Withdraw',
      }));

      // Set current view withdrawals
      this.withdrawals = transformedWithdrawals;

      // If this is the "all withdrawals" response, store a copy for accurate counts
      if (storeAsAllWithdrawals) {
        this.allWithdrawals = [...transformedWithdrawals];
      }

      // ALWAYS calculate counts from all withdrawals
      this.calculateCounts();

      // Update pagination info
      if (response.paginationParams) {
        this.totalWithdrawals =
          response.paginationParams.totals || this.withdrawals.length;
        this.totalPages = Math.ceil(this.totalWithdrawals / this.pageSize);
      } else {
        this.totalWithdrawals = this.allWithdrawals.length;
        this.totalPages = Math.ceil(this.totalWithdrawals / this.pageSize);
      }

      console.log('✅ Processed withdrawals:', {
        viewCount: this.withdrawals.length,
        allCount: this.allWithdrawals.length,
        total: this.totalWithdrawals,
        pages: this.totalPages,
        counts: {
          successful: this.successfulCount,
          pending: this.pendingCount,
          reversed: this.reversedCount,
          declined: this.declinedCount,
        },
      });
    } else {
      console.warn('⚠️ No withdrawal data found in response:', response);
      this.withdrawals = [];
      this.allWithdrawals = [];
      this.totalWithdrawals = 0;
      this.totalPages = 1;
      this.resetCounts();
    }
  }

  /**
   * Map API status to display status
   */
  private mapStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      approved: 'Successful',
      pending: 'Pending',
      declined: 'Declined',
      isReversed: 'Reversed',
      success: 'Successful',
      successful: 'Successful',
    };
    return statusMap[apiStatus] || apiStatus || 'Pending';
  }

  /**
   * Get API status from display status
   */
  private getApiStatus(displayStatus: string): string {
    const reverseMap: { [key: string]: string } = {
      Successful: 'approved',
      Pending: 'pending',
      Reversed: 'isReversed',
      Declined: 'declined',
    };
    return reverseMap[displayStatus] || '';
  }

  /**
   * Reset all status counts
   */
  private resetCounts() {
    this.successfulCount = 0;
    this.pendingCount = 0;
    this.reversedCount = 0;
    this.declinedCount = 0;
  }

  /**
   * Calculate counts from all withdrawals
   */
  private calculateCounts() {
    this.resetCounts();

    // Use allWithdrawals for counts, fallback to withdrawals if allWithdrawals is empty
    const withdrawalsForCounts =
      this.allWithdrawals.length > 0 ? this.allWithdrawals : this.withdrawals;

    withdrawalsForCounts.forEach((w) => {
      const status = w.status?.toLowerCase();
      if (
        status === 'successful' ||
        status === 'success' ||
        status === 'approved'
      ) {
        this.successfulCount++;
      } else if (status === 'pending') {
        this.pendingCount++;
      } else if (status === 'reversed' || status === 'isreversed') {
        this.reversedCount++;
      } else if (status === 'declined' || status === 'failed') {
        this.declinedCount++;
      }
    });

    console.log('📊 Calculated counts from ALL withdrawals:', {
      successful: this.successfulCount,
      pending: this.pendingCount,
      reversed: this.reversedCount,
      declined: this.declinedCount,
      total: withdrawalsForCounts.length,
    });
  }

  /**
   * Load mock data for fallback
   */
  private loadMockData() {
    this.allWithdrawals = [
      {
        id: 1,
        transactionId: 'WD-1700000001',
        amount: 50000,
        bank: 'Access Bank',
        nubamAccNo: '0123456789',
        walletId: '0033392845',
        status: 'Successful',
        date: new Date(2024, 2, 15, 10, 30),
        reason: 'Personal withdrawal',
      },
      {
        id: 2,
        transactionId: 'WD-1700000002',
        amount: 25000,
        bank: 'GTBank',
        nubamAccNo: '0123456790',
        walletId: '0033392845',
        status: 'Pending',
        date: new Date(2024, 2, 14, 14, 45),
        reason: 'Business expenses',
      },
      {
        id: 3,
        transactionId: 'WD-1700000003',
        amount: 100000,
        bank: 'UBA',
        nubamAccNo: '0123456791',
        walletId: '0033392845',
        status: 'Declined',
        date: new Date(2024, 2, 13, 9, 15),
        reason: 'Insufficient funds',
      },
      {
        id: 4,
        transactionId: 'WD-1700000004',
        amount: 75000,
        bank: 'First Bank',
        nubamAccNo: '0123456792',
        walletId: '0033392845',
        status: 'Reversed',
        date: new Date(2024, 2, 12, 16, 20),
        reason: 'Duplicate transaction',
      },
      {
        id: 5,
        transactionId: 'WD-1700000005',
        amount: 30000,
        bank: 'Zenith Bank',
        nubamAccNo: '0123456793',
        walletId: '0033392845',
        status: 'Successful',
        date: new Date(2024, 2, 11, 11, 0),
        reason: 'Savings withdrawal',
      },
    ];

    this.withdrawals = [...this.allWithdrawals];
    this.calculateCounts();
    this.totalWithdrawals = this.allWithdrawals.length;
    this.totalPages = Math.ceil(this.totalWithdrawals / this.pageSize);
  }

  /**
   * Get filtered withdrawals based on year and month
   */
  get filteredWithdrawal(): any[] {
    let filtered = this.withdrawals;

    // Apply local filters (year and month)
    if (this.selectedYear) {
      filtered = filtered.filter(
        (w) => new Date(w.date).getFullYear() === this.selectedYear,
      );
    }

    if (this.selectedMonth) {
      filtered = filtered.filter(
        (w) =>
          new Date(w.date).toLocaleString('en-US', { month: 'long' }) ===
          this.selectedMonth,
      );
    }

    return filtered;
  }

  /**
   * Get paginated withdrawals
   */
  get paginatedWithdrawal(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredWithdrawal.slice(start, start + this.pageSize);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Uncomment to load from API on page change
      // this.loadWithdrawals();
    }
  }

  /**
   * Navigate to withdrawal details
   */
  async goToRequest(withdrawal: any): Promise<void> {
    await this.router.navigate(
      [
        'scouter/wallet-page/withdraw-funds/withdraw-funds-request',
        withdrawal.id,
      ],
      { state: { withdrawal } },
    );
  }

  /**
   * Open withdraw funds popup modal
   */
  async openWithdrawFundsPopup() {
    const modal = await this.modalCtrl.create({
      component: WithdrawFundsPopupModalComponent,
      cssClass: 'fund-wallet-modal',
      componentProps: {
        currentUser: this.currentUser,
        userUniqueId: this.getUserUniqueId(), // ✅ Pass the unique ID
        walletId: this.getWalletId(), // ✅ Pass the wallet ID
        userRole: this.isScouter() ? 'SCOUTER' : 'TALENT', // ✅ Pass the role
      },
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        // Refresh the withdrawals list
        this.loadWithdrawals();
        this.currentPage = 1;

        // Show success toast
        this.toastService.openSnackBar('Withdrawal initiated successfully', 'success');
      }
    });

    await modal.present();
  }

  /**
   * Get status color class for the status indicator
   */
  getStatusColorClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'successful':
        return 'bg-[#057A55]';
      case 'pending':
        return 'bg-[#FFA086]';
      case 'reversed':
        return 'bg-[#0033FF]';
      case 'declined':
        return 'bg-red-600';
      default:
        return 'bg-gray-400';
    }
  }

  /**
   * Get text color class for status buttons
   */
  getStatusButtonColorClass(status: string): string {
    switch (status) {
      case 'Successful':
        return 'text-[#057A55]';
      case 'Pending':
        return 'text-[#FFA086]';
      case 'Reversed':
        return 'text-[#0033FF]';
      case 'Declined':
        return 'text-red-600';
      case 'All deposits':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  }

  /**
   * Check if a status button is active
   */
  isStatusActive(status: string): boolean {
    return this.activeStatusFilter === status;
  }

  /**
   * Get status button class
   */
  getStatusButtonClass(status: string): string {
    const baseClass =
      'min-w-[120px] md:flex-1 flex flex-col items-center justify-center text-sm px-6 py-4 rounded-md transition-colors cursor-pointer';
    const activeClass = 'ring-2 ring-offset-2 ring-indigo-500 bg-gray-100';
    const inactiveClass = 'bg-[#E5E7EB] hover:bg-gray-200';

    return `${baseClass} ${this.getStatusButtonColorClass(status)} ${this.isStatusActive(status) ? activeClass : inactiveClass}`;
  }

  // Dropdown toggle methods
  toggleYearDropdown() {
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isMonthDropdownOpen = false;
  }

  toggleMonthDropdown() {
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
    this.isYearDropdownOpen = false;
  }

  selectYear(year: number) {
    this.selectedYear = year;
    this.isYearDropdownOpen = false;
    this.currentPage = 1;
  }

  selectMonth(month: string) {
    this.selectedMonth = month;
    this.isMonthDropdownOpen = false;
    this.currentPage = 1;
  }

  // Count getters
  get totalCount(): number {
    return this.allWithdrawals.length;
  }
}
