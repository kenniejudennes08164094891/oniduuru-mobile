import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { EndpointService } from 'src/app/services/endpoint.service';
import { PaginationParams, marketHires } from 'src/app/models/mocks';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController, ToastController } from '@ionic/angular';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-view-hires',
  templateUrl: './view-hires.page.html',
  styleUrls: ['./view-hires.page.scss'],
})
export class ViewHiresPage implements OnInit, OnDestroy {
  marketRecords: any[] = [];
  marketExpenditures: any[] = [];
  currentMonth: string = '';
  currentTime: Date = new Date();
  talentId =
    localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
  userName: string = 'User';
  private intervalId: any;

  images = imageIcons;

  slideshowTexts: string[] = [];
  noExpenditureSlideshowTexts: string[] = [];

  // Loading states
  isLoading: boolean = false;
  totalRecords: number = 0;

  showSpinner: boolean = true;
  loading = '';

  // Filter options
  statusFilter: string = '';
  scouterFilter: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;

  // Search term
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Add this at the top of your component class
  Math = Math;

  // Categories and filters
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

  // State
  activeCategoryBtn: string | null = null;
  activeCategoryTable: string | null = null;
  isFilterOpen = false;

  // Add missing properties
  initialPaginatedHires: any[] = [];
  paginatedHiresData: any[] = [];

  constructor(
    private router: Router,
    private endpointService: EndpointService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.showSpinner = true;
    this.loading = 'Fetching your Hires...';
    this.loadTalentName();
    this.setupSearchDebounce();

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

    // Initialize no-expenditure slideshow texts
    this.updateNoExpenditureSlideshowText();

    // Start live clock
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Load initial data
    this.loadMarketRecords();

    // Final fallback: call API directly
    if (!this.talentId) {
      setTimeout(() => (this.showSpinner = false), 2000);
      return;
    }

    const paginationParams: PaginationParams = { limit: 10, pageNo: 1 };
    this.endpointService
      .fetchMarketsByTalent(this.talentId, paginationParams, '', '')
      .subscribe({
        next: (res: any) => {
          const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
          console.clear();
          console.log('decoded>>', decoded);
          this.initialPaginatedHires = decoded;
          this.paginatedHiresData = decoded;
          sessionStorage.setItem('lastMarkets', JSON.stringify(decoded));
          setTimeout(() => (this.showSpinner = false), 2000);
        },
        error: (err) => {
          console.error('Error fetching markets in view-hires:', err);
          this.initialPaginatedHires = [];
          this.paginatedHiresData = [];
          setTimeout(() => (this.showSpinner = false), 2000);
        },
      });
  }

