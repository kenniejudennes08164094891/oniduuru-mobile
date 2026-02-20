import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';

@Component({
  selector: 'app-recent-hires-dashboard',
  templateUrl: './recent-hires-dashboard-component.component.html',
  styleUrls: ['./recent-hires-dashboard-component.component.scss'],
  standalone: false,
})
export class RecentHiresDashboardComponent implements OnInit, OnChanges {
  @Input() recentHiresData: any[] = [];

  images = imageIcons;
  isPaymentPendingOrUnpaid: boolean = false;

  // Store the hires
  RecentHires: any[] = [];

  constructor(
    private router: Router,
    private paymentService: PaymentService
  ) { }

  ngOnInit() {
    console.log('📥 Recent hires component initialized');
    this.updateHiresData();
    this.subscribeToPaymentStatus();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 Recent hires data changed:', changes);
    if (changes['recentHiresData']) {
      this.updateHiresData();
    }
  }

  private subscribeToPaymentStatus(): void {
    this.paymentService.paymentStatus$.subscribe((paymentStatus) => {
      // Disable if unpaid (false) or pendingPaymentVerification
      // Only enable when status is exactly 'true'
      this.isPaymentPendingOrUnpaid = paymentStatus.status !== 'true';
      console.log('🔒 Payment status:', paymentStatus.status, 'Buttons disabled:', this.isPaymentPendingOrUnpaid);
    });
  }

  private updateHiresData(): void {
    console.log('📥 Recent hires component received data:', this.recentHiresData);

    if (this.recentHiresData && this.recentHiresData.length > 0) {
      this.RecentHires = this.recentHiresData;
      console.log('✅ Recent hires loaded:', this.RecentHires.length, 'items');
    } else {
      console.log('⚠️ No recent hires data received or empty array');
      this.RecentHires = [];
    }
  }

  extractTalentName(hire: any): string {
    if (!hire) return 'Unknown Talent';

    if (hire.name && hire.name !== 'Unknown Talent') {
      return hire.name;
    }

    if (hire._raw) {
      const raw = hire._raw;
      if (raw.talentName) return raw.talentName;
      if (raw.talent?.fullName) return raw.talent.fullName;
      if (raw.talent?.name) return raw.talent.name;
    }

    if (hire.email) {
      const username = hire.email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1);
    }

    return 'Unknown Talent';
  }

  trackByHire(index: number, hire: any): string {
    return hire.id || hire.marketHireId || index.toString();
  }

  goToViewHires() {
    if (!this.isPaymentPendingOrUnpaid) {
      this.router.navigate(['/scouter/view-hires']);
    }
  }

  goToHireDetails(marketHireId: string) {
    if (!this.isPaymentPendingOrUnpaid && marketHireId) {
      this.router.navigate([`/market-engagement-market-price-preparation`, marketHireId]);
    }
  }

  getFormattedAmount(amount: number): string {
    if (!amount || isNaN(amount)) {
      return '₦0';
    }
    return amount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  get hasRecentHires(): boolean {
    return this.RecentHires && this.RecentHires.length > 0;
  }

  get limitedRecentHires(): any[] {
    return this.RecentHires.slice(0, 4);
  }
}