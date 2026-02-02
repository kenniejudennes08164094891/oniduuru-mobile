import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-recent-hires-dashboard',
  templateUrl: './recent-hires-dashboard-component.component.html',
  styleUrls: ['./recent-hires-dashboard-component.component.scss'],
  standalone: false,
})
export class RecentHiresDashboardComponent implements OnInit, OnChanges {
  @Input() recentHiresData: any[] = [];

  images = imageIcons

  // Store the hires
  RecentHires: any[] = [];

  constructor(private router: Router) { }

  ngOnInit() {
    console.log('📥 Recent hires component initialized');
    this.updateHiresData();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('🔄 Recent hires data changed:', changes);
    if (changes['recentHiresData']) {
      this.updateHiresData();
    }
  }

  private updateHiresData(): void {
    console.log('📥 Recent hires component received data:', this.recentHiresData);

    // Use input data if available
    if (this.recentHiresData && this.recentHiresData.length > 0) {
      console.log('✅ Processing', this.recentHiresData.length, 'hires');

      // Log each hire to see the structure
      this.recentHiresData.forEach((hire, index) => {
        console.log(`Hire ${index}:`, {
          name: hire.name,
          rawName: hire.name, // Log what we're getting
          date: hire.date,
          time: hire.time,
          amount: hire.amount,
          profilePic: hire.profilePic,
          status: hire.status,
          offerStatus: hire.offerStatus,
          fullObject: hire // Log the full object for debugging
        });

        // Check if name is properly formatted
        if (!hire.name || hire.name === 'Unknown Talent') {
          console.warn(`⚠️ Hire ${index} has missing/unknown name:`, hire._raw);
        }
      });

      this.RecentHires = this.recentHiresData;
      console.log('✅ Recent hires loaded:', this.RecentHires.length, 'items');
    } else {
      console.log('⚠️ No recent hires data received or empty array');
      this.RecentHires = [];
    }

    console.log('📊 Final RecentHires state:', this.RecentHires);
  }

  // In recent-hires-dashboard-component.component.ts
  extractTalentName(hire: any): string {
    if (!hire) return 'Unknown Talent';

    // If name is already there, return it
    if (hire.name && hire.name !== 'Unknown Talent') {
      return hire.name;
    }

    // Try to extract from raw data
    if (hire._raw) {
      const raw = hire._raw;

      // Check multiple possible locations
      if (raw.talentName) return raw.talentName;
      if (raw.talent?.fullName) return raw.talent.fullName;
      if (raw.talent?.name) return raw.talent.name;
      if (raw.talent?.firstName || raw.talent?.lastName) {
        return `${raw.talent.firstName || ''} ${raw.talent.lastName || ''}`.trim();
      }
      if (raw.user?.fullName) return raw.user.fullName;
      if (raw.user?.name) return raw.user.name;
    }

    // Try to format from email if available
    if (hire.email) {
      const email = hire.email;
      const username = email.split('@')[0];
      return username.charAt(0).toUpperCase() + username.slice(1);
    }

    return 'Unknown Talent';
  }

  // Add this method to RecentHiresDashboardComponent
  trackByHire(index: number, hire: any): string {
    return hire.id || hire.marketHireId || index.toString();
  }

  goToViewHires() {
    this.router.navigate(['/scouter/view-hires']);
  }

  goToHireTalent() {
    this.router.navigate(['/scouter/hire-talent']);
  }

  // Format the date and time display
  getFormattedDateTime(hire: any): string {
    if (!hire) return 'N/A';

    // If we have separate date and time properties
    if (hire.date && hire.time) {
      return `${hire.date} at ${hire.time}`;
    }

    // If we have a combined datetime string
    if (hire.dateTime) {
      return hire.dateTime;
    }

    // Fallback to just date
    return hire.date || 'N/A';
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
    const hasHires = this.RecentHires && this.RecentHires.length > 0;
    console.log('🔍 hasRecentHires check:', hasHires, 'count:', this.RecentHires?.length);
    return hasHires;
  }

  get limitedRecentHires(): any[] {
    // Return first 4 hires or all if less than 4
    const limited = this.RecentHires.slice(0, 4);
    console.log('🔍 limitedRecentHires:', limited.length, 'items');
    return limited;
  }
}