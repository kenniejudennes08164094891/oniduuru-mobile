import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { FundWalletPopupModalComponent } from 'src/app/utilities/modals/fund-wallet-popup-modal/fund-wallet-popup-modal.component';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-fund-wallet',
  templateUrl: './fund-wallet.component.html',
  styleUrls: ['./fund-wallet.component.scss'],
  standalone: false,
})
export class FundWalletComponent implements OnInit, OnDestroy {
  images = imageIcons;

  // Current user data
  currentUser: any = null;
  userName: string = 'User'; // Default fallback

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

  // Deposit data
  deposit: any[] = [];
  isLoading: boolean = false;

  // Track active status filter
  activeStatusFilter: string | null = null;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalDeposits = 0;

  // Status counts - ADD PENDING COUNT
  successfulCount = 0;
  pendingCount = 0;
  invalidCount = 0;
  reversedCount = 0;
  failedCount = 0;

  // Store all deposits unfiltered for counts
  allDeposits: any[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private endpointService: EndpointService,
    private authService: AuthService,
  ) {
    // Initialize years (current year and 5 previous years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadDeposits();
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

  loadDeposits() {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot load deposits');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = null; // Clear active filter when loading all

    const subscription = this.endpointService
      .fetchMyDeposits(
        uniqueId,
        '', // No status filter
        this.pageSize,
        this.currentPage,
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('📡 API Response:', response);
          this.processDepositsResponse(response, true); // true = store as all deposits
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error loading deposits:', error);

          if (
            error.status === 400 &&
            error.error?.message?.includes('Wallet not found')
          ) {
            console.log('ℹ️ No wallet profile found for user');
            this.deposit = [];
            this.allDeposits = [];
            this.totalDeposits = 0;
            this.totalPages = 1;
            this.resetCounts();
          } else {
            this.loadMockData();
          }
        },
      });

