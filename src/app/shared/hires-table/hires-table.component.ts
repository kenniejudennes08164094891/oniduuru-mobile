import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-hires-table',
  templateUrl: './hires-table.component.html',
  styleUrls: ['./hires-table.component.scss'],
})
export class HiresTableComponent implements OnInit, OnDestroy, OnChanges {
  @Input() hires: any[] = [];
  @Input() talentId: string = '';
  @Input() selectedScouterId: string = ''; // Add this input
  @Output() hireSelected = new EventEmitter<any>(); // Add this output

  marketExpenditures: any[] = [];
  currentMonth: string = '';
  currentTime: Date = new Date();
  private intervalId: any;

  images = imageIcons;

  // State
  activeCategoryBtn: string | null = null;
  activeCategoryTable: string | null = null;
  isFilterOpen = false;
  searchTerm = '';

  //   // Pagination
  currentPage = 1;
  itemsPerPage = 8;

  // Add these properties for pagination
  totalRecords: number = 0;
  hasMoreData: boolean = true;
  isLoadingMore: boolean = false;
  currentApiPage: number = 1;
  allApiHires: any[] = []; // Store ALL hires from API

  isFetchingMore: boolean = false;

  // API limit constraint
  readonly API_MAX_LIMIT = 10; // API only allows 0-10

