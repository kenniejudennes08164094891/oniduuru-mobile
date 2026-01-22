// view-all-talents-popup-modal.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
  standalone: false,
})
export class ViewAllTalentsPopupModalComponent extends BaseModal implements OnInit {
  @Input() hire: any; // Talent data passed from parent
  @Input() talentData: any; // Original talent data for API call

  selectedSkills: any[] = [];
  loading: boolean = false;
  error: string = '';

  // Market profile data from API
  marketProfile: any = null;
  skillSet: any[] = [];
  marketReviews: any[] = [];
  pictorialDocumentations: any[] = [];
  metaData: any = null;

  constructor(
    modalCtrl: ModalController,
    private router: Router,
    platform: Platform,
    private scouterService: ScouterEndpointsService
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    this.loadTalentMarketProfile();
  }

  loadTalentMarketProfile() {
    // Get the talent ID from the passed data
    const talentId = this.getTalentId();

    if (!talentId) {
      console.error('❌ No talent ID available for fetching market profile');
      this.error = 'Unable to load talent profile: Missing talent ID';
      return;
    }

    this.loading = true;

    console.log('🔍 Fetching market profile for talent:', talentId);

    this.scouterService.fetchTalentMarketProfile(talentId).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ Market profile fetched:', response);
        this.processMarketProfile(response);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message || 'Failed to load talent profile';
        console.error('❌ Error loading market profile:', err);

        // Fallback to existing data if API fails
        this.setupFallbackData();
      }
    });
  }

  // Helper method to extract talent ID from various possible locations
  private getTalentId(): string | null {
    // Check multiple possible locations for talent ID
    const possibleIdLocations = [
      this.hire?._raw?.talentId,      // From mapped talent data
      this.talentData?._raw?.talentId, // From original talent data
      this.hire?.talentId,            // Direct talentId field
      this.talentData?.talentId,      // Direct talentId field
      this.hire?.id,                  // ID field (might be talent ID)
      this.talentData?.id             // ID field (might be talent ID)
    ];

    // Return the first non-null/undefined value
    const talentId = possibleIdLocations.find(id => id);

    console.log('🔍 Looking for talent ID in:', {
      hire: this.hire,
      talentData: this.talentData,
      possibleIds: possibleIdLocations,
      foundId: talentId
    });

    return talentId || null;
  }

  private processMarketProfile(response: any) {
    this.marketProfile = response;

    // Parse skill sets from API response
    if (response.details?.skillSets) {
      this.skillSet = this.parseSkillSets(response.details.skillSets);
    }

    // Parse market reviews
    if (response.details?.marketReviews) {
      this.marketReviews = this.parseJsonField(response.details.marketReviews);
    }

    // Parse pictorial documentation
    if (response.details?.pictorialDocumentations) {
      this.pictorialDocumentations = this.parseJsonField(response.details.pictorialDocumentations);
    }

    // Parse metadata if available
    if (response.metaData) {
      try {
        this.metaData = this.scouterService.decodeTalentMetaData(response.metaData);
      } catch (error) {
        console.warn('⚠️ Error decoding metadata:', error);
      }
    }
  }

  private parseSkillSets(skillSetsData: any): any[] {
    try {
      let skillSets: any[] = [];

      // If skillSets is a string, parse it
      if (typeof skillSetsData === 'string') {
        skillSets = JSON.parse(skillSetsData);
      } else if (Array.isArray(skillSetsData)) {
        skillSets = skillSetsData;
      }

      // Map API skill format to your component's expected format
      return skillSets.map((skill: any) => ({
        jobTitle: skill.skill || skill.jobTitle || skill.name || 'Unknown Skill',
        skillLevel: skill.skillLevel || skill.level || skill.experienceLevel || 'Intermediate',
        amount: this.parsePrice(skill.pricing || skill.amount || skill.hourlyRate),
        pricing: skill.pricing, // Keep original pricing string
        description: skill.description || '',
        _raw: skill
      }));
    } catch (error) {
      console.warn('⚠️ Error parsing skill sets:', error);
      return [];
    }
  }

  private parseJsonField(fieldData: any): any[] {
    try {
      if (typeof fieldData === 'string') {
        return JSON.parse(fieldData);
      } else if (Array.isArray(fieldData)) {
        return fieldData;
      }
      return [];
    } catch (error) {
      console.warn('⚠️ Error parsing JSON field:', error);
      return [];
    }
  }

  private parsePrice(priceString: any): number {
    if (!priceString) return 0;

    try {
      // Convert to string if it's not already
      const str = String(priceString);

      // Remove commas and any non-numeric characters except decimal point
      const numericString = str.replace(/[^\d.]/g, '');
      const price = parseFloat(numericString);

      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.warn('⚠️ Error parsing price:', priceString);
      return 0;
    }
  }

  private setupFallbackData() {
    // Use existing hire data if API fails
    if (this.hire?.skillSet && Array.isArray(this.hire.skillSet)) {
      this.skillSet = this.hire.skillSet;
    } else if (this.talentData?.skillSets) {
      // Try to parse skillSets from original talent data
      this.skillSet = this.parseSkillSets(this.talentData.skillSets);
    }
  }

  // In ViewAllTalentsPopupModalComponent class
  handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = 'assets/images/default-avatar.png';
  }

  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills;
  }

  get hasSelectedSkill(): boolean {
    return this.selectedSkills.length > 0;
  }

  get fullName(): string {
    return this.marketProfile?.details?.fullName ||
      this.hire?.name ||
      this.talentData?.fullName ||
      'Unknown Talent';
  }

  get location(): string {
    return this.marketProfile?.details?.location ||
      this.hire?.location ||
      this.talentData?.address ||
      'Unknown Location';
  }

  get valueProposition(): string {
    return this.marketProfile?.details?.valueProposition ||
      this.hire?.aboutTalent ||
      this.talentData?.bio ||
      'No description available';
  }

  get profilePic(): string {
    return this.marketProfile?.details?.talentProfilePic ||
      this.hire?.profilePic ||
      this.talentData?.talentPicture ||
      'assets/images/default-avatar.png';
  }

  // Calculate average rating from market reviews
  get averageRating(): number {
    if (!this.marketReviews || this.marketReviews.length === 0) return 4; // Default

    const total = this.marketReviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return Math.round(total / this.marketReviews.length);
  }

  hireTalent() {
    const talentId = this.getTalentId();

    this.modalCtrl.dismiss({
      selectedSkills: this.selectedSkills,
      talentId: talentId,
      talentName: this.fullName,
      marketProfile: this.marketProfile
    }).then(() => {
      this.router.navigate(
        [
          '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location/conclude-hiring',
        ],
        {
          state: {
            hire: this.hire,
            selectedSkills: this.selectedSkills,
            talentData: this.talentData,
            marketProfile: this.marketProfile,
            talentId: talentId
          },
        }
      );
    });
  }
}