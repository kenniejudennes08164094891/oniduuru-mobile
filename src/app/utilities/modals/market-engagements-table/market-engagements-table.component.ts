import { Component, EventEmitter, Output } from '@angular/core';
import { MockRecentHires } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';

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

  @Output() hireSelected = new EventEmitter<any>(); // ✅ new output event

  constructor(private toastController: ToastController) {}

  async openHireModal(hire: any) {
    // always send selected hire to dashboard
    this.hireSelected.emit(hire);

    // check conditions for modal
    if (hire.status !== 'Offer Accepted') {
      const toast = await this.toastController.create({
        message: `${hire.status}`,
        duration: 2500,
        position: 'bottom',
        color: 'danger',
      });
      await toast.present();
      return;
    }

    if (!hire.yourRating || hire.yourRating <= 0) {
      const toast = await this.toastController.create({
        message: `⭐ No rating provided yet. Set your own rating ↑ `,
        duration: 2500,
        position: 'bottom',
        color: 'warning',
      });
      await toast.present();
      return;
    }

    // ✅ passed conditions → open modal
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
}
