import { Component, OnInit, HostListener } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {
  title,
  gender,
  maritalStatus,
  countries,
  banks,
} from 'src/app/models/mocks';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-wallet-profile',
  templateUrl: './wallet-profile.component.html',
  styleUrls: ['./wallet-profile.component.scss'],
  standalone: false,
})
export class WalletProfileComponent implements OnInit {
  images = imageIcons;
  dob: string = '';
  dobFormatted: string = '';

  title = title;
  gender = gender;
  maritalStatus = maritalStatus;
  countries = countries;
  banks = banks;

  filteredTitle: string[] = [];
  filteredGender: string[] = [];
  filteredMaritalStatus: string[] = [];
  filteredCountries: string[] = [];
  filteredBanks: string[] = [];

  selectedTitle: string = '';
  selectedGender: string = '';
  selectedMaritalStatus: string = '';
  selectedCountry: string = '';
  selectedBank: string = '';

  showTitleDropdown = false;
  showGenderDropdown = false;
  showMaritalStatusDropdown = false;
  showCountryDropdown = false;
  showBankDropdown = false;

  constructor(private location: Location) {}

  ngOnInit() {
    this.filteredTitle = [...this.title];
    this.filteredGender = [...this.gender];
    this.filteredMaritalStatus = [...this.maritalStatus];
    this.filteredCountries = [...this.countries];
    this.filteredBanks = [...this.banks];
  }

  filterTitle(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredTitle = this.title.filter((t) =>
      t.toLowerCase().includes(query)
    );
  }
  filterGender(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredGender = this.gender.filter((g) =>
      g.toLowerCase().includes(query)
    );
  }
  filterMaritalStatus(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredMaritalStatus = this.maritalStatus.filter((m) =>
      m.toLowerCase().includes(query)
    );
  }

  filterCountries(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter((c) =>
      c.toLowerCase().includes(query)
    );
  }

  filterBanks(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredBanks = this.banks.filter((b) =>
      b.toLowerCase().includes(query)
    );
  }

  selectTitle(title: string) {
    this.selectedTitle = title;
    this.showTitleDropdown = false;
  }

  selectGender(gender: string) {
    this.selectedGender = gender;
    this.showGenderDropdown = false;
  }

  selectMaritalStatus(maritalStatus: string) {
    this.selectedMaritalStatus = maritalStatus;
    this.showMaritalStatusDropdown = false;
  }

  selectCountry(country: string) {
    this.selectedCountry = country;
    this.showCountryDropdown = false;
  }

  selectBank(bank: string) {
    this.selectedBank = bank;
    this.showBankDropdown = false;
  }

  formatDob() {
    if (!this.dob) return;
    const date = new Date(this.dob);
    this.dobFormatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // 👇 Close dropdowns on outside click
  @HostListener('document:click', ['$event'])
  handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-title')) {
      this.showTitleDropdown = false;
    }
    if (!target.closest('.dropdown-gender')) {
      this.showGenderDropdown = false;
    }
    if (!target.closest('.dropdown-maritalStatus')) {
      this.showMaritalStatusDropdown = false;
    }
    if (!target.closest('.dropdown-country')) {
      this.showCountryDropdown = false;
    }
    if (!target.closest('.dropdown-bank')) {
      this.showBankDropdown = false;
    }
  }

  goBack() {
    this.location.back();
  }
}
