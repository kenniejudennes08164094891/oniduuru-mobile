import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-market-price-preposition',
  templateUrl: './market-price-preposition.page.html',
  styleUrls: ['./market-price-preposition.page.scss'],
})
export class MarketPricePrepositionPage implements OnInit {
  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'SeyiAde';
  headerHidden: boolean = false;
  rating: number = 0;

  // ✅ for tab switching
  // activeTab: 'engagements' | 'stats' = 'engagements';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.hire = MockRecentHires.find((h) => h.id === id);
  }

  setRating(star: number) {
    if (!this.hire) return;

    this.hire.yourRating = star;

    // update mock array so it persists if needed
    const index = MockRecentHires.findIndex((h) => h.id === this.hire?.id);
    if (index !== -1) {
      MockRecentHires[index].yourRating = star;
    }
  }

  setSelectedHire(hire: MockPayment) {
    this.hire = hire; // ✅ update active hire in dashboard
  }

  // ✅ switch between tabs
  // setTab(tab: 'engagements' | 'stats') {
  //   this.activeTab = tab;
  // }

  getFormattedAmount(amount: number): string {
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getStatusColor(offerStatus: string): string {
    switch (offerStatus) {
      case 'Offer Accepted':
        return '#189537'; // GREEN
      case 'Awaiting Acceptance':
        return '#FFA500'; // ORANGE
      case 'Offer Rejected':
        return '#CC0000'; // RED
      default:
        return '#79797B'; // GRAY
    }
  }
}
