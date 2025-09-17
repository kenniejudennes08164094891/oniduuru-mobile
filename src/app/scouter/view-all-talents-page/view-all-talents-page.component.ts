import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-view-all-talents-page',
  templateUrl: './view-all-talents-page.component.html',
  styleUrls: ['./view-all-talents-page.component.scss'],
})
export class ViewAllTalentsPageComponent implements OnInit {
  headerHidden: boolean = false;
  images = imageIcons;
  hires = MockRecentHires;
  currentPage: number = 1;
  pageSize: number = 5;
  constructor() {}

  ngOnInit() {}

  // ✅ Use hires directly for now (later you can plug in search/filter)
  get filteredAndSearchedHires() {
    return this.hires;
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

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return '#189537'; // green dot
      case 'Pending':
        return '#FFA500'; // orange dot
      case 'Away':
        return '#79797B'; // gray dot
        default:
        return '#ffffff'; // red dot
    }
  }
}
