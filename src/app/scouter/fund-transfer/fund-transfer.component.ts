import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';
import { TransferFundsPopupModalComponent } from 'src/app/utilities/modals/transfer-funds-popup-modal/transfer-funds-popup-modal.component';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.scss'],
  standalone: false,
})
export class FundTransferComponent implements OnInit, OnDestroy {
  images = imageIcons;

  // Current user data
  currentUser: any = null;
  userName: string = 'Viki West';

  // Years and months
  years: number[] = [];
  months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Selected filters
  selectedYear: number | null = null;
  selectedMonth: string | null = null;
  isYearDropdownOpen = false;
  isMonthDropdownOpen = false;

  // Active status filter
  activeStatusFilter: string | null = null;

  // Transfer data
  transfers: any[] = [];
  allTransfers: any[] = []; // Store all transfers for accurate counts
  isLoading: boolean = false;

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalTransfers = 0;

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
    private toast: ToastsService
  ) {
    // Initialize years (current year and 5 previous years)
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 6; i++) {
      this.years.push(currentYear - i);
    }
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadTransfers();
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
    return '0033392845'; // Default
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
   * Load transfers from API
   */
  loadTransfers() {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot load transfers');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = null;

    console.log('📥 Loading transfers for user ID:', uniqueId);

    const subscription = this.endpointService
      .fetchMyTransfers(
        uniqueId,
        '', // No status filter
        this.pageSize,
        this.currentPage,
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('📡 Transfers API Response:', response);
          this.processTransfersResponse(response, true);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error loading transfers:', error);

          // Check for specific error messages
          if (
            error.status === 400 &&
            error.error?.message?.includes('Wallet not found')
          ) {
            console.log('ℹ️ No wallet profile found for user');
            this.transfers = [];
            this.allTransfers = [];
            this.totalTransfers = 0;
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
   * Filter transfers by status
   */
  filterByStatus(status: string) {
    const uniqueId = this.getUserUniqueId();

    if (!uniqueId) {
      console.error('❌ No user ID found - cannot filter transfers');
      return;
    }

    this.isLoading = true;
    this.activeStatusFilter = status;
    const apiStatus = this.getApiStatus(status);

    console.log(`🔍 Filtering transfers for ${status} (${apiStatus}) for user:`, uniqueId);

    const subscription = this.endpointService
      .fetchMyTransfers(
        uniqueId,
        apiStatus,
        this.pageSize,
        1, // Reset to first page
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.processTransfersResponse(response, false);
          this.currentPage = 1;
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Error filtering transfers:', error);
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
    this.loadTransfers();
  }

  /**
   * Process API response
   */
  private processTransfersResponse(response: any, storeAsAllTransfers: boolean = false) {
    // Check response structure - adjust based on actual API response
    if (response?.Transfers || response?.data?.Transfers) {
      const transfersData = response.Transfers || response.data.Transfers || [];
      
      // Transform API data to match component structure
      const transformedTransfers = transfersData.map((item: any) => ({
        id: item.transferReferenceId || item.id || Date.now(),
        transferReferenceId: item.transferReferenceId || item.transactionId,
        amount: parseFloat(item.amount),
        walletId: item.designatedWalletAcct || item.designatedWalletId, // The wallet ID funds are sent to
        originatingWalletId: item.originatingWalletAcct || this.getWalletId(), // Source wallet ID
        walletName: item.designatedWalletName || item.recipientName || 'Unknown',
        status: this.mapStatus(item.status),
        date: new Date(item.createdAt || item.dateOfTransfer || new Date()),
        reason: item.reasonForTransfer || '',
        marketHireId: item.marketHireId || null
      }));

      // Set current view transfers
      this.transfers = transformedTransfers;

      // If this is the "all transfers" response, store a copy for accurate counts
      if (storeAsAllTransfers) {
        this.allTransfers = [...transformedTransfers];
      }

      // ALWAYS calculate counts from all transfers
      this.calculateCounts();

      // Update pagination info
      if (response.paginationParams) {
        this.totalTransfers = response.paginationParams.totals || this.transfers.length;
        this.totalPages = Math.ceil(this.totalTransfers / this.pageSize);
      } else {
        this.totalTransfers = this.allTransfers.length;
        this.totalPages = Math.ceil(this.totalTransfers / this.pageSize);
      }

      console.log('✅ Processed transfers:', {
        viewCount: this.transfers.length,
        allCount: this.allTransfers.length,
        total: this.totalTransfers,
        pages: this.totalPages,
        counts: {
          successful: this.successfulCount,
          pending: this.pendingCount,
          reversed: this.reversedCount,
          declined: this.declinedCount
        }
      });
    } else {
      console.warn('⚠️ No transfer data found in response:', response);
      this.transfers = [];
      this.allTransfers = [];
      this.totalTransfers = 0;
      this.totalPages = 1;
      this.resetCounts();
    }
  }

  /**
   * Map API status to display status
   */
  private mapStatus(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      successful: 'Successful',
      pending: 'Pending',
      declined: 'Declined',
      isReversed: 'Reversed',
      success: 'Successful',
      approved: 'Successful',
      failed: 'Declined'
    };
    return statusMap[apiStatus] || apiStatus || 'Pending';
  }

  /**
   * Get API status from display status
   */
  private getApiStatus(displayStatus: string): string {
    const reverseMap: { [key: string]: string } = {
      Successful: 'successful',
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
   * Calculate counts from all transfers
   */
  private calculateCounts() {
    this.resetCounts();

    // Use allTransfers for counts, fallback to transfers if allTransfers is empty
    const transfersForCounts = this.allTransfers.length > 0 ? this.allTransfers : this.transfers;

    transfersForCounts.forEach((t) => {
      const status = t.status?.toLowerCase();
      if (status === 'successful' || status === 'success') {
        this.successfulCount++;
      } else if (status === 'pending') {
        this.pendingCount++;
      } else if (status === 'reversed' || status === 'isreversed') {
        this.reversedCount++;
      } else if (status === 'declined' || status === 'failed') {
        this.declinedCount++;
      }
    });

    console.log('📊 Calculated counts from ALL transfers:', {
      successful: this.successfulCount,
      pending: this.pendingCount,
      reversed: this.reversedCount,
      declined: this.declinedCount,
      total: transfersForCounts.length,
    });
  }

  /**
   * Load mock data for fallback
   */
  private loadMockData() {
    this.allTransfers = [
      {
        id: 1,
        transferReferenceId: 'TRF-1700000001',
        amount: 50000,
        walletId: 'WLT-123456789',
        walletName: 'John Doe',
        originatingWalletId: '0033392845',
        status: 'Successful',
        date: new Date(2024, 2, 15, 10, 30),
        reason: 'Payment for services',
      },
      {
        id: 2,
        transferReferenceId: 'TRF-1700000002',
        amount: 25000,
        walletId: 'WLT-987654321',
        walletName: 'Jane Smith',
        originatingWalletId: '0033392845',
        status: 'Pending',
        date: new Date(2024, 2, 14, 14, 45),
        reason: 'Invoice payment',
      },
      {
        id: 3,
        transferReferenceId: 'TRF-1700000003',
        amount: 100000,
        walletId: 'WLT-555555555',
        walletName: 'Bob Johnson',
        originatingWalletId: '0033392845',
        status: 'Declined',
        date: new Date(2024, 2, 13, 9, 15),
        reason: 'Insufficient funds',
      },
      {
        id: 4,
        transferReferenceId: 'TRF-1700000004',
        amount: 75000,
        walletId: 'WLT-444444444',
        walletName: 'Alice Brown',
        originatingWalletId: '0033392845',
        status: 'Reversed',
        date: new Date(2024, 2, 12, 16, 20),
        reason: 'Duplicate transaction',
      },
      {
        id: 5,
        transferReferenceId: 'TRF-1700000005',
        amount: 30000,
        walletId: 'WLT-333333333',
        walletName: 'Charlie Wilson',
        originatingWalletId: '0033392845',
        status: 'Successful',
        date: new Date(2024, 2, 11, 11, 0),
        reason: 'Refund',
      },
    ];
    
    this.transfers = [...this.allTransfers];
    this.calculateCounts();
    this.totalTransfers = this.allTransfers.length;
    this.totalPages = Math.ceil(this.totalTransfers / this.pageSize);
  }

  /**
   * Get filtered transfers based on year and month
   */
  get filteredTransfer(): any[] {
    let filtered = this.transfers;

    // Apply local filters (year and month)
    if (this.selectedYear) {
      filtered = filtered.filter(
        (t) => new Date(t.date).getFullYear() === this.selectedYear,
      );
    }

    if (this.selectedMonth) {
      filtered = filtered.filter(
        (t) =>
          new Date(t.date).toLocaleString('en-US', { month: 'long' }) ===
          this.selectedMonth,
      );
    }

    return filtered;
  }

  /**
   * Get paginated transfers
   */
  get paginatedTransfer(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransfer.slice(start, start + this.pageSize);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      // Uncomment to load from API on page change
      // this.loadTransfers();
    }
  }

  /**
   * Navigate to transfer details
   */
  openTransfer(transfer: any): void {
    this.router.navigate(
      ['scouter/wallet-page/fund-transfer/fund-transfer-request', transfer.id],
      { state: { transfer } }
    );
  }

  /**
   * Open transfer funds popup modal
   */
  async openTransferFundsPopup() {
    const modal = await this.modalCtrl.create({
      component: TransferFundsPopupModalComponent,
      cssClass: 'fund-wallet-modal',
      componentProps: {
        currentUser: this.currentUser,
        userUniqueId: this.getUserUniqueId(),
        originatingWalletId: this.getWalletId(), // Your wallet ID (source)
        userRole: this.isScouter() ? 'SCOUTER' : 'TALENT',
      },
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        // Refresh the transfers list
        this.loadTransfers();
        this.currentPage = 1;
        this.toast.openSnackBar('Transfer initiated successfully', 'success');
      }
    });

    await modal.present();
  }

  /**
   * Get status color class for the status indicator
   */
  getStatusColorClass(status: string): string {
    switch(status?.toLowerCase()) {
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
    switch(status) {
      case 'Successful':
        return 'text-[#057A55]';
      case 'Pending':
        return 'text-[#FFA086]';
      case 'Reversed':
        return 'text-[#0033FF]';
      case 'Declined':
        return 'text-red-600';
      case 'All transfers':
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
    const baseClass = 'min-w-[120px] md:flex-1 flex flex-col items-center justify-center text-sm px-6 py-4 rounded-md transition-colors cursor-pointer';
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
    return this.allTransfers.length;
  }
}