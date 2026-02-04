import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { Router } from '@angular/router';
import { EndpointService } from 'src/app/services/endpoint.service';
import { PaginationParams, marketHires } from 'src/app/models/mocks'; // or local interface
import { AuthService } from 'src/app/services/auth.service';
import { ModalController, ToastController } from '@ionic/angular';
@Component({
  selector: 'app-view-hires',
  templateUrl: './view-hires.page.html',
  styleUrls: ['./view-hires.page.scss'],
})
export class ViewHiresPage implements OnInit, OnDestroy {
  marketExpenditures: any[] = [];
  initialPaginatedHires: any[] = [];
  paginatedHiresData: any[] = []; // writable source
  @Input() hires: any[] = []; // new input from parent
  currentMonth: string = '';
  currentTime: Date = new Date(); // live clock
  talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
  userName: string = 'User';
  private intervalId: any;
  headerHidden: boolean = false;
  loading: string = 'Loading...';
  showSpinner: boolean = true;


  constructor(
    private router: Router,
    private endpointService: EndpointService,
    private authService: AuthService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController
  ) { }
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
  async goToHireTransaction(hireId: string  | number) {
  const selectedHire = this.MockRecentHires.find(h => String (h.id) === hireId);

  if (!selectedHire) {
    console.warn('Hire not found for ID:', hireId);
    return;
  }

  // Navigate to the Market Price Preposition page with the hire object
  await this.router.navigate(['/talent/market-price-preposition', hireId], {
    state: { hire: selectedHire },
  });
}



  // async goToHireTransaction(hireId: string | number): Promise<any> {
  //   console.log('Clicked hire:', hireId); // 👈 test log
  //   const selectedHire = this.MockRecentHires.find(h => h.id === hireId);
  //
  //   if (!selectedHire) return;
  //
  //   // If offer is completed / accepted, show evaluation popup
  //   if (selectedHire.status === 'Offers Accepted') {
  //     const modal = await this.modalCtrl.create({
  //       component: EvaluationPageComponent,
  //       componentProps: { scouterName: selectedHire.name },
  //     });

  //     await modal.present();

