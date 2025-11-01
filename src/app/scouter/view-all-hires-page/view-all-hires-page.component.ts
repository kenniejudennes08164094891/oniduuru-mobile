import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { Router } from '@angular/router';
import {
  MockRecentHires,
  HireCategories,
  HireFilters,
} from 'src/app/models/mocks';

// Test commit
// Test commit

interface MockPayment {
  id: string; // unique identifier for routing
  profilePic: string;
  name: string;
  email: string;
  date: string;
  startDate: string;
  amount: number;
  offerStatus: 'Offer Accepted' | 'Awaiting Acceptance' | 'Offer Rejected';
  status: 'Active' | 'Pending' | 'Away';

  // NEW FIELDS
  jobDescription: string;
  yourComment: string;
  yourRating: number;
  talentComment: string;
  talentRating: number;
}

@Component({
  selector: 'app-view-all-hires-page',
  templateUrl: './view-all-hires-page.component.html',
  styleUrls: ['./view-all-hires-page.component.scss'],
  standalone: false,
})
export class ViewAllHiresPageComponent implements OnInit {
  @ViewChild('categoryDisplaySection') categoryDisplaySection!: ElementRef;

  MockRecentHires = MockRecentHires;

  categories = HireCategories;
  filters = HireFilters;

  headerHidden: boolean = false;
  images = imageIcons;
  currentMonth: string = new Date().toLocaleString('en-US', { month: 'short' });
  currentYear: number = new Date().getFullYear();

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5; // rows per page
  isFilterOpen: boolean = false;

  slideshowTexts: string[] = [
    `Your Total Market Expenditures for the Month of ${new Date().toLocaleString(
      'en-US',
      { month: 'short' }
    )} is ₦${(25000).toLocaleString()}`,
    'Keep engaging more skilled talents for a rewarding experience on Oniduuru Marketplace... Well done!',
  ];

  getFilterStatus(key: string): string {
    return this.filters.find((f) => f.key === key)?.status || '';
  }

  getFilterTitle(key: string): string {
    return this.filters.find((f) => f.key === key)?.title || '';
  }
  constructor(private router: Router) {}

  viewMarketPricePreposition(id: string) {
    this.router.navigate([
      '/scouter/market-engagement-market-price-preparation',
      id,
    ]);
  }

  ngOnInit() {}

  getSlideAnimationDuration(text: string): string {
    const baseDuration = 15; // seconds for ~40 chars
    const extraPerChar = 0.3; // add 0.3s per char
    const duration = baseDuration + text.length * extraPerChar;
    return `${duration}s`;
  }

  getStatusColor(offerStatus: string): string {
    switch (offerStatus) {
      case 'Offer Accepted':
        return '#189537'; // GREEN
      case 'Awaiting Acceptance':
        return '#FFA500'; // ORANGE
      case 'Offer Rejected':
        return '#CC0000'; // RED
      default:
        return '#79797B'; // GRAY
    }
  }

  // Separate states
  activeCategoryBtn: string | null = null;
  activeCategoryTable: string | null = null;

  setActiveCategoryBtn(categoryKey: string) {
    if (this.activeCategoryBtn === categoryKey) {
      this.activeCategoryBtn = null;
    } else {
      this.activeCategoryBtn = categoryKey;

      // Delay scroll so *ngIf section is rendered
      setTimeout(() => {
        this.scrollToCategoryDisplay();
      }, 100);
    }
  }

  setActiveCategoryTable(categoryKey: string) {
    this.activeCategoryTable = categoryKey;
  }