  private setupSearchDebounce(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.currentPage = 1;
        this.loadMarketRecords();
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  loadMarketRecords(): void {
    if (!this.talentId) {
      console.error('No talent ID found');
      return;
    }

    this.isLoading = true;

    const paginationParams = {
      limit: this.itemsPerPage,
      pageNo: this.currentPage,
    };

    // Map UI filter to API status params
    let apiStatusParam = '';
    if (this.activeCategoryTable) {
      const statusMap = {
        awaiting: 'awaiting-acceptance',
        accepted: 'offer-accepted',
        declined: 'offer-declined',
        all: '',
      };

      if (this.activeCategoryTable in statusMap) {
        apiStatusParam =
          statusMap[this.activeCategoryTable as keyof typeof statusMap] || '';
      }
    }

    this.endpointService
      .fetchMarketsByTalent(
        this.talentId,
        paginationParams,
        apiStatusParam,
        this.scouterFilter,
        this.searchTerm,
      )
      .subscribe({
        next: (res: any) => {
          this.isLoading = false;
          console.log('API Response:', res);

          // Handle different response structures
          if (Array.isArray(res)) {
            this.marketRecords = this.transformApiData(res);
            this.totalRecords = res.length;
          } else if (res?.data && Array.isArray(res.data)) {
            this.marketRecords = this.transformApiData(res.data);
            this.totalRecords = res.data.length;
          } else if (res?.details) {
            try {
              const decoded = this.base64JsonDecode<any[]>(res.details);
              if (decoded && Array.isArray(decoded)) {
                this.marketRecords = this.transformApiData(decoded);
                this.totalRecords = decoded.length;
              }
            } catch (error) {
              console.error('Error decoding base64:', error);
              this.marketRecords = [];
              this.totalRecords = 0;
            }
          } else {
            console.warn('Unexpected API response structure:', res);
            this.marketRecords = [];
            this.totalRecords = 0;
          }

          // Update market expenditures count
          this.updateMarketExpenditures();

          // Set slideshow texts based on data availability
          this.setSlideshowText();
          this.updateNoExpenditureSlideshowText(); // Add this line
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error fetching market records:', err);
          this.showToast('Failed to load market records', 'danger');
          this.marketRecords = [];
          this.totalRecords = 0;
          this.setSlideshowText();
          this.updateNoExpenditureSlideshowText(); // Add this line
        },
      });
  }

  setSlideshowText(): void {
    const currentMonthHires = this.currentMonthHires;
    const totalExpenditure = currentMonthHires.reduce(
      (sum, hire) => sum + hire.amount,
      0,
    );

    if (currentMonthHires.length > 0) {
      // When there's data for current month
      this.slideshowTexts = [
        `Your Total Market Expenditures for the Month of ${this.currentMonth} is ₦${totalExpenditure.toLocaleString()}`,
        'Keep engaging more skilled talents for a rewarding experience on Oniduuru Marketplace... Well done!',
      ];
    } else {
      // Clear slideshow texts when no data - we'll use the noExpenditure slideshow instead
      this.slideshowTexts = [];
    }
  }

  get currentMonthHires(): any[] {
    return this.filterHiresByCurrentMonth(this.marketExpenditures);
  }

  // Add this method to filter hires by current month
  private filterHiresByCurrentMonth(hires: any[]): any[] {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return hires.filter((hire) => {
      const hireDate = new Date(hire.date);
      return (
        hireDate.getMonth() === currentMonth &&
        hireDate.getFullYear() === currentYear
      );
    });
  }

  private updateNoExpenditureSlideshowText() {
    // Create multiple variations of the "no expenditures" message for the slideshow
    this.noExpenditureSlideshowTexts = [
      `Oops!... No market expenditures found for ${this.currentMonth}.`,
      `Your market activity for ${this.currentMonth} is quiet. Start exploring opportunities!`,
      `No earnings recorded in ${this.currentMonth}. New job offers may be waiting for you.`,
      `Ready to work? ${this.currentMonth} has no expenditures yet. Check available positions!`,
      `Market expenditures for ${this.currentMonth} are at zero. New opportunities await!`,
      `Your ${this.currentMonth} earnings are untouched. Connect with scouters on Oniduuru Marketplace.`,
      `No transactions yet this month. New job offers could be just around the corner!`,
    ];
  }

  private transformApiData(apiData: any[]): any[] {
    console.log('🔄 Transforming API data, count:', apiData.length);

    return apiData.map((record) => {
      // Extract date from dateOfHire field (format: "Jan 24, 2026, 1:27 AM")
      let hireDate = record.dateOfHire || record.createdAt;
      let parsedDate = new Date();

      if (hireDate) {
        // Try to parse the date string
        try {
          // Handle format like "Jan 24, 2026, 1:27 AM"
          if (typeof hireDate === 'string' && hireDate.includes(',')) {
            parsedDate = new Date(hireDate);

            if (isNaN(parsedDate.getTime())) {
              const cleanDate = hireDate.replace(/\s+/g, ' ');
              parsedDate = new Date(cleanDate);

              if (isNaN(parsedDate.getTime())) {
                console.warn(
                  'Failed to parse date, using current date:',
                  hireDate,
                );
                parsedDate = new Date();
              }
            }
          } else {
            parsedDate = new Date(hireDate);
          }
        } catch (e) {
          console.warn('Failed to parse date:', hireDate, e);
          parsedDate = new Date();
        }
      }

      // Parse amount - handle string or number
      let amount = 0;
      if (record.amountToPay !== undefined && record.amountToPay !== null) {
        if (typeof record.amountToPay === 'string') {
          const cleanAmount = record.amountToPay.replace(/[^\d.]/g, '');
          const parsedAmount = parseFloat(cleanAmount);
          amount = isNaN(parsedAmount) ? 0 : parsedAmount;
        } else if (typeof record.amountToPay === 'number') {
          amount = record.amountToPay;
        }
      }

      // Parse comments
      let talentCommentObj = null;
      let scouterCommentObj = null;

      try {
        // Parse talent comment if it exists
        if (
          record.satisFactoryCommentByTalent &&
          typeof record.satisFactoryCommentByTalent === 'string' &&
          record.satisFactoryCommentByTalent.trim() !== '' &&
          record.satisFactoryCommentByTalent !== '""'
        ) {
          talentCommentObj = JSON.parse(record.satisFactoryCommentByTalent);
        }

        // Parse scouter comment if it exists
        if (
          record.satisFactoryCommentByScouter &&
          typeof record.satisFactoryCommentByScouter === 'string' &&
          record.satisFactoryCommentByScouter.trim() !== '' &&
          record.satisFactoryCommentByScouter !== '""'
        ) {
          scouterCommentObj = JSON.parse(record.satisFactoryCommentByScouter);
        }
      } catch (e) {
        console.warn('Error parsing comments:', e);
      }

      // Determine if rated based on parsed comments
      let isRated = false;
      let rating = 0;
      let talentRating = 0;
      let scouterRating = 0;

      if (talentCommentObj && talentCommentObj.rating !== undefined) {
        isRated = true;
        rating = talentCommentObj.rating || 0;
        talentRating = talentCommentObj.rating || 0;
      } else if (scouterCommentObj && scouterCommentObj.rating !== undefined) {
        isRated = true;
        rating = scouterCommentObj.rating || 0;
        scouterRating = scouterCommentObj.rating || 0;
      }

      return {
        id: record.marketHireId || record.id || record._id,
        name: record.scouterName || 'Unknown Scouter',
        email: record.scouterEmail || '',
        profilePic: record.scouterPicture || 'assets/images/default-avatar.png',
        status: this.mapApiStatusToDisplay(record.hireStatus),
        date: parsedDate.toISOString(),
        startDate: record.startDate || '',
        amount: amount,
        isRated: isRated,
        rating: rating,
        jobDescription: record.jobDescription || '',

        // Store parsed comments
        satisFactoryCommentByTalent: talentCommentObj,
        satisFactoryCommentByScouter: scouterCommentObj,

        // Rating info - use different variable names to avoid duplicates
        talentRating: talentRating,
        yourRating: scouterRating,
        talentComment: talentCommentObj?.remark || '',
        yourComment: scouterCommentObj?.remark || '',

        // Keep original API data for reference
        originalData: record,
      };
    });
  }

  private mapApiStatusToDisplay(apiStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-accepted': 'Offers Accepted',
      'offer-declined': 'Offers Declined',
      pending: 'Awaiting Acceptance',
      accepted: 'Offers Accepted',
      declined: 'Offers Declined',
    };

    return statusMap[apiStatus?.toLowerCase()] || apiStatus || 'Unknown';
  }