  // Real data from API
  apiHires: any[] = [];
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private endpointService: EndpointService,
    private toast: ToastsService,
  ) {}

  ngOnInit() {
    // Set current month
    const monthNames = [
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
    const now = new Date();
    this.currentMonth = monthNames[now.getMonth()];

    // Start live clock
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Fetch ALL hires
    if (this.talentId) {
      this.loadAllHires();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['talentId'] && this.talentId) {
      this.fetchAllHiresData();
    }

    // If selectedScouterId changes, highlight or filter the table
    if (changes['selectedScouterId']) {
      this.highlightSelectedScouter();
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  selectHire(hire: any) {
    console.log('Hire selected from table:', hire);

    // Store the CORRECT formatted IDs
    const scouterId = hire.formattedScouterId || hire.scouterId;
    const talentId = hire.formattedTalentId || hire.talentId;

    // Update sessionStorage with formatted IDs
    if (scouterId) {
      sessionStorage.setItem('scouterId', scouterId);
      sessionStorage.setItem('scouterIdSimple', hire.scouterId); // Keep simple ID too
    }

    if (talentId) {
      sessionStorage.setItem('talentId', talentId);
      sessionStorage.setItem('talentIdSimple', hire.talentId); // Keep simple ID too
    }

    // Store selected scouter info
    const selectedScouter = {
      id: scouterId,
      simpleId: hire.scouterId,
      name: hire.scouterName || hire.name,
      email: hire.scouterEmail || hire.email,
      profilePic: hire.scouterPicture || hire.profilePic,
    };

    sessionStorage.setItem('selectedScouter', JSON.stringify(selectedScouter));

    // Set flags for different modal types
    const isAwaitingAcceptance =
      hire.status === 'Awaiting Acceptance' ||
      hire.offerStatus === 'Awaiting Acceptance' ||
      hire.hireStatus === 'Awaiting Acceptance' ||
      hire.status === 'awaiting-acceptance' ||
      hire.offerStatus === 'awaiting-acceptance' ||
      hire.hireStatus === 'awaiting-acceptance';

    const isAccepted =
      hire.status === 'Offers Accepted' ||
      hire.offerStatus === 'Offers Accepted' ||
      hire.hireStatus === 'Offers Accepted';

    const isRated =
      hire.isRated ||
      (hire.satisFactoryCommentByTalent &&
        hire.satisFactoryCommentByTalent !== '' &&
        hire.satisFactoryCommentByTalent !== 'null' &&
        hire.satisFactoryCommentByTalent !== 'undefined');

    hire.shouldShowAcceptRejectModal = isAwaitingAcceptance;
    hire.shouldShowEvaluationModal = isAccepted && !isRated;

    // Emit the selected hire to parent component
    this.hireSelected.emit(hire);
  }

  // Load ALL hires with pagination
  loadAllHires(page: number = 1) {
    if (page === 1) {
      this.isLoading = true;
      this.currentApiPage = 1;
      this.allApiHires = [];
    } else {
      this.isLoadingMore = true;
    }

    const paginationParams = {
      limit: 10, // API default limit
      pageNo: page,
    };

    // Get ALL hires - NO scouter filter
    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', '') // Empty scouterId for ALL hires
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          this.isLoadingMore = false;
          console.log(`ALL Hires API Response (page ${page}):`, res);

          try {
            const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
            console.log(`Decoded hires (page ${page}):`, decoded.length);

            // Transform API data
            const newHires = this.transformApiDataToHireFormat(decoded);

            // Append new hires to the complete list
            this.allApiHires = [...this.allApiHires, ...newHires];

            // Update the main apiHires array for display
            this.apiHires = this.allApiHires;

            // Check if we have more data
            this.hasMoreData = decoded.length >= 10;
            this.currentApiPage = page;

            // Store in localStorage
            localStorage.setItem(
              'allMarketRecords',
              JSON.stringify(this.allApiHires),
            );

            console.log(
              `Total ALL hires loaded: ${this.allApiHires.length}, Has more: ${this.hasMoreData}`,
            );

            // If we have a selected scouter, highlight their hires
            if (this.selectedScouterId) {
              this.highlightSelectedScouter();
            }
          } catch (error) {
            console.error('Error processing hires data:', error);
            this.apiHires = [];
            this.toast.openSnackBar('Error processing hire data', 'error');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          this.isLoadingMore = false;
          console.error('Error fetching hire data:', err);
          this.apiHires = [];
          this.toast.openSnackBar('Failed to load hire data', 'error');
        },
      });
  }

  // Load more data when user scrolls or clicks "Load More"
  loadMoreHires() {
    if (!this.hasMoreData || this.isLoadingMore) return;

    this.loadAllHires(this.currentApiPage + 1);
  }

  // Fetch initial hires data with proper pagination
  fetchInitialHiresData() {
    this.isLoading = true;

    const paginationParams = {
      limit: this.API_MAX_LIMIT, // Use API limit
      pageNo: 1,
    };

    // Get ALL hires (no scouter filter)
    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', '')
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('Initial Hires API Response:', res);

          try {
            const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
            console.log('Decoded initial hires:', decoded.length);

            // Transform API data
            this.apiHires = this.transformApiDataToHireFormat(decoded);

            // Check if we have more data
            this.hasMoreData = decoded.length >= this.API_MAX_LIMIT;

            // Store in localStorage
            localStorage.setItem(
              'allMarketRecords',
              JSON.stringify(this.apiHires),
            );

            // Update total records estimate
            this.totalRecords = this.apiHires.length;

            console.log(
              'Loaded initial hires:',
              this.apiHires.length,
              'Has more:',
              this.hasMoreData,
            );
          } catch (error) {
            console.error('Error processing initial hires data:', error);
            this.apiHires = [];
            this.toast.openSnackBar('Error processing hire data', 'error');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error fetching initial hire data:', err);
          this.apiHires = [];
          this.toast.openSnackBar('Failed to load hire data', 'error');
        },
      });
  }

  // Load more data when needed
  loadMoreData() {
    if (this.isFetchingMore || !this.hasMoreData) return;

    this.isFetchingMore = true;

    const nextPage = Math.floor(this.apiHires.length / this.API_MAX_LIMIT) + 1;
    const paginationParams = {
      limit: this.API_MAX_LIMIT,
      pageNo: nextPage,
    };

    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', '')
      .subscribe({
        next: (res: any) => {
          this.isFetchingMore = false;

          try {
            const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
            console.log(
              `Loaded more hires (page ${nextPage}):`,
              decoded.length,
            );

            if (decoded.length > 0) {
              // Transform and append new data
              const newHires = this.transformApiDataToHireFormat(decoded);
              this.apiHires = [...this.apiHires, ...newHires];

              // Check if we have more data
              this.hasMoreData = decoded.length >= this.API_MAX_LIMIT;

              // Update localStorage
              localStorage.setItem(
                'allMarketRecords',
                JSON.stringify(this.apiHires),
              );

              // Update total records
              this.totalRecords = this.apiHires.length;

              console.log(
                'Total hires now:',
                this.apiHires.length,
                'Has more:',
                this.hasMoreData,
              );
            } else {
              this.hasMoreData = false;
            }
          } catch (error) {
            console.error('Error processing more hires data:', error);
            this.hasMoreData = false;
          }
        },
        error: (err: any) => {
          this.isFetchingMore = false;
          console.error('Error loading more hires:', err);
          this.hasMoreData = false;
        },
      });
  }

  // Fetch ALL hires (not filtered by any specific scouter)
  fetchAllHiresData() {
    this.isLoading = true;

    // IMPORTANT: Don't pass scouterId to get ALL hires
    const paginationParams = {
      limit: 10, // Fetch enough records
      pageNo: 1,
    };

    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', '') // Empty scouterId
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('ALL Hires API Response:', res);

          try {
            const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
            console.log('Decoded ALL hires:', decoded.length);

            // Transform API data
            this.apiHires = this.transformApiDataToHireFormat(decoded);
            console.log('Transformed ALL hires:', this.apiHires.length);

            // Store in localStorage
            localStorage.setItem(
              'allMarketRecords',
              JSON.stringify(this.apiHires),
            );

            // Emit event if there's a selected scouter
            if (this.selectedScouterId) {
              this.highlightSelectedScouter();
            }
          } catch (error) {
            console.error('Error processing ALL hires data:', error);
            this.apiHires = [];
            this.toast.openSnackBar('Error processing hire data', 'error');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error fetching ALL hire data:', err);
          this.apiHires = [];
          this.toast.openSnackBar('Failed to load hire data', 'error');
        },
      });
  }

  // Highlight hires from selected scouter
  highlightSelectedScouter() {
    if (!this.selectedScouterId || this.apiHires.length === 0) return;

    console.log(`Highlighting hires from scouter: ${this.selectedScouterId}`);

    // You can add visual highlighting or filtering logic here
    const scouterHires = this.apiHires.filter(
      (h) => h.scouterId === this.selectedScouterId,
    );
    console.log(`Found ${scouterHires.length} hires from this scouter`);
  }

  // Update the navigation method to emit event
  // goToHireTransaction(hireId: string) {
  //   // Find the hire from ALL hires
  //   const hire =
  //     this.allApiHires.find((h) => h.id === hireId) ||
  //     this.filteredAndSearchedHires.find((h) => h.id === hireId);

  //   if (hire) {
  //     // Emit the selected hire to parent
  //     this.hireSelected.emit(hire);

  //     // Navigate to detail page
  //     this.router.navigate(['/talent/market-price-preposition', hireId], {
  //       state: {
  //         hire: hire,
  //         scouterId: hire.scouterId,
  //       },
  //     });
  //   }
  // }

  // Get hires for a specific scouter
  getScouterHires(scouterId: string): any[] {
    if (!scouterId || this.allApiHires.length === 0) return [];
    return this.allApiHires.filter((h) => h.scouterId === scouterId);
  }

  // Get all unique scouters from the hires
  getAllScouters(): any[] {
    const scoutersMap = new Map();

    this.allApiHires.forEach((hire) => {
      if (hire.scouterId && (hire.scouterName || hire.name)) {
        if (!scoutersMap.has(hire.scouterId)) {
          scoutersMap.set(hire.scouterId, {
            id: hire.scouterId,
            name: hire.scouterName || hire.name,
            email: hire.scouterEmail || hire.email,
            profilePic: hire.scouterPicture || hire.profilePic,
            hireCount: 1,
          });
        } else {
          const scouter = scoutersMap.get(hire.scouterId);
          scouter.hireCount += 1;
        }
      }
    });

    return Array.from(scoutersMap.values());
  }

  // Fetch real hire data from API
  fetchRealHireData() {
    this.isLoading = true;

    // Get scouterId if available from sessionStorage
    const scouterId = sessionStorage.getItem('scouterId') || '';

    const paginationParams = {
      limit: 10, // Fetch enough records for pagination
      pageNo: 1,
    };

    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', scouterId)
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('API Response for hires:', res);

          // Decode the base64 response
          try {
            const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
            console.log('Decoded hires:', decoded);

            // Transform API data to match table structure
            this.apiHires = this.transformApiDataToHireFormat(decoded);
            console.log('Transformed hires:', this.apiHires);

            // Store in localStorage for use in detail page
            localStorage.setItem(
              'marketRecords',
              JSON.stringify(this.apiHires),
            );
          } catch (error) {
            console.error('Error processing API data:', error);
            this.apiHires = [];
            this.toast.openSnackBar('Error processing hire data', 'error');
          }
        },
        error: (err: any) => {
          this.isLoading = false;
          console.error('Error fetching hire data:', err);
          this.apiHires = [];
          this.toast.openSnackBar('Failed to load hire data', 'error');
        },
      });
  }

  // Update the transformApiDataToHireFormat method in HiresTableComponent
  transformApiDataToHireFormat(apiData: any[]): any[] {
    return apiData.map((item) => {
      // Determine profile picture
      let profilePic = 'assets/images/portrait-man-cartoon-style.jpg'; // Default
      if (item.scouterPicture) {
        profilePic = item.scouterPicture;
      } else if (item.talentPicture) {
        profilePic = item.talentPicture;
      }

      // Determine name - prioritize scouter name, then talent name
      let name = item.scouterName || item.talentName || 'Unknown';
      if (item.firstName && item.lastName) {
        name = `${item.firstName} ${item.lastName}`;
      } else if (item.fullName) {
        name = item.fullName;
      }

      // Determine email
      let email =
        item.scouterEmail || item.talentEmail || item.email || 'No email';

      // Determine status - map from API status to display status
      let status = this.mapApiStatusToDisplayStatus(
        item.offerStatus || item.hireStatus || item.status,
      );

      // Determine amount
      let amount = 0;
      const amountValue = item.amount || item.amountToPay || 0;

      // Convert to number safely
      if (typeof amountValue === 'string') {
        const cleanString = amountValue.replace(/[^\d.-]/g, '');
        amount = parseFloat(cleanString) || 0;
      } else if (typeof amountValue === 'number') {
        amount = amountValue;
      }

      // Get the PROPER formatted IDs from the API response
      // The API expects IDs like: "talent/5831/29September2025"
      const talentId = item.talentId || item.talent_id || '';
      const scouterId = item.scouterId || item.scouter_id || '';

      // Check if IDs need formatting
      const formattedTalentId = this.formatIdForApi(talentId, 'talent');
      const formattedScouterId = this.formatIdForApi(scouterId, 'scouter');

      return {
        id: item.id || item.marketHireId || this.generateRandomId(),
        marketHireId: item.marketHireId || item.id,
        name: name,
        email: email,
        status: status,
        date:
          item.date ||
          item.dateOfHire ||
          item.createdAt ||
          new Date().toISOString(),
        startDate: item.startDate || 'Not set',
        amount: amount,
        amountToPay: String(amount),

        // Store BOTH simple and formatted IDs
        talentId: talentId, // Simple ID
        formattedTalentId: formattedTalentId, // Formatted ID for API
        scouterId: scouterId, // Simple ID
        formattedScouterId: formattedScouterId, // Formatted ID for API

        // Additional fields
        scouterName: item.scouterName,
        scouterEmail: item.scouterEmail,
        talentName: item.talentName,
        talentEmail: item.talentEmail,
        jobDescription: item.jobDescription || '',
        offerStatus: item.offerStatus,
        hireStatus: item.hireStatus,
        satisFactoryCommentByTalent: item.satisFactoryCommentByTalent,
        satisFactoryCommentByScouter: item.satisFactoryCommentByScouter,
        talentRating: item.talentRating,
        yourRating: item.yourRating,
        talentComment: item.talentComment,
        yourComment: item.yourComment,
        isRated: item.isRated,
        scouterPicture: item.scouterPicture,
        talentPicture: item.talentPicture,
        firstName: item.firstName,
        lastName: item.lastName,
        fullName: item.fullName,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  // Add this helper method to format IDs for API
  private formatIdForApi(id: string, type: 'talent' | 'scouter'): string {
    if (!id) return '';

    // If ID is already in the correct format, return it
    if (id.includes('/')) {
      return id;
    }

    // TODO: You need to get the date part from your user profile
    // For now, let's assume a default format
    // You should replace this with actual logic to get the date part
    const datePart = this.getDatePartFromProfile();

    return `${type}/${id}/${datePart}`;
  }

  // Add this method to extract date part from user profile
  private getDatePartFromProfile(): string {
    // Try to get from localStorage
    const profile =
      localStorage.getItem('talentProfile') ||
      localStorage.getItem('scouterProfile');
    if (profile) {
      try {
        const parsed = JSON.parse(profile);
        // Look for date fields in the profile
        if (parsed.createdAt) {
          const date = new Date(parsed.createdAt);
          const day = date.getDate();
          const month = date.toLocaleString('default', { month: 'long' });
          const year = date.getFullYear();
          return `${day}${month}${year}`;
        }
      } catch (error) {
        console.error('Error parsing profile:', error);
      }
    }

    // Default fallback
    return '29September2025'; // Replace with actual logic
  }

  // Map API status to display status
  mapApiStatusToDisplayStatus(apiStatus: string): string {
    if (!apiStatus) return 'Unknown';

    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Offers Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-rejected': 'Offers Declined',
      'offer-declined': 'Offers Declined',
      'Offers Accepted': 'Offers Accepted',
      'Awaiting Acceptance': 'Awaiting Acceptance',
      'Offers Declined': 'Offers Declined',
      'Offer Accepted': 'Offers Accepted',
      'Offer Rejected': 'Offers Declined',
    };

    return statusMap[apiStatus] || apiStatus;
  }

  // Base64 decode helper
  private base64JsonDecode<T = any>(b64?: string): T | null {
    try {
      if (!b64) return null;
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c: string) => c.charCodeAt(0));
      const jsonString = new TextDecoder().decode(bytes);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Error decoding base64 JSON:', error);
      return null;
    }
  }

  // Generate random ID for mock data
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  // Format date and time
  getFormattedDateTime(dateStr: string) {
    if (!dateStr) return { date: 'N/A', time: '' };

    try {
      const dateObj = new Date(dateStr);
      const optionsDate: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const formattedDate = dateObj.toLocaleDateString('en-US', optionsDate);
      const formattedTime = dateObj.toLocaleTimeString('en-US', optionsTime);

      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      console.error('Error formatting date:', error);
      return { date: 'Invalid date', time: '' };
    }
  }

  // Format live clock
  getFormattedLiveTime() {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  }

  // Format amount
  getFormattedAmount(amount: number | string): string {
    let numAmount = 0;

    if (typeof amount === 'string') {
      // Clean the string
      const cleanAmount = amount.replace(/[^\d.-]/g, '');
      numAmount = parseFloat(cleanAmount) || 0;
    } else if (typeof amount === 'number') {
      numAmount = amount;
    }

    // Format with Nigerian Naira formatting
    return `₦${numAmount.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'Offers Accepted':
        return '#189537'; // Green
      case 'Awaiting Acceptance':
        return '#FFA500'; // Orange
      case 'Offers Declined':
        return '#CC0000'; // Red
      default:
        return '#79797B'; // Gray
    }
  }

  // Categories and filters (using real data)
  categories = [
    { key: 'accepted', title: 'Offers Accepted' },
    { key: 'awaiting', title: 'Awaiting Acceptance' },
    { key: 'declined', title: 'Offers Declined' },
    { key: 'all', title: 'All Records' },
  ];

  filters = [
    { key: 'accepted', title: 'Offers Accepted', status: 'Offers Accepted' },
    {
      key: 'awaiting',
      title: 'Awaiting Acceptance',
      status: 'Awaiting Acceptance',
    },
    { key: 'declined', title: 'Offers Declined', status: 'Offers Declined' },
    { key: 'all', title: 'All Records', status: 'All' },
  ];

  // Map status to key
  mapStatusToKey(status: string): string {
    switch (status) {
      case 'Offers Accepted':
        return 'accepted';
      case 'Awaiting Acceptance':
        return 'awaiting';
      case 'Offers Declined':
        return 'declined';
      default:
        return 'all';
    }
  }

  // Get active category title
  getActiveCategoryTitle(): string {
    const cat = this.categories.find((c) => c.key === this.activeCategoryBtn);
    return cat ? cat.title : '';
  }

  // Get category count from API data
  getCategoryCount(key: string): number {
    const dataSource = this.apiHires.length > 0 ? this.apiHires : this.hires;

    if (key === 'all') return dataSource.length;
    return dataSource.filter((h) => this.mapStatusToKey(h.status) === key)
      .length;
  }

  // Filter and search logic
  get filteredAndSearchedHires() {
    // Use ALL API hires
    let source = this.allApiHires;

    // Fallback to input hires if no API data
    if (source.length === 0 && this.hires && this.hires.length > 0) {
      source = this.hires;
    }

    let list = [...source];

    // Apply filter dropdown
    if (this.activeCategoryTable && this.activeCategoryTable !== 'all') {
      list = list.filter(
        (h) => this.mapStatusToKey(h.status) === this.activeCategoryTable,
      );
    }

    // Apply search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(
        (h) =>
          (h.name && h.name.toLowerCase().includes(term)) ||
          (h.email && h.email.toLowerCase().includes(term)),
      );
    }

    return list;
  }

  // Add a method to check if we should show "Load More" button
  get shouldShowLoadMore(): boolean {
    return this.hasMoreData && !this.isLoading && !this.isLoadingMore;
  }

  // Add a method to manually trigger loading more
  onLoadMoreClick() {
    this.loadMoreData();
  }

  // Pagination
  get paginatedHires() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAndSearchedHires.slice(
      start,
      start + this.itemsPerPage,
    );
  }

  get totalPages() {
    return (
      Math.ceil(this.filteredAndSearchedHires.length / this.itemsPerPage) || 1
    );
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;

      // Check if we need to load more data
      const currentIndex = (this.currentPage - 1) * this.itemsPerPage;
      if (
        currentIndex + this.itemsPerPage > this.apiHires.length &&
        this.hasMoreData
      ) {
        this.loadMoreData();
      }
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // Set active category for table
  setActiveCategoryTable(key: string) {
    this.activeCategoryTable = key;
    this.currentPage = 1;
  }

  // Set active category for buttons
  setActiveCategoryBtn(key: string) {
    this.activeCategoryBtn = key;
  }

  // Get filter title
  getFilterTitle(key: string): string {
    const f = this.filters.find((x) => x.key === key);
    return f ? f.title : '';
  }

  // Get filter status
  getFilterStatus(key: string): string {
    const f = this.filters.find((x) => x.key === key);
    return f ? f.status : '';
  }
}
