import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-view-hires',
  templateUrl: './view-hires.page.html',
  styleUrls: ['./view-hires.page.scss'],
})
export class ViewHiresPage implements OnInit, OnDestroy {
  marketExpenditures: any[] = [];
  currentMonth: string = '';
  currentTime: Date = new Date(); // live clock
  private intervalId: any;


  constructor(private router: Router) { }
  goToHireTransaction(hireId: number) {
    console.log('Clicked hire:', hireId); // 👈 test log
    this.router.navigate(['/talent/market-price-preposition', hireId]);
  }
  ngOnInit() {
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
  headerHidden = false;

  // Example images (replace with your asset paths)
  images = {
    ViewHireFolderIcon: 'assets/icons/view-hire-folder.png',
    FoxCryptoIcon: 'assets/icons/fox-crypto.png',
    NoDataImage: 'assets/images/no-data.png',
  };

  // Mock data
  MockRecentHires = [
    { id: 1, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000 },
    { id: 2, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000 },
    { id: 3, name: 'Christiano Ronaldo', email: 'mike@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 390000 },
    { id: 4, name: 'Andre Messi', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 800000 },
    { id: 5, name: 'Elon Musk', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 70050 },
    { id: 6, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 300000 },
    { id: 7, name: 'Jane Smith', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 750000 },
    { id: 8, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 4000000 },
    { id: 9, name: 'Sam sam', email: 'john@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 3000000 },
    { id: 10, name: 'Seyi seyi', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 2750000 },
    { id: 11, name: 'Seyi ade', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 3785900 },
    { id: 12, name: 'Micheal Jackson', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 500000 },
    { id: 13, name: 'Yamine Yamal', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 780000 },
    { id: 14, name: 'Christiano Ronaldo', email: 'mike@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 390000 },
    { id: 15, name: 'Andre Messi', email: 'john@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 800000 },
    { id: 16, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 300000 },
    { id: 17, name: 'Jane Smith', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 750000 },
    { id: 18, name: 'Mike Johnson', email: 'mike@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Declined', date: '2025-09-05', time: '10:30 AM', startDate: '2025-09-10', amount: 4000000 },
    { id: 19, name: 'Sam sam', email: 'john@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Offers Accepted', date: '2025-09-01', time: '10:30 AM', startDate: '2025-09-05', amount: 3000000 },
    { id: 20, name: 'Seyi seyi', email: 'jane@example.com', profilePic: 'assets/images/portrait-african-american-man.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 2750000 },
    { id: 21, name: 'Elon Musk', email: 'jane@example.com', profilePic: 'assets/images/portrait-man-cartoon-style.jpg', status: 'Awaiting Acceptance', date: '2025-09-03', time: '10:30 AM', startDate: '2025-09-08', amount: 70050 },
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
    return this.filteredAndSearchedHires.slice(start, start + this.itemsPerPage);
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

  getFormattedAmount(amount: number): string {
    return `₦${amount.toLocaleString()}`;
  }

  viewMarketPricePreposition(id: number) {
    console.log('Clicked hire with ID:', id);
    // later we can route to a detail page
  }

}
