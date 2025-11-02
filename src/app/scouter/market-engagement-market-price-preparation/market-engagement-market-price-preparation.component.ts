import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-market-engagement-market-price-preparation',
  templateUrl: './market-engagement-market-price-preparation.component.html',
  styleUrls: ['./market-engagement-market-price-preparation.component.scss'],
  standalone: false,
})
export class MarketEngagementMarketPricePreparationComponent implements OnInit {
  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'Viki West';

  rating: number = 0;

  constructor(
    private route: ActivatedRoute,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const talentId = this.route.snapshot.paramMap.get('id');
    if (talentId) {
      this.loadHireDetails(talentId);
    }
  }

  loadHireDetails(talentId: string) {
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      return;
    }

    // Fetch specific talent engagement
    this.scouterService
      .getAllMarketsByScouter(scouterId, { talentId })
      .subscribe({
        next: (response) => {
          if (response.data && response.data.length > 0) {
            this.hire = response.data[0];
            this.userName = this.hire?.name || 'Unknown Talent';
          }
        },
        error: (error) => {
          console.error('❌ Error loading hire details:', error);
        },
      });
  }

  setRating(star: number) {
    if (!this.hire) return;

    this.hire.yourRating = star;

    // TODO: Implement API call to update rating instead of using mock data
    console.log('Rating updated to:', star, 'for hire:', this.hire.id);
  }

  setSelectedHire(hire: MockPayment) {
    this.hire = hire;
    this.userName = hire.name; // Safe because hire is guaranteed to be defined here
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
        return '#189537';
      case 'Awaiting Acceptance':
        return '#FFA500';
      case 'Offer Rejected':
        return '#CC0000';
      default:
        return '#79797B';
    }
  }
}
