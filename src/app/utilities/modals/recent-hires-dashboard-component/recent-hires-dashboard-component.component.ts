// recent-hires-dashboard-component.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-recent-hires-dashboard',
  templateUrl: './recent-hires-dashboard-component.component.html',
  styleUrls: ['./recent-hires-dashboard-component.component.scss'],
  standalone: false,
})
export class RecentHiresDashboardComponent implements OnInit {
  MockRecentHires: MockPayment[] = MockRecentHires;

  constructor(private router: Router) {}

  ngOnInit() {}

  goToViewHires() {
    this.router.navigate(['/scouter/view-hires']);
  }

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  get limitedRecentHires(): MockPayment[] {
    return this.MockRecentHires.slice(0, 4);
  }
}