  //     const { data } = await modal.onDidDismiss();
  //     if (data) {
  //       console.log('Evaluation submitted:', data);
  //       // TODO: send data to backend or local storage
  //     }
  //   } else {
  //     // Otherwise, go to the details page as usual
  //     await this.router.navigate(['/talent/market-price-preposition', hireId]);
  //   }
  // }
  ngOnInit(): void {
    this.showSpinner = true;
    this.loading = "Fetching your Hires...";
    const saved = localStorage.getItem('MockRecentHires');
    if (saved) {
      this.MockRecentHires = JSON.parse(saved);
    } else {
      this.MockRecentHires = [
        // Example
        { id: 1, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 2, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000, isRated: false, rating: null, comment: '' },
        { id: 3, name: 'Alice Smith', email: 'alice@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-02', time: '10:30 AM', startDate: '2025-09-10', amount: 650000, isRated: false, rating: null, comment: '' },
        { id: 4, name: 'Bob Johnson', email: 'bob@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-04', time: '10:30 AM', startDate: '2025-09-12', amount: 850000, isRated: false, rating: null, comment: '' },
        { id: 5, name: 'Catherine Lee', email: 'catherine@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-15', amount: 920000, isRated: false, rating: null, comment: '' },
        { id: 6, name: 'David Brown', email: 'david@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-06', time: '10:30 AM', startDate: '2025-09-18', amount: 750000, isRated: false, rating: null, comment: '' },
        { id: 7, name: 'Eva Green', email: 'eva@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-07', time: '10:30 AM', startDate: '2025-09-20', amount: 880000, isRated: false, rating: null, comment: '' },
        { id: 8, name: 'Frank White', email: 'frank@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-08', time: '10:30 AM', startDate: '2025-09-22', amount: 720000, isRated: false, rating: null, comment: '' },
        { id: 9, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
        { id: 10, name: 'Henry Gold', email: 'henry@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-10', time: '10:30 AM', startDate: '2025-09-26', amount: 820000, isRated: false, rating: null, comment: '' },
        { id: 11, name: 'Henry Gold', email: 'henry@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-10', time: '10:30 AM', startDate: '2025-09-26', amount: 820000, isRated: false, rating: null, comment: '' },
        { id: 12, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
        { id: 13, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
        { id: 14, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 15, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 16, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 17, name: 'Gerrade Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 18, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 19, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 20, name: 'Gerrade Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
        { id: 21, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
      ].map(h => ({
        ...h,
        isRated: false,
        rating: null,
        comment: '',
      }));
      localStorage.setItem('MockRecentHires', JSON.stringify(this.MockRecentHires));
    }
    this.loadTalentName();
    //  Final fallback: call API directly
    if (!this.talentId) return;
    const paginationParams: PaginationParams = { limit: 10, pageNo: 1 };
    this.endpointService.fetchMarketsByTalent(this.talentId, paginationParams, '', '').subscribe({
      next: (res: any) => {
        const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
        console.clear();
        console.log("decoded>>", decoded); // use this as mock data: marketHires
        this.initialPaginatedHires = decoded;
        this.MockRecentHires = decoded;
        this.paginatedHiresData = decoded;
        sessionStorage.setItem('lastMarkets', JSON.stringify(decoded)); // optional
        setTimeout(() => this.showSpinner = false, 2000);
      },
      error: (err) => {
        console.error('Error fetching markets in view-hires:', err);
        this.initialPaginatedHires = [];
        this.paginatedHiresData = [];
        setTimeout(() => this.showSpinner = false, 2000);
      }
    });

    this.paginatedHiresData = this.initialPaginatedHires;

    // set current month
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    this.currentMonth = monthNames[now.getMonth()];

    // start live clock
    this.intervalId = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    // Example mock data
    this.marketExpenditures = [];
  }
async goToMarketPreposition(hire: any) {
 await this.router.navigate(['/market-price-preposition', hire.id], {
    state: { hire },
  });
}

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
      console.log('Decoded Talent Details (View Hires):', talentDetails);

      this.userName =
        talentDetails?.fullName ||
        talentDetails?.details?.user?.fullName ||
        'User';
    } catch (error) {
      console.error('Error loading talent name:', error);
      this.userName = 'User';
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  // format hire date (static from data)
  getFormattedDateTime(dateStr: string) {
    const dateObj = new Date(dateStr);
    const optionsDate: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

    const formattedDate = dateObj.toLocaleDateString('en-US', optionsDate);
    const formattedTime = dateObj.toLocaleTimeString('en-US', optionsTime);

    return { date: formattedDate, time: formattedTime };
  }

  // format live clock
  getFormattedLiveTime() {
    return this.currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  // Example images (replace with your asset paths)
  images = {
    ViewHireFolderIcon: 'assets/icons/view-hire-folder.png',
    FoxCryptoIcon: 'assets/icons/fox-crypto.png',
    NoDataImage: 'assets/images/no-data.png',
  };

  // Mock data
  MockRecentHires = [
    { id: 1, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 2, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000, isRated: false, rating: null, comment: '' },
    { id: 3, name: 'Alice Smith', email: 'alice@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-02', time: '10:30 AM', startDate: '2025-09-10', amount: 650000, isRated: false, rating: null, comment: '' },
    { id: 4, name: 'Bob Johnson', email: 'bob@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-04', time: '10:30 AM', startDate: '2025-09-12', amount: 850000, isRated: false, rating: null, comment: '' },
    { id: 5, name: 'Catherine Lee', email: 'catherine@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-15', amount: 920000, isRated: false, rating: null, comment: '' },
    { id: 6, name: 'David Brown', email: 'david@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-06', time: '10:30 AM', startDate: '2025-09-18', amount: 750000, isRated: false, rating: null, comment: '' },
    { id: 7, name: 'Eva Green', email: 'eva@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-07', time: '10:30 AM', startDate: '2025-09-20', amount: 880000, isRated: false, rating: null, comment: '' },
    { id: 8, name: 'Frank White', email: 'frank@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-08', time: '10:30 AM', startDate: '2025-09-22', amount: 720000, isRated: false, rating: null, comment: '' },
    { id: 9, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
    { id: 10, name: 'Henry Gold', email: 'henry@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-10', time: '10:30 AM', startDate: '2025-09-26', amount: 820000, isRated: false, rating: null, comment: '' },
    { id: 11, name: 'Henry Gold', email: 'henry@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-10', time: '10:30 AM', startDate: '2025-09-26', amount: 820000, isRated: false, rating: null, comment: '' },
    { id: 12, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
    { id: 13, name: 'Grace Black', email: 'grace@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-09', time: '10:30 AM', startDate: '2025-09-24', amount: 780000, isRated: false, rating: null, comment: '' },
    { id: 14, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 15, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 16, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 17, name: 'Gerrade Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 18, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 19, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 20, name: 'Gerrade Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    { id: 21, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000, isRated: false, rating: null, comment: '' },
    // ...repeat for each record
  ];


  slideshowTexts = [
    'Track your hires seamlessly',
    'Monitor offers and responses',
    'Stay ahead with insights',
  ];

  categories = [
    { key: 'accepted', title: 'Offers Accepted' },
    { key: 'awaiting', title: 'Awaiting Acceptance' },
    { key: 'declined', title: 'Offers Declined' },
    { key: 'all', title: 'All Records' },
  ];

  filters = [
    { key: 'accepted', title: 'Offers Accepted', status: 'Offers Accepted' },
    { key: 'awaiting', title: 'Awaiting Acceptance', status: 'Awaiting Acceptance' },
    { key: 'declined', title: 'Offers Declined', status: 'Offers Declined' },
    { key: 'all', title: 'All Records', status: 'All' },
  ];

  // State
  activeCategoryBtn: string | null = null;
  activeCategoryTable: string | null = null;
  isFilterOpen = false;
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 8;

  // ===== Category Methods =====
  setActiveCategoryBtn(key: string) {
    this.activeCategoryBtn = key;
  }

  getCategoryCount(key: string): number {
    if (key === 'all') return this.MockRecentHires.length;
    return this.MockRecentHires.filter(h => this.mapStatusToKey(h.status) === key).length;
  }

  getActiveCategoryTitle(): string {
    const cat = this.categories.find(c => c.key === this.activeCategoryBtn);
    return cat ? cat.title : '';
  }

  get filteredHires() {
    if (!this.activeCategoryBtn || this.activeCategoryBtn === 'all') {
      return this.MockRecentHires;
    }
    return this.MockRecentHires.filter(h => this.mapStatusToKey(h.status) === this.activeCategoryBtn);
  }

  // ===== Table Filter =====
  setActiveCategoryTable(key: string) {
    this.activeCategoryTable = key;
    this.currentPage = 1;
  }

  getFilterTitle(key: string): string {
    const f = this.filters.find(x => x.key === key);
    return f ? f.title : '';
  }

  getFilterStatus(key: string): string {
    const f = this.filters.find(x => x.key === key);
    return f ? f.status : '';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Offers Accepted': return 'green';
      case 'Awaiting Acceptance': return 'orange';
      case 'Offers Declined': return 'red';
      default: return 'gray';
    }
  }



  // ===== Search + Pagination =====
  get filteredAndSearchedHires() {
    let list = [...this.MockRecentHires];

    // Apply filter dropdown
    if (this.activeCategoryTable && this.activeCategoryTable !== 'all') {
      list = list.filter(h => this.mapStatusToKey(h.status) === this.activeCategoryTable);
    }

    // Apply search
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      list = list.filter(h =>
        h.name.toLowerCase().includes(term) ||
        h.email.toLowerCase().includes(term)
      );
    }

    return list;
  }

  get paginatedHires() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredAndSearchedHires.slice(start, start + this.itemsPerPage).map((item:any) => ({
      id: Number(item?.id),
      profilePic: item?.talentPicture,
      name: item?.talentName,
      email: item?.talentEmail,
      date: item?.dateOfHire,
      startDate: item?.startDate,
      amount: item?.amountToPay,
      status: item?.hireStatus,
      isRated:item?.satisFactoryCommentByScouter?.rating,
      rating: item?.satisFactoryCommentByScouter?.rating,
    }))
  }

  get totalPages() {
    return Math.ceil(this.filteredAndSearchedHires.length / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  // ===== Helpers =====
  mapStatusToKey(status: string): string {
    switch (status) {
      case 'Offers Accepted': return 'accepted';
      case 'Awaiting Acceptance': return 'awaiting';
      case 'Offers Declined': return 'declined';
      default: return 'all';
    }
  }

  getHireCount(hire: any): number {
    return this.MockRecentHires.filter(h => h.email === hire.email).length;
  }

  getFormattedAmount(amount: number): string | any {
    if(amount){
      return `₦${amount.toLocaleString()}`;
    }
  }

  viewMarketPricePreposition(id: number) {
    console.log('Clicked hire with ID:', id);
    // later we can route to a detail page
  }

}
