import { Component } from '@angular/core';
import { MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-market-engagements-table',
  templateUrl: './market-engagements-table.component.html',
  styleUrls: ['./market-engagements-table.component.scss'],
})
export class MarketEngagementsTableComponent {
  hires = MockRecentHires;
  currentPage: number = 1;
  pageSize: number = 7;

  selectedHire: any = null;
  isModalOpen: boolean = false;

  openHireModal(hire: any) {
    this.selectedHire = hire;
    this.isModalOpen = true;
  }

  closeModal() {
    this.selectedHire = null;
    this.isModalOpen = false;
  }

  dismiss(sEvent: any) {
    if (sEvent === 'close' || sEvent === 'backdrop') {
      this.closeModal();
    }
  }
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
      case 'Offer Accepted':
        return '#189537'; // green dot
      case 'Awaiting Acceptance':
        return '#FFA500'; // orange dot
      case 'Offer Rejected':
        return '#CC0000'; // red dot
      default:
        return '#79797B'; // gray dot
    }
  }

  getStatusBg(status: string): string {
    switch (status) {
      case 'Offer Accepted':
        return '#E6F4EA'; // light green bg
      case 'Awaiting Acceptance':
        return '#FFF4E5'; // light orange bg
      case 'Offer Rejected':
        return '#FDECEA'; // light red bg
      default:
        return '#F5F5F5'; // light gray bg
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'Offer Accepted':
        return '#189537'; // green text
      case 'Awaiting Acceptance':
        return '#FFA500'; // orange text
      case 'Offer Rejected':
        return '#CC0000'; // red text
      default:
        return '#79797B'; // gray text
    }
  }
}
