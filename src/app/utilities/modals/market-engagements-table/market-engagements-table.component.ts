import { Component, EventEmitter, Output } from '@angular/core';
import { MockRecentHires } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-market-engagements-table',
  templateUrl: './market-engagements-table.component.html',
  styleUrls: ['./market-engagements-table.component.scss'],
  standalone: false,
})
export class MarketEngagementsTableComponent {
  hires = MockRecentHires;
  currentPage: number = 1;
  pageSize: number = 7;

  selectedHire: any = null;
  isModalOpen: boolean = false;

  @Output() hireSelected = new EventEmitter();

  constructor(private toastService: ToastsService) {}

  async openHireModal(hire: any) {
    // 👉 Always update dashboard first
    this.hireSelected.emit(hire);

    // 👉 Then run modal conditions
    if (hire.offerStatus !== 'Offer Accepted') {
      // const toast = await this.toastController.create({
      //   message: ``,
      //   duration: 2500,
      //   position: 'bottom',
      //   color: '',
      // });
      // await toast.present();
      this.toastService.openSnackBar(`${hire.offerStatus}`, 'success');
      return;
    }

    if (!hire.yourRating || hire.yourRating <= 0) {
      

      this.toastService.openSnackBar(
        `⭐ No rating provided yet. Set your own rating ↑`,
        'warning'
      );
      return;
    }

    // ✅ Passed → open modal
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

  getStatusColor(offerStatus: string): string {
    switch (offerStatus) {
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