    this.subscriptions.add(subscription);
  }

  private processDepositsResponse(response: any, storeAsAllDeposits: boolean = false) {
    // Check response structure
    if (response?.Deposits) {
      // Transform API data
      const transformedDeposits = response.Deposits.map((item: any) => ({
        id: item.depositReferenceNumber || item.id,
        amount: parseFloat(item.amount),
        walletName: item.designatedWalletName,
        walletAcctNo: item.designatedWalletAcct,
        identifier: item.identifier || 'Fund Self',
        status: this.mapStatus(item.status),
        date: new Date(item.createdAt || item.dateOfDeposit),
        reason: item.reasonForDeposit || '',
      }));

      // Set the current view deposits
      this.deposit = transformedDeposits;

      // If this is the "all deposits" response, store a copy for accurate counts
      if (storeAsAllDeposits) {
        this.allDeposits = [...transformedDeposits];
      }

      // ALWAYS calculate counts from all deposits, not filtered view
      this.calculateCounts();

      // Update pagination info
      if (response.paginationParams) {
        this.totalDeposits = response.paginationParams.totals || this.deposit.length;
        this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
      } else {
        this.totalDeposits = this.deposit.length;
        this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
      }

      console.log('✅ Processed deposits:', {
        viewCount: this.deposit.length,
        allCount: this.allDeposits.length,
        total: this.totalDeposits,
        pages: this.totalPages,
        counts: {
          successful: this.successfulCount,
          pending: this.pendingCount,
          invalid: this.invalidCount,
          reversed: this.reversedCount,
          failed: this.failedCount
        }
      });
    } else {
      console.warn('⚠️ No deposit data found in response:', response);
      this.deposit = [];
      this.allDeposits = [];
      this.totalDeposits = 0;
      this.totalPages = 1;
      this.resetCounts();
    }
  }

  private mapStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      success: 'Successful',
      pending: 'Pending',
      invalid: 'Invalid',
      isReversed: 'Reversed',
      failed: 'Failed',
    };
    return statusMap[apiStatus] || apiStatus;
  }

  private resetCounts() {
    this.successfulCount = 0;
    this.pendingCount = 0;
    this.invalidCount = 0;
    this.reversedCount = 0;
    this.failedCount = 0;
  }

  private calculateCounts() {
    // Reset all counts
    this.resetCounts();

    // Use allDeposits for counts, fallback to deposit if allDeposits is empty
    const depositsForCounts = this.allDeposits.length > 0 ? this.allDeposits : this.deposit;

    depositsForCounts.forEach((d) => {
      const status = d.status?.toLowerCase();
      if (status === 'successful' || status === 'success') {
        this.successfulCount++;
      } else if (status === 'pending') {
        this.pendingCount++;
      } else if (status === 'invalid') {
        this.invalidCount++;
      } else if (status === 'reversed' || status === 'isreversed') {
        this.reversedCount++;
      } else if (status === 'failed') {
        this.failedCount++;
      }
    });

    console.log('📊 Calculated counts from ALL deposits:', {
      successful: this.successfulCount,
      pending: this.pendingCount,
      invalid: this.invalidCount,
      reversed: this.reversedCount,
      failed: this.failedCount,
      total: depositsForCounts.length,
    });
  }

  private loadMockData() {
    // Mock data with all statuses including Pending
    this.allDeposits = [
      {
        id: 1,
        amount: 653655,
        walletName: 'Omoseyin Kehinde Jude',
        walletAcctNo: '1234211234',
        identifier: 'Fund Others',
        status: 'Successful',
        date: new Date(2016, 4, 24, 10, 57),
        reason: 'Payment for services',
      },
      {
        id: 2,
        amount: 25000,
        walletName: 'John Doe',
        walletAcctNo: '9876543210',
        identifier: 'Fund Self',
        status: 'Pending',
        date: new Date(2024, 1, 15, 14, 30),
        reason: 'Wallet funding',
      },
      {
        id: 3,
        amount: 50000,
        walletName: 'Jane Smith',
        walletAcctNo: '5555555555',
        identifier: 'Fund Others',
        status: 'Invalid',
        date: new Date(2024, 1, 10, 9, 15),
        reason: 'Invalid transaction',
      },
      {
        id: 4,
        amount: 100000,
        walletName: 'Bob Johnson',
        walletAcctNo: '4444444444',
        identifier: 'Fund Self',
        status: 'Reversed',
        date: new Date(2024, 0, 5, 16, 45),
        reason: 'Reversed transaction',
      },
      {
        id: 5,
        amount: 75000,
        walletName: 'Alice Brown',
        walletAcctNo: '3333333333',
        identifier: 'Fund Others',
        status: 'Failed',
        date: new Date(2023, 11, 20, 11, 0),
        reason: 'Failed transaction',
      },
    ];

    this.deposit = [...this.allDeposits];
    this.calculateCounts();
    this.totalDeposits = this.allDeposits.length;
    this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
  }

  // Filter by status (when clicking status buttons)
  filterByStatus(status: string) {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot filter deposits');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = status;
    const apiStatus = this.getApiStatus(status);

    console.log(`🔍 Filtering deposits for ${status} (${apiStatus}) for user:`, uniqueId);

    const subscription = this.endpointService
      .fetchMyDeposits(
        uniqueId,
        apiStatus,
        this.pageSize,
        1, // Reset to first page
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // When filtering, store as view only, NOT as all deposits
          this.processDepositsResponse(response, false);
          this.currentPage = 1;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error filtering deposits:', error);
        },
      });

    this.subscriptions.add(subscription);
  }

  // Clear all filters and show all deposits
  clearFilters() {
    this.activeStatusFilter = null;
    this.selectedYear = null;
    this.selectedMonth = null;
    this.loadDeposits();
  }

  private getApiStatus(displayStatus: string): string {
    const reverseMap: { [key: string]: string } = {
      Successful: 'success',
      Pending: 'pending',
      Invalid: 'invalid',
      Reversed: 'isReversed',
      Failed: 'failed',
    };
    return reverseMap[displayStatus] || '';
  }

  // Get status color class for the status indicator
  getStatusColorClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'successful':
        return 'bg-[#057A55]';
      case 'pending':
        return 'bg-[#F59E0B]'; // Amber color for pending
      case 'invalid':
        return 'bg-[#EB0B00]';
      case 'failed':
        return 'bg-[#EB0B00]';
      case 'reversed':
        return 'bg-[#0033FF]';
      default:
        return 'bg-gray-400';
    }
  }

  // Get text color class for status buttons
  getStatusButtonColorClass(status: string): string {
    switch(status) {
      case 'Successful':
        return 'text-[#057A55]';
      case 'Pending':
        return 'text-[#F59E0B]';
      case 'Invalid':
        return 'text-[#EB0B00]';
      case 'Failed':
        return 'text-[#EB0B00]';
      case 'Reversed':
        return 'text-[#0033FF]';
      case 'Fetched all':
        return 'text-gray-500';
      default:
        return 'text-gray-500';
    }
  }

  // Check if a status button is active
  isStatusActive(status: string): boolean {
    return this.activeStatusFilter === status;
  }

  // Apply active class to buttons
  getStatusButtonClass(status: string): string {
    const baseClass = 'min-w-[120px] md:flex-1 flex flex-col items-center justify-center text-sm px-6 py-4 rounded-md transition-colors cursor-pointer';
    const activeClass = 'ring-2 ring-offset-2 ring-indigo-500 bg-gray-100';
    const inactiveClass = 'bg-[#E5E7EB] hover:bg-gray-200';

    return `${baseClass} ${this.getStatusButtonColorClass(status)} ${this.isStatusActive(status) ? activeClass : inactiveClass}`;
  }

  // Update template to make status counts clickable
  get filteredDeposit(): any[] {
    let filtered = this.deposit;

    // Apply local filters (year and month)
    if (this.selectedYear) {
      filtered = filtered.filter(
        (d) => new Date(d.date).getFullYear() === this.selectedYear,
      );
    }

    if (this.selectedMonth) {
      filtered = filtered.filter(
        (d) =>
          new Date(d.date).toLocaleString('en-US', { month: 'long' }) ===
          this.selectedMonth,
      );
    }

    return filtered;
  }

  get paginatedDeposit(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDeposit.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  async goToRequest(deposit: any): Promise<void> {
    await this.router.navigate(
      ['/scouter/wallet-page/fund-wallet/fund-wallet-request', deposit.id],
      { state: { deposit } },
    );
  }

  async openFundWalletPopup() {
    const modal = await this.modalCtrl.create({
      component: FundWalletPopupModalComponent,
      cssClass: 'fund-wallet-modal',
      componentProps: {
        currentUser: this.currentUser,
        userUniqueId: this.getUserUniqueId(),
        userRole: this.currentUser?.scouterId ? 'SCOUTER' : 'TALENT',
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        this.loadDeposits();
      }
    });

    await modal.present();
  }

  // Existing helper methods
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

  get totalCount(): number {
    return this.allDeposits.length;
  }
}
