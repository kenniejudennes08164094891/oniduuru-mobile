import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  headerHidden: boolean = false;

  constructor(private router: Router) {}

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  ngOnInit() {}

  formatNumber(event: any) {
    let input = event.target as HTMLInputElement;
    // Strip non-digits
    let value = input.value.replace(/\D/g, '');
    // Add commas
    input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