  // 👉 Format currency
  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  // 👉 Count occurrences of hires by email
  getOccurrences(): Record<string, number> {
    return this.MockRecentHires.reduce((acc, hire) => {
      acc[hire.email] = (acc[hire.email] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  getHireCount(hire: MockPayment): number {
    const occurrences = this.getOccurrences();
    return occurrences[hire.email] || 0;
  }

  // 👉 Safe unique hires
  getUniqueHires(): MockPayment[] {
    return Object.values(
      this.MockRecentHires.reduce((acc, hire) => {
        if (!acc[hire.email]) {
          acc[hire.email] = {
            ...hire,
            jobDescription: hire.jobDescription ?? '',
            yourComment: hire.yourComment ?? '',
            yourRating: hire.yourRating ?? 0,
            talentComment: hire.talentComment ?? '',
            talentRating: hire.talentRating ?? 0,
          };
        }
        return acc;
      }, {} as Record<string, MockPayment>)
    );
  }

  // 👉 Dynamic category counts
  getCategoryCount(categoryKey: string): number {
    return this.filterByCategory(categoryKey).length;
  }

  getActiveCategoryTitle(): string {
    return (
      this.categories.find((c) => c.key === this.activeCategoryBtn)?.title || ''
    );
  }

  get filteredHires(): MockPayment[] {
    if (!this.activeCategoryBtn) return [];
    return this.filterByCategory(this.activeCategoryBtn);
  }

  private filterByCategory(categoryKey: string): MockPayment[] {
    if (!this.MockRecentHires.length) return [];

    const occurrences = this.getOccurrences();
    const uniqueHires = this.getUniqueHires();

    const counts = Object.values(occurrences);
    const maxCount = counts.length ? Math.max(...counts) : 0;
    const minCount = counts.length ? Math.min(...counts) : 0;

    let hires: MockPayment[] = [];

    switch (categoryKey) {
      case 'most':
        hires = uniqueHires.filter((h) => occurrences[h.email] === maxCount);
        break;
      case 'least':
        hires = uniqueHires.filter((h) => occurrences[h.email] === minCount);
        break;
      case 'under':
        hires = uniqueHires.filter((h) => h.amount < 50000);
        break;
      case 'top':
        hires = uniqueHires.filter((h) => h.amount >= 100000);
        break;
      default:
        hires = [];
    }

    // 👉 Limit results to 5 (or change number as needed)
    return hires.slice(0, 4);
  }

  private scrollToCategoryDisplay() {
    if (this.categoryDisplaySection) {
      this.categoryDisplaySection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  private filterByStatus(filterKey: string): MockPayment[] {
    if (!this.MockRecentHires.length) return [];

    if (filterKey === 'all') {
      return this.MockRecentHires.map((hire) => ({
        ...hire,
        jobDescription: hire.jobDescription ?? '',
        yourComment: hire.yourComment ?? '',
        yourRating: hire.yourRating ?? 0,
        talentComment: hire.talentComment ?? '',
        talentRating: hire.talentRating ?? 0,
      }));
    }

    const status = this.getFilterStatus(filterKey);
    return this.MockRecentHires.filter((h) => h.offerStatus === status).map(
      (hire) => ({
        ...hire,
        jobDescription: hire.jobDescription ?? '',
        yourComment: hire.yourComment ?? '',
        yourRating: hire.yourRating ?? 0,
        talentComment: hire.talentComment ?? '',
        talentRating: hire.talentRating ?? 0,
      })
    );
  }

  get totalMarketExpenditure(): number {
    if (!this.MockRecentHires.length) return 0;
    return this.MockRecentHires.reduce((sum, hire) => sum + hire.amount, 0);
  }

  get hasMarketExpenditure(): boolean {
    return this.totalMarketExpenditure > 0;
  }

  get filteredAndSearchedHires() {
    let hires: MockPayment[] = this.activeCategoryTable
      ? this.filterByStatus(this.activeCategoryTable)
      : (this.MockRecentHires as MockPayment[]);

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      hires = hires.filter(
        (h) =>
          h.name.toLowerCase().includes(term) ||
          h.email.toLowerCase().includes(term)
      );
    }

    return hires;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSearchedHires.length / this.pageSize);
  }

  get paginatedHires(): MockPayment[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }
}
