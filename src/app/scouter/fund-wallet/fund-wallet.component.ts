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
  userName: string = 'Viki West'; // Default fallback

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

  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  totalDeposits = 0;

  // Status counts
  successfulCount = 0;
  invalidCount = 0;
  reversedCount = 0;
  failedCount = 0;

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
        if (this.currentUser?.fullName) {
          // Extract first name
          const nameParts = this.currentUser.fullName.split(' ');
          this.userName = nameParts[0] || 'Viki West';
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      // Fallback: try to get from auth service - use getCurrentUser() instead of getUser()
      const userFromAuth = this.authService.getCurrentUser();
      if (userFromAuth?.fullName) {
        this.currentUser = userFromAuth;
        const nameParts = userFromAuth.fullName.split(' ');
        this.userName = nameParts[0] || 'Viki West';
      }
    }
  }

  loadDeposits() {
    if (!this.currentUser?.scouterId) {
      console.error('No user ID found');
      return;
    }

    this.isLoading = true;

    const subscription = this.endpointService
      .fetchMyDeposits(
        this.currentUser.scouterId,
        '', // No status filter initially
        this.pageSize,
        this.currentPage,
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          console.log('📡 API Response:', response); // Debug log

          // Check response structure - it has "Deposits" array at root level
          if (response?.Deposits) {
            // Transform API data to match your component structure
            this.deposit = response.Deposits.map((item: any) => ({
              id: item.depositReferenceNumber || item.id,
              amount: parseFloat(item.amount), // Convert string to number
              walletName: item.designatedWalletName,
              walletAcctNo: item.designatedWalletAcct,
              identifier: item.identifier || 'Fund Self',
              status: this.mapStatus(item.status),
              date: new Date(item.createdAt || item.dateOfDeposit),
              reason: item.reasonForDeposit || '',
            }));

            // Calculate counts from data
            this.calculateCounts();

            // Update pagination info from response
            if (response.paginationParams) {
              this.totalDeposits =
                response.paginationParams.totals || this.deposit.length;
              this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
            } else {
              this.totalDeposits = this.deposit.length;
              this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
            }

            console.log('✅ Transformed deposits:', this.deposit);
            console.log('📊 Total deposits:', this.totalDeposits);
            console.log('📄 Total pages:', this.totalPages);
            console.log('✅ Success count:', this.successfulCount);
          } else {
            console.warn(
              'No deposit data found in response or unexpected structure:',
              response,
            );
            this.deposit = [];
            this.totalDeposits = 0;
            this.totalPages = 1;
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading deposits:', error);
          // Keep mock data for now if API fails
          this.loadMockData();
        },
      });

    this.subscriptions.add(subscription);
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

  private calculateCounts() {
    // Reset counts
    this.successfulCount = 0;
    this.invalidCount = 0;
    this.reversedCount = 0;
    this.failedCount = 0;

    this.deposit.forEach((d) => {
      const status = d.status?.toLowerCase();
      if (status === 'successful' || status === 'success') {
        this.successfulCount++;
      } else if (status === 'invalid') {
        this.invalidCount++;
      } else if (status === 'reversed' || status === 'isreversed') {
        this.reversedCount++;
      } else if (status === 'failed') {
        this.failedCount++;
      }
    });

    console.log('📊 Calculated counts:', {
      successful: this.successfulCount,
      invalid: this.invalidCount,
      reversed: this.reversedCount,
      failed: this.failedCount,
      total: this.deposit.length,
    });
  }

  private loadMockData() {
    // Your existing mock data as fallback
    this.deposit = [
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
      // ... other mock data
    ];
    this.calculateCounts();
    this.totalDeposits = this.deposit.length;
    this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
  }

  // Filter by status (when clicking status buttons)
  filterByStatus(status: string) {
    if (!this.currentUser?.scouterId) return;

    this.isLoading = true;
    const apiStatus = this.getApiStatus(status);

    const subscription = this.endpointService
      .fetchMyDeposits(
        this.currentUser.scouterId,
        apiStatus,
        this.pageSize,
        1, // Reset to first page
      )
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response?.Deposits) {
            this.deposit = response.Deposits.map((item: any) => ({
              id: item.depositReferenceNumber || item.id,
              amount: parseFloat(item.amount),
              walletName: item.designatedWalletName,
              walletAcctNo: item.designatedWalletAcct,
              identifier: item.identifier || 'Fund Self',
              status: this.mapStatus(item.status),
              date: new Date(item.createdAt || item.dateOfDeposit),
              reason: item.reasonForDeposit || '',
            }));
            this.currentPage = 1;

            // Update pagination info
            if (response.paginationParams) {
              this.totalDeposits =
                response.paginationParams.totals || this.deposit.length;
              this.totalPages = Math.ceil(this.totalDeposits / this.pageSize);
            }
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error filtering deposits:', error);
        },
      });

    this.subscriptions.add(subscription);
  }

  private getApiStatus(displayStatus: string): string {
    const reverseMap: { [key: string]: string } = {
      Successful: 'success',
      Invalid: 'invalid',
      Reversed: 'isReversed',
      Failed: 'failed',
      Pending: 'pending',
    };
    return reverseMap[displayStatus] || '';
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
      // If using API pagination, reload data here
      // this.loadDeposits();
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
      },
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        // Refresh the deposits list
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
    return this.deposit.length;
  }
}
