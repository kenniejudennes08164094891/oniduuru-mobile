import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

interface MockPayment {
  profilePic: string;
  name: string;
  email: string;
  date: string;
  startDate: string;
  amount: number;
}

@Component({
  selector: 'app-view-all-hires-page',
  templateUrl: './view-all-hires-page.component.html',
  styleUrls: ['./view-all-hires-page.component.scss'],
})
export class ViewAllHiresPageComponent implements OnInit {
    @ViewChild('categoryDisplaySection') categoryDisplaySection!: ElementRef;

  headerHidden: boolean = false;
  images = imageIcons;
  currentMonth: string = new Date().toLocaleString('en-US', { month: 'short' });
  currentYear: number = new Date().getFullYear();

  searchTerm: string = '';
  currentPage: number = 1;
  pageSize: number = 5; // rows per page

  constructor() {}

  ngOnInit() {}

  MockRecentHires: MockPayment[] = [
    {
      profilePic: 'https://randomuser.me/api/portraits/men/32.jpg',
      name: 'John Doe',
      email: 'JohnDoe@gmail.com',
      date: 'Sep 10, 2025, 11:45 AM',
      startDate: 'Jan 1, 2025',
      amount: 123120.0,
    },
    {
      profilePic: 'https://randomuser.me/api/portraits/women/45.jpg',
      name: 'Jane Smith',
      email: 'Janesmt@gmail.com',
      date: 'Sep 9, 2025, 03:15 PM',
      startDate: 'Jan 9, 2025',
      amount: 123250.0,
    },
    {
      profilePic: 'https://randomuser.me/api/portraits/men/21.jpg',
      name: 'Michael Johnson',
      email: 'MichaelJohnson@gmail.com',
      date: 'Sep 8, 2025, 09:30 AM',
      startDate: 'Feb 1, 2025',
      amount: 23475.0,
    },
    {
      profilePic: 'https://randomuser.me/api/portraits/women/18.jpg',
      name: 'Emily Davis',
      email: 'Emily@gmail.com',
      date: 'Sep 7, 2025, 07:50 PM',
      startDate: 'Dec 1, 2025',
      amount: 234599.99,
    },
  ];

  categories = [
    { title: 'Most Hired Talent', key: 'most' },
    { title: 'Least Hired Talent', key: 'least' },
    { title: 'Underperformers', key: 'under' },
    { title: 'Top Performers', key: 'top' },
  ];

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
          acc[hire.email] = { ...hire };
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

    switch (categoryKey) {
      case 'most':
        return uniqueHires.filter((h) => occurrences[h.email] === maxCount);
      case 'least':
        return uniqueHires.filter((h) => occurrences[h.email] === minCount);
      case 'under':
        return uniqueHires.filter((h) => h.amount < 50000);
      case 'top':
        return uniqueHires.filter((h) => h.amount >= 100000);
      default:
        return [];
    }
  }


    private scrollToCategoryDisplay() {
    if (this.categoryDisplaySection) {
      this.categoryDisplaySection.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }


  get filteredAndSearchedHires() {
    let hires = this.activeCategoryTable
      ? this.filterByCategory(this.activeCategoryTable)
      : this.MockRecentHires;

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

  get paginatedHires() {
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
