import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { TransferFundsPopupModalComponent } from 'src/app/utilities/modals/transfer-funds-popup-modal/transfer-funds-popup-modal.component';

interface Deposit {
  amount: number;
  walletName: string;
  walletAcctNo: string;
  identifier: string;
  status: 'Successful' | 'Pending' | 'Declined' | 'Reversed';
  bank: string;
  nubamAccNo: string;
  walletId: string;
  date: Date; // 👈 use Date instead of string
}

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
  transfer: Deposit[] = [
    {
      amount: 653655,
      walletName: 'Omoseyin Kehinde Jude',
      walletAcctNo: '1234211234',
      identifier: 'Fund Others',
      status: 'Successful',
      date: new Date(2025, 3, 17, 10, 57), // May is month 4 (0-indexed)
      bank: 'Access Bank Nigeria Plc',
      nubamAccNo: '1234211234',
      walletId: '0033392845',
    },
    {
      amount: 450000,
      walletName: 'Adeola Michael',
      walletAcctNo: '9988776655',
      identifier: 'Fund Self',
      status: 'Pending',
      date: new Date(2025, 4, 4, 10, 7), // May is month 4 (0-indexed)
      bank: 'Access Bank Nigeria Plc',
      nubamAccNo: '1234211234',
      walletId: '0033392845',
    },
    {
      amount: 320500,
      walletName: 'Chukwuemeka Nnamdi',
      walletAcctNo: '5566778899',
      identifier: 'Fund Others',
      status: 'Declined',
      date: new Date(2025, 4, 24, 10, 8), // May is month 4 (0-indexed)
      bank: 'Access Bank Nigeria Plc',
      nubamAccNo: '1234211234',
      walletId: '0033392845',
    },
    {
      amount: 450000,
      walletName: 'Adeola Michael',
      walletAcctNo: '9988776655',
      identifier: 'Fund Self',
      status: 'Reversed',
      date: new Date(2021, 9, 24, 9, 57), // May is month 4 (0-indexed)
      bank: 'Access Bank Nigeria Plc',
      nubamAccNo: '1234211234',
      walletId: '0033392845',
    },
  ];

  // ✅ Pagination setup
  pageSize = 4;
  currentPage = 1;

  get filteredTransfer(): Deposit[] {
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

  get paginatedTransfer(): Deposit[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransfer.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private modalCtrl: ModalController) {}

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

  // 👇 function to open modal
  async openTransferFundsPopup() {
    const modal = await this.modalCtrl.create({
      component: TransferFundsPopupModalComponent,
      // componentProps: { hire }, // ✅ pass the hire data
      cssClass: 'fund-wallet-modal',
      initialBreakpoint: 1,
      backdropDismiss: true,
    });
    await modal.present();
  }
}
