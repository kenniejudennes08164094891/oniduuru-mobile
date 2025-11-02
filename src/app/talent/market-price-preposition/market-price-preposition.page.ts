import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginationParams } from 'src/app/models/mocks';
@Component({
  selector: 'app-market-price-preposition',
  templateUrl: './market-price-preposition.page.html',
  styleUrls: ['./market-price-preposition.page.scss'],
})
export class MarketPricePrepositionPage implements OnInit {
  hire: MockPayment | undefined;
  images = imageIcons;
  userName: string = 'User';
  headerHidden: boolean = false;
  rating: number = 0;
  marketItems: any[] = [];

  // ✅ for tab switching
  // activeTab: 'engagements' | 'stats' = 'engagements';

  constructor(
    private route: ActivatedRoute,
    private endpointService: EndpointService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.hire = MockRecentHires.find((h) => h.id === id);
    this.fetchMarketsOnEnter();
    this.loadTalentName();
  }
  loadTalentName() {
    try {
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        this.userName =
          parsedProfile.fullName ||
          parsedProfile.details?.user?.fullName ||
          'User';
        if (this.userName !== 'User') return;
      }

      const talentDetails = this.authService.decodeTalentDetails();
      console.log('Decoded Talent Details (View Hires):', talentDetails);

      this.userName =
        talentDetails?.fullName ||
        talentDetails?.details?.user?.fullName ||
        'User';
    } catch (error) {
      console.error('Error loading talent name:', error);
      this.userName = 'User';
    }
  }
  private base64JsonDecode<T = any>(b64?: string): T | null {
    try {
      if (!b64) return null;
      const binary = atob(b64);
      const bytes = Uint8Array.from(binary, (c: string) => c.charCodeAt(0));
      const jsonString = new TextDecoder().decode(bytes);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Error decoding base64 JSON:', error);
      return null;
    }
  }
  private fetchMarketsOnEnter(): void {
    const talentId = localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.error('Talent ID not found in storage.');
      return;
    }
    const navState: any = (history && history.state) ? history.state : {};
    const scouterIdFromState = navState?.scouterId || navState?.hire?.scouterId;
    const scouterIdFromHire = (this.hire as any)?.scouterId;
    const scouterId = scouterIdFromState || scouterIdFromHire || ''; 
    const paginationParams = { limit: 10, pageNo: 1 };
    this.endpointService.fetchMarketsByTalent(talentId, paginationParams, '', scouterId).subscribe({
      next: (res: any) => {
        const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
        // store list for template use
        this.marketItems = Array.isArray(decoded) ? decoded : [];
      },
      error: (err: any) => {
        console.error('Error fetching markets for market-price-preposition page:', err);
        this.marketItems = [];
      }
    });
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
  goToHireTransaction(hire: any): void {
    if (!hire) { return; }
    const hireId = hire.id;
    const scouterId = hire.scouterId || ''; // example: 'scouter/4212/23November2024'
    // pass the hire and scouterId in navigation state
    this.router.navigate(['/talent/market-price-preposition', hireId], {
      state: { scouterId, hire }
    });
  }
}