  private updateMarketExpenditures(): void {
    const currentMonthNum = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    this.marketExpenditures = this.marketRecords.filter((record) => {
      if (record.status !== 'Offers Accepted') return false;

      const recordDate = new Date(record.date);
      return (
        recordDate.getMonth() === currentMonthNum &&
        recordDate.getFullYear() === currentYear
      );
    });

    this.setSlideshowText();
    this.updateNoExpenditureSlideshowText(); // Add this line
  }

  // Helper methods for base64 decoding
  private base64JsonDecode<T = any>(b64: string): T | null {
    try {
      if (!b64) return null;
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json) as T;
    } catch (e) {
      console.error('Failed to decode base64 JSON:', e);
      return null;
    }
  }

  goToHireTransaction(hireId: string | number) {
    const selectedHire = this.marketRecords.find(
      (h) => String(h.id) === String(hireId),
    );

    // Navigate to the Market Price Preposition page with the hire object
    this.router.navigate(['/talent/market-price-preposition', hireId], {
      state: { hire: selectedHire },
    });
  }

  // Date formatting
  getFormattedDateTime(dateStr: string) {
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
  }

  // Status color mapping
  getStatusColor(status: string): string {
    switch (status) {
      case 'Offers Accepted':
        return '#10B981'; // green
      case 'Awaiting Acceptance':
        return '#F59E0B'; // orange
      case 'Offers Declined':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  }

  // Category methods
  setActiveCategoryBtn(key: string) {
    this.activeCategoryBtn = key;
  }

  setActiveCategoryTable(key: string) {
    this.activeCategoryTable = key;
    this.currentPage = 1;
    this.loadMarketRecords();
  }

  getActiveCategoryTitle(): string {
    const cat = this.categories.find((c) => c.key === this.activeCategoryBtn);
    return cat ? cat.title : '';
  }

  getFilterTitle(key: string): string {
    const f = this.filters.find((x) => x.key === key);
    return f ? f.title : '';
  }

  getFilterStatus(key: string): string {
    const f = this.filters.find((x) => x.key === key);
    return f ? f.status : '';
  }

  // Filtered data
  get filteredHires() {
    if (!this.activeCategoryBtn || this.activeCategoryBtn === 'all') {
      return this.marketRecords;
    }
    return this.marketRecords.filter(
      (h) => this.mapStatusToKey(h.status) === this.activeCategoryBtn,
    );
  }

  get filteredAndSearchedHires() {
    let list = [...this.marketRecords];

    // Apply search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(term) ||
          h.email.toLowerCase().includes(term),
      );
    }

    return list;
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
      this.loadMarketRecords();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadMarketRecords();
    }
  }

  // Refresh
  refreshData(event?: any) {
    this.currentPage = 1;
    this.loadMarketRecords();
    if (event) {
      event.target.complete();
    }
  }

  // Helper methods
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

  getRecordCount(record: any): number {
    return this.marketRecords.filter((r) => r.email === record.email).length;
  }

  getFormattedAmount(amount: number | string): string {
    // Convert to number
    let numAmount: number;

    if (typeof amount === 'string') {
      // Remove any commas and non-numeric characters except decimal point
      const cleanAmount = amount.replace(/[^\d.]/g, '');
      numAmount = parseFloat(cleanAmount);
    } else {
      numAmount = amount;
    }

    // Return ₦0 for invalid numbers
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return '₦0';
    }

    // Format with thousands separators
    return `₦${numAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // Talent name loading
  loadTalentName() {
    try {
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        this.userName =
          parsedProfile.fullName ||
          parsedProfile.details?.user?.fullName ||
          'User';
        if (this.userName !== 'User') return;
      }

      const talentDetails = this.authService.decodeTalentDetails();
      this.userName =
        talentDetails?.fullName ||
        talentDetails?.details?.user?.fullName ||
        'User';
    } catch (error) {
      console.error('Error loading talent name:', error);
      this.userName = 'User';
    }
  }

  // Toast notification
  async showToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
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

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.searchSubject.complete();
  }
}
