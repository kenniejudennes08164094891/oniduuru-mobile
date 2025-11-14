import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  isLoading: boolean = false;

  constructor(
    public route: ActivatedRoute,

    // PASSED TALENT ID AS QUERY PARAMETER IN THIS COMPONENT
    private scouterService: ScouterEndpointsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const talentId = this.route.snapshot.paramMap.get('id');
    if (talentId) {
      this.loadHireDetails(talentId);
    }
  }

  loadHireDetails(talentId: string) {
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      this.isLoading = false;
      return;
    }

    console.log(
      '🔍 Fetching hire details for talent:',
      talentId,
      'scouter:',
      scouterId
    );

    // Use GET with talentId as query parameter
    this.scouterService
      .getAllMarketsByScouter(scouterId, {
        talentId: talentId,
        limit: 10, // Include limit as required by API
      })
      .subscribe({
        next: (response) => {
          console.log('✅ Hire details response:', response);

          if (response?.data && response.data.length > 0) {
            // Take the first result (should be the specific talent engagement)
            this.hire = response.data[0];
            this.userName = this.hire?.name || 'Unknown Talent';
            console.log('✅ Hire data loaded:', this.hire);
          } else {
            console.warn(
              '⚠️ No market engagement found for this talent, using mock data'
            );
            this.loadMockData(talentId);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Error loading hire details from API:', error);
          console.log('🔄 Falling back to mock data...');
          this.loadMockData(talentId);
          this.isLoading = false;
        },
      });
  }

  private loadMockData(talentId: string) {
    // Fallback to mock data when API fails or returns no results
    const mock = MockRecentHires.find((m) => String(m.id) === String(talentId));
    if (mock) {
      this.hire = {
        ...mock,
        jobDescription: mock.jobDescription ?? '',
        yourComment: mock.yourComment ?? '',
        yourRating: mock.yourRating ?? 0,
        talentComment: mock.talentComment ?? '',
        talentRating: mock.talentRating ?? 0,
      } as MockPayment;
      this.userName = this.hire?.name || 'Unknown Talent';
    } else {
      console.error('❌ No mock data found for talent ID:', talentId);
      // Create a fallback hire object to prevent template errors
      this.hire = this.createFallbackHire(talentId);
    }
  }

  private createFallbackHire(talentId: string): MockPayment {
    return {
      id: talentId,
      profilePic: 'assets/images/default-avatar.png',
      name: 'Unknown Talent',
      email: 'No email available',
      date: new Date().toLocaleDateString(),
      startDate: 'N/A',
      amount: 0,
      offerStatus: 'Awaiting Acceptance',
      status: 'Pending',
      jobDescription: 'No job description available',
      yourComment: '',
      yourRating: 0,
      talentComment: '',
      talentRating: 0,
    } as MockPayment;
  }

  updateRating(star: number) {
    if (!this.hire) return;

    const hire = this.hire; // capture local reference
    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      console.error('❌ No scouter ID found');
      return;
    }

    const payload = {
      scouterId: scouterId,
      remark: hire.yourComment || 'Rating updated via detail page',
      rating: star,
    };

    console.log('⭐ Updating rating for hire:', hire.id, 'to:', star);

    this.scouterService.updateMarketComment(hire.id, payload).subscribe({
      next: (response) => {
        console.log('✅ Rating updated successfully:', response);
        hire.yourRating = star;

        // Update mock data for consistency in development
        const index = MockRecentHires.findIndex((h) => h.id === hire.id);
        if (index !== -1) {
          MockRecentHires[index].yourRating = star;
        }

        // Optional: Show success feedback
        this.showSuccessFeedback('Rating updated successfully!');
      },
      error: (error) => {
        console.error('❌ Failed to update rating:', error);
        this.showErrorFeedback('Failed to update rating');
        // Optionally revert the UI change
      },
    });
  }

  private showSuccessFeedback(message: string) {
    // You can implement toast or other feedback mechanism here
    console.log('✅', message);
  }

  private showErrorFeedback(message: string) {
    // You can implement toast or other feedback mechanism here
    console.error('❌', message);
  }

  setSelectedHire(hire: MockPayment) {
    console.log('🔄 MarketPricePrep: Setting selected hire:', hire.name);
    this.hire = hire;
    this.userName = hire.name;

    // If you want to update the URL when a new hire is selected from the table:
    this.router.navigate(['/scouter/market-engagement-market-price-preparation', hire.id]);
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
