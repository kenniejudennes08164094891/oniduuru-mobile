import { Component, EventEmitter, Output } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-market-engagement-tabs',
  templateUrl: './market-engagement-tabs.component.html',
  styleUrls: ['./market-engagement-tabs.component.scss'],
})
export class MarketEngagementTabsComponent {
  @Output() hireSelected = new EventEmitter<MockPayment>(); // strongly typed event

  activeTab: string = '';

  // mock data (replace with real API later)
  hires: MockPayment[] = MockRecentHires;

  constructor(private router: Router) {}

  ngOnInit() {
    // Set active tab based on current route
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;
        if (url.includes('market-price-preposition')) {
          this.activeTab = 'market-price-preposition';
        } else if (url.includes('market-stats')) {
          this.activeTab = 'market-stats';
        }
      });
  }

  navigateTo(tab: string) {
    this.router.navigate([tab]);
  }
}
