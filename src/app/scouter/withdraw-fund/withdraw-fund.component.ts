import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MockRecentHires, withdrawal } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { WithdrawFundsPopupModalComponent } from 'src/app/utilities/modals/withdraw-funds-popup-modal/withdraw-funds-popup-modal.component';

@Component({
  selector: 'app-withdraw-fund',
  templateUrl: './withdraw-fund.component.html',
  styleUrls: ['./withdraw-fund.component.scss'],
  standalone: false,
})
export class WithdrawFundComponent implements OnInit {
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

  // statuses: string[] = ['Successful', 'Invalid', 'Reversed', 'Failed'];
  identifiers: string[] = ['Fund Self', 'Fund Others'];

  selectedYear: number | null = null;
  selectedMonth: string | null = null;

  isYearDropdownOpen = false;
  isMonthDropdownOpen = false;

  withdrawal = withdrawal;

  // ✅ Pagination setup
  pageSize = 4;
  currentPage = 1;

  toggleYearDropdown() {
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isMonthDropdownOpen = false;
  }

  toggleMonthDropdown() {
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
    this.isYearDropdownOpen = false;
  }

  get filteredWithdrawal(): any {
    return this.withdrawal.filter((w) => {
      let matchesYear = true;
      let matchesMonth = true;
      // let matchesStatus = true;
      // let matchesIdentifier = true;
      // let matchesWalletName = true;

      if (this.selectedYear) {
        const withdrawalYear = new Date(w.date).getFullYear();
        matchesYear = withdrawalYear === this.selectedYear;
      }

      if (this.selectedMonth) {
        const withdrawalMonth = new Date(w.date).toLocaleString('en-US', {
          month: 'long',
        });
        matchesMonth = withdrawalMonth === this.selectedMonth;
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
    return Math.ceil(this.filteredWithdrawal.length / this.pageSize);
  }

  get paginatedWithdrawal(): any {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredWithdrawal.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  ngOnInit() {}

  async goToRequest(withdrawal: any): Promise<void> {
await this.router.navigate(
  ['scouter/wallet-page/withdraw-funds/withdraw-funds-request', withdrawal.id],
  { state: { withdrawal } }
);
  }

  selectYear(year: number) {
    this.selectedYear = year;
    this.isYearDropdownOpen = false;
    this.currentPage = 1;
  }

  selectMonth(month: string) {
    this.selectedMonth = month;
    this.isMonthDropdownOpen = false;
    this.currentPage = 1;
  }

  get successfulCount(): number {
    return this.withdrawal.filter((w) => w.status === 'Successful').length;
  }

  get pendingCount(): number {
    return this.withdrawal.filter((w) => w.status === 'Pending').length;
  }

  get reversedCount(): number {
    return this.withdrawal.filter((w) => w.status === 'Reversed').length;
  }

  get declinedCount(): number {
    return this.withdrawal.filter((w) => w.status === 'Declined').length;
  }

  get totalCount(): number {
    return this.withdrawal.length;
  }

  // 👇 function to open modal
  async openWithdrawFundsPopup() {
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
        this.withdrawal = [result.data, ...this.withdrawal];
        this.currentPage = 1;
      }
    });

    await modal.present();
  }
}
