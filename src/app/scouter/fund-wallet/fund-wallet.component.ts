import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MockRecentHires, deposit } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { FundWalletPopupModalComponent } from 'src/app/utilities/modals/fund-wallet-popup-modal/fund-wallet-popup-modal.component';


// fund-wallet.component.ts
@Component({
  selector: 'app-fund-wallet',
  templateUrl: './fund-wallet.component.html',
  styleUrls: ['./fund-wallet.component.scss'],
  standalone: false,
})
export class FundWalletComponent implements OnInit {
  images = imageIcons;
  hires = MockRecentHires;

  // Dropdown options
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

  // Selected filters
  selectedYear: number | null = null;
  selectedMonth: string | null = null;
  // selectedStatus: string | null = null;
  // selectedIdentifier: string | null = null;
  // searchWalletName: string = '';

  // Dropdown states
  isYearDropdownOpen = false;
  isMonthDropdownOpen = false;
  // isStatusDropdownOpen = false;
  // isIdentifierDropdownOpen = false;

  // Mock data
  // deposit: Deposit[] = [
  //   {
  //     amount: 653655,
  //     walletName: 'Omoseyin Kehinde Jude',
  //     walletAcctNo: '1234211234',
  //     identifier: 'Fund Others',
  //     status: 'Successful',
  //     date: new Date(2016, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 450000,
  //     walletName: 'Adeola Michael',
  //     walletAcctNo: '9988776655',
  //     identifier: 'Fund Self',
  //     status: 'Failed',
  //     date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 320500,
  //     walletName: 'Chukwuemeka Nnamdi',
  //     walletAcctNo: '5566778899',
  //     identifier: 'Fund Others',
  //     status: 'Reversed',
  //     date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 120000,
  //     walletName: 'Blessing Adeyemi',
  //     walletAcctNo: '1122334455',
  //     identifier: 'Fund Self',
  //     status: 'Invalid',
  //     date: new Date(2025, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 90000,
  //     walletName: 'Uche Okafor',
  //     walletAcctNo: '4433221100',
  //     identifier: 'Fund Others',
  //     status: 'Successful',
  //     date: new Date(2024, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 250000,
  //     walletName: 'Fatima Musa',
  //     walletAcctNo: '6655443322',
  //     identifier: 'Fund Self',
  //     status: 'Failed',
  //     date: new Date(2021, 4, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 310000,
  //     walletName: 'Emmanuel Johnson',
  //     walletAcctNo: '7788990011',
  //     identifier: 'Fund Others',
  //     status: 'Successful',
  //     date: new Date(2020, 5, 4, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 480000,
  //     walletName: 'Grace Adeola',
  //     walletAcctNo: '9900112233',
  //     identifier: 'Fund Self',
  //     status: 'Reversed',
  //     date: new Date(2020, 10, 24, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 70000,
  //     walletName: 'Ibrahim Abdullahi',
  //     walletAcctNo: '3344556677',
  //     identifier: 'Fund Others',
  //     status: 'Invalid',
  //     date: new Date(2019, 2, 21, 10, 57), // May is month 4 (0-indexed)
  //   },
  //   {
  //     amount: 150000,
  //     walletName: 'Chinenye Udo',
  //     walletAcctNo: '2211334455',
  //     identifier: 'Fund Self',
  //     status: 'Successful',
  //     date: new Date(2021, 9, 6, 10, 57), // May is month 4 (0-indexed)
  //   },
  // ];
  deposit = deposit;

  // ✅ Pagination setup
  pageSize = 4;
  currentPage = 1;

  // 🔹 Toggle dropdowns
  toggleYearDropdown() {
    this.isYearDropdownOpen = !this.isYearDropdownOpen;
    this.isMonthDropdownOpen = false;
    // this.isStatusDropdownOpen = false;
    // this.isIdentifierDropdownOpen = false;
  }

  toggleMonthDropdown() {
    this.isMonthDropdownOpen = !this.isMonthDropdownOpen;
    this.isYearDropdownOpen = false;
    // this.isStatusDropdownOpen = false;
    // this.isIdentifierDropdownOpen = false;
  }

  // toggleStatusDropdown() {
  //   this.isStatusDropdownOpen = !this.isStatusDropdownOpen;
  //   this.isYearDropdownOpen = false;
  //   this.isMonthDropdownOpen = false;
  //   this.isIdentifierDropdownOpen = false;
  // }

  // toggleIdentifierDropdown() {
  //   this.isIdentifierDropdownOpen = !this.isIdentifierDropdownOpen;
  //   this.isYearDropdownOpen = false;
  //   this.isMonthDropdownOpen = false;
  //   this.isStatusDropdownOpen = false;
  // }

  //
  // 🔹 Master filter logic
  get filteredDeposit(): any {
    return this.deposit.filter((d) => {
      let matchesYear = true;
      let matchesMonth = true;
      // let matchesStatus = true;
      // let matchesIdentifier = true;
      // let matchesWalletName = true;

      if (this.selectedYear) {
        const depositYear = new Date(d.date).getFullYear();
        matchesYear = depositYear === this.selectedYear;
      }

      if (this.selectedMonth) {
        const depositMonth = new Date(d.date).toLocaleString('en-US', {
          month: 'long',
        });
        matchesMonth = depositMonth === this.selectedMonth;
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
    return Math.ceil(this.filteredDeposit.length / this.pageSize);
  }

  //
  get paginatedDeposit(): any {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredDeposit.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  constructor(private modalCtrl: ModalController, private router: Router) {}

  ngOnInit() {}

  async goToRequest(deposit: any): Promise<void> {
    await this.router.navigate(
      ['/scouter/wallet-page/fund-wallet/fund-wallet-request', deposit.id],
       { state: { deposit } } // ✅ passing the deposit object
    );
  }

  // 🔹 Reset to first page when filters change
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

  // selectStatus(status: string) {
  //   this.selectedStatus = status;
  //   this.isStatusDropdownOpen = false;
  //   this.currentPage = 1;
  // }

  // selectIdentifier(identifier: string) {
  //   this.selectedIdentifier = identifier;
  //   this.isIdentifierDropdownOpen = false;
  //   this.currentPage = 1;
  // }

  get successfulCount(): number {
    return this.deposit.filter((d) => d.status === 'Successful').length;
  }

  get invalidCount(): number {
    return this.deposit.filter((d) => d.status === 'Invalid').length;
  }

  get reversedCount(): number {
    return this.deposit.filter((d) => d.status === 'Reversed').length;
  }

  get failedCount(): number {
    return this.deposit.filter((d) => d.status === 'Failed').length;
  }

  get totalCount(): number {
    return this.deposit.length;
  }

  // 👇 function to open modal
  async openFundWalletPopup() {
    const modal = await this.modalCtrl.create({
      component: FundWalletPopupModalComponent,
      cssClass: 'fund-wallet-modal',
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'submitted' && result.data) {
        // assign a unique id if not already present
        result.data.id = Date.now(); // simple unique id

        this.deposit = [result.data, ...this.deposit];
        this.currentPage = 1;
      }
    });

    await modal.present();
  }
}
