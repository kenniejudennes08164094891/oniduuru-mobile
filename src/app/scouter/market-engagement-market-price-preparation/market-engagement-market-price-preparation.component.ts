import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-market-engagement-market-price-preparation',
  templateUrl: './market-engagement-market-price-preparation.component.html',
  styleUrls: ['./market-engagement-market-price-preparation.component.scss'],
  standalone: false,
})
export class MarketEngagementMarketPricePreparationComponent implements OnInit {
  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'Vikiwest';

  rating: number = 0;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.hire = MockRecentHires.find((h) => h.id === id);
  }

  // setRating(star: number) {
  //   this.rating = star;
  // }

  setSelectedHire(hire: MockPayment) {
    this.hire = hire; // ✅ update active hire in dashboard
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
