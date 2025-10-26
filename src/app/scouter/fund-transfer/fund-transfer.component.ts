import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MockRecentHires, Transfer, transfer } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { TransferFundsPopupModalComponent } from 'src/app/utilities/modals/transfer-funds-popup-modal/transfer-funds-popup-modal.component';
import { TransferFundsReceiptModalComponent } from 'src/app/utilities/modals/transfer-funds-receipt-modal/transfer-funds-receipt-modal.component';
import { WithdrawFundsPopupModalComponent } from 'src/app/utilities/modals/withdraw-funds-popup-modal/withdraw-funds-popup-modal.component';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.scss'],
  standalone: false,
})
export class FundTransferComponent implements OnInit {
  images = imageIcons;
  hires = MockRecentHires;

  // Dropdown states
  years: number[] = [
    2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016,
  ];
  months: string[] = [
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

  selectedYear: number | null = null;
  selectedMonth: string | null = null;

  isYearDropdownOpen = false;
  isMonthDropdownOpen = false;

  // Mock data for table
  transfer = transfer;

  // ✅ Pagination setup
  pageSize = 4;
  currentPage = 1;

  get filteredTransfer(): any[] {
    return this.transfer.filter((d) => {
      let matchesYear = true;
      let matchesMonth = true;
      // let matchesStatus = true;
      // let matchesIdentifier = true;
      // let matchesWalletName = true;

      if (this.selectedYear) {
        const transferYear = new Date(d.date).getFullYear();
        matchesYear = transferYear === this.selectedYear;
      }

      if (this.selectedMonth) {
        const transferMonth = new Date(d.date).toLocaleString('en-US', {
          month: 'long',
        });
        matchesMonth = transferMonth === this.selectedMonth;
      }

      // if (this.selectedStatus) {
      //   matchesStatus = d.status === this.selectedStatus;
      // }

      // if (this.selectedIdentifier) {
      //   matchesIdentifier = d.identifier === this.selectedIdentifier;
      // }
      // console.log(d.date, new Date(d.date));

      // if (this.searchWalletName.trim()) {
      //   matchesWalletName = d.walletName
      //     .toLowerCase()
      //     .includes(this.searchWalletName.toLowerCase());
      // }

      return (
        matchesYear && matchesMonth
        // &&
        // matchesStatus &&
        // matchesIdentifier &&
        // matchesWalletName
      );
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredTransfer.length / this.pageSize);
  }

  get paginatedTransfer(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransfer.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  openTransfer(transfer: Transfer) {
    this.router.navigate(
      [
        '/scouter/wallet-page/fund-transfer/fund-transfer-request/',
        transfer.id,
      ],
      { state: { transfer } } // 👈 pass the transfer object
    );
  }

  ngOnInit() {}

  toggleYearDropdown() {
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isMonthDropdownOpen = false;
  }

  toggleMonthDropdown() {
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
    this.isYearDropdownOpen = false;
  }

  selectYear(year: number) {
    this.selectedYear = year;
    this.isYearDropdownOpen = false;
  }

  selectMonth(month: string) {
    this.selectedMonth = month;
    this.isMonthDropdownOpen = false;
  }

  get successfulCount(): number {
    return this.transfer.filter((t) => t.status === 'Successful').length;
  }

  get pendingCount(): number {
    return this.transfer.filter((t) => t.status === 'Pending').length;
  }

  get reversedCount(): number {
    return this.transfer.filter((t) => t.status === 'Reversed').length;
  }

  get declinedCount(): number {
    return this.transfer.filter((t) => t.status === 'Declined').length;
  }

  get totalCount(): number {
    return this.transfer.length;
  }

  // 👇 function to open modal
  async openTransferFundsPopup() {
    const modal = await this.modalCtrl.create({
      component: WithdrawFundsPopupModalComponent,
      cssClass: 'fund-wallet-modal',
      initialBreakpoint: 1,
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        // assign a unique id if not already present
        result.data.id = Date.now(); // simple unique id

        // push the new withdrawal at the top
        this.transfer = [result.data, ...this.transfer];
        this.currentPage = 1;
      }
    });

    await modal.present();
  }
}
