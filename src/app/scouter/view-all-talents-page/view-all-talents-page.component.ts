import { Component, OnInit, OnDestroy } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { MockRecentHires } from 'src/app/models/mocks';
import { ViewAllTalentsPopupModalComponent } from 'src/app/utilities/modals/view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { Subscription } from 'rxjs';
import { SharedTalentDataService } from 'src/app/services/shared-talent-data.service';

@Component({
  selector: 'app-view-all-talents-page',
  templateUrl: './view-all-talents-page.component.html',
  styleUrls: ['./view-all-talents-page.component.scss'],
  standalone: false,
})
export class ViewAllTalentsPageComponent implements OnInit, OnDestroy {
  headerHidden: boolean = false;
  images = imageIcons;
  currentPage: number = 1;
  pageSize: number = 10;

  currentUser: any = {
    name: '',
    location: '',
  };

  talents: any[] = [];
  totalPages: number = 1;
  totalTalents: number = 0;
  loading: boolean = false;
  error: string = '';

  selectedSkills: string[] = [];
  locationFilter: string = '';

  private subscriptions: Subscription = new Subscription();

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private scouterService: ScouterEndpointsService,
    private sharedData: SharedTalentDataService, // Add this
  ) {}

  ngOnInit() {
    this.loadCurrentUserData();
    this.loadTalents();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadCurrentUserData() {
    try {
      const localStorageKeys = [
        'user_profile_data',
        'user_data',
        'auth_user',
        'current_user',
      ];
      for (const key of localStorageKeys) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            const userName =
              parsedData.fullName ||
              parsedData.name ||
              parsedData.username ||
              parsedData.firstName ||
              'Scouter';
            const userLocation =
              parsedData.location ||
              parsedData.address ||
              parsedData.city ||
              'Unknown Location';

            if (userName !== 'Scouter') {
              this.currentUser.name = this.formatUserName(userName);
              this.currentUser.location = userLocation;
              break;
            }
          } catch (e) {
            console.warn(`⚠️ Could not parse data from ${key}:`, e);
          }
        }
      }

      if (!this.currentUser.name) {
        this.currentUser.name = 'Viki West';
        this.currentUser.location = '12, Henry Uzuama street Awoyaya';
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      this.currentUser = {
        name: 'Viki West',
        location: '12, Henry Uzuama street Awoyaya',
      };
    }
  }

  private formatUserName(fullName: string): string {
    if (!fullName) return 'Scouter';
    const trimmedName = fullName.trim();
    const nameParts = trimmedName.split(' ');
    return nameParts[0];
  }

  loadTalents() {
    this.loading = true;
    this.error = '';

    const subscription = this.scouterService
      .fetchAllTalents({
        location: this.currentUser.location,
        skillset: this.selectedSkills,
        limit: this.pageSize,
        pageNo: this.currentPage,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;

          console.log('🔍 API Response:', response);

          // Extract talents from different possible response structures
          this.talents = this.extractTalentsFromResponse(response);

          // Share data with other components
          this.sharedData.updateTalents(this.talents);
          this.sharedData.updateLocation(this.currentUser.location);

          // Update pagination info
          this.totalTalents =
            response.pagination?.totalItems ||
            response.decodedData?.paginationParams?.totals ||
            response.total ||
            this.talents.length;
          this.totalPages =
            response.pagination?.totalPages ||
            Math.ceil(this.totalTalents / this.pageSize);

          console.log('✅ Talents loaded:', {
            count: this.talents.length,
            totalTalents: this.totalTalents,
            totalPages: this.totalPages,
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = err.message || 'Failed to load talents';
          console.error('❌ Error loading talents:', err);
        },
      });

    this.subscriptions.add(subscription);
  }

  // SIMPLIFIED - Extract talents from response
  private extractTalentsFromResponse(response: any): any[] {
    if (!response) return [];

    console.log('🔍 Extracting talents from response structure:', {
      hasTalents: !!response.talents,
      talentsLength: response.talents?.length,
      hasDecodedData: !!response.decodedData,
      hasMappedTalents: !!response.decodedData?.mappedTalents,
      mappedTalentsLength: response.decodedData?.mappedTalents?.length,
      hasData: !!response.data,
      dataIsArray: Array.isArray(response.data),
      responseKeys: Object.keys(response),
    });

    // Try different response structures in order of priority
    if (response.talents && Array.isArray(response.talents)) {
      console.log('✅ Using response.talents array');
      return response.talents.map((talent: any) => this.mapTalent(talent));
    }

    if (
      response.decodedData?.mappedTalents &&
      Array.isArray(response.decodedData.mappedTalents)
    ) {
      console.log('✅ Using decodedData.mappedTalents array');
      return response.decodedData.mappedTalents.map((talent: any) =>
        this.mapTalent(talent),
      );
    }

    if (response.data && Array.isArray(response.data)) {
      console.log('✅ Using response.data array');
      return response.data.map((talent: any) => this.mapTalent(talent));
    }

    if (Array.isArray(response)) {
      console.log('✅ Response itself is an array');
      return response.map((talent: any) => this.mapTalent(talent));
    }

    console.warn('⚠️ No valid talents array found in response');
    return [];
  }

  // In ViewAllTalentsPageComponent
  private mapTalent(talent: any): any {
    console.log('🎯 Mapping talent:', {
      name: talent.fullName,
      payRange: talent.payRange,
      talentId: talent.talentId, // Log the talent ID
    });

    // Get pay range as-is, don't modify it
    let payRange =
      talent.payRange ||
      (talent.skillLevel
        ? `Based on ${talent.skillLevel} level`
        : 'Negotiable');

    // Fix encoding
    if (payRange && typeof payRange === 'string') {
      payRange = payRange
        .replace(/â\x82¦/g, '₦')
        .replace(/â‚¦/g, '₦')
        .replace(/â€Â¦/g, '₦')
        .replace(/\u00a3/g, '₦')
        .replace(/\\u20a6/g, '₦');
    }

    return {
      id: talent.talentId || talent.id || `talent-${Date.now()}`,
      talentId: talent.talentId, // Keep the original talent ID
      profilePic:
        talent.talentPicture ||
        talent.profilePicture ||
        'assets/images/default-avatar.png',
      name: talent.fullName || talent.name || 'Unknown Talent',
      email: talent.email || 'No email',
      location: talent.location || talent.address || 'Unknown',
      skillLevel: talent.skillLevel || 'Intermediate',
      payRange: payRange,
      status: talent.status || 'active',
      skillSets: talent.skillSets || [],
      _raw: talent, // Keep original data for debugging
    };
  }

  // SIMPLE helper methods for template
  getStatusDotColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'inactive':
        return '#6B7280';
      default:
        return '#10B981';
    }
  }

  getFormattedStatus(status: string): string {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  async openViewAllTalentsPopupModal(talent: any) {
    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: {
        hire: talent,
        talentData: talent,
      },
      cssClass: 'all-talents-fullscreen-modal',
      initialBreakpoint: 1,
      backdropDismiss: true,
    });

    modal.onDidDismiss().then((result) => {
      if (result.data?.selectedSkills) {
        console.log('Selected skills from modal:', result.data.selectedSkills);
      }
    });

    await modal.present();
  }

  goToTalentLocation() {
    this.router.navigate([
      '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location',
    ]);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTalents();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTalents();
    }
  }

  applyFilters(location?: string, skills?: string[]) {
    this.currentPage = 1;
    if (location) this.locationFilter = location;
    if (skills) this.selectedSkills = skills;
    this.loadTalents();
  }

  clearFilters() {
    this.locationFilter = '';
    this.selectedSkills = [];
    this.currentPage = 1;
    this.loadTalents();
  }
}
