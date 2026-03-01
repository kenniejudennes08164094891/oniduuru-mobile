import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { OverlayCleanupService } from 'src/app/services/overlay-cleanup.service';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
  standalone: false,
})
export class ViewAllTalentsPopupModalComponent
  extends BaseModal
  implements OnInit
{
  @Input() hire: any;
  @Input() talentData: any;

  selectedSkills: any[] = [];
  loading: boolean = false;
  error: string = '';

  marketProfile: any = null;
  skillSet: any[] = [];
  marketReviews: any[] = [];
  pictorialDocumentations: any[] = [];
  metaData: any = null;

  // Add a default rating constant
  readonly DEFAULT_RATING = 5;

  constructor(
    modalCtrl: ModalController,
    private router: Router,
    platform: Platform,
    private scouterService: ScouterEndpointsService,
    protected override overlayCleanup: OverlayCleanupService,
  ) {
    super(modalCtrl, platform, overlayCleanup);
  }

  override ngOnInit() {
    this.loadTalentMarketProfile();
  }

  loadTalentMarketProfile() {
    const talentId = this.getTalentId();

    if (!talentId) {
      console.error('❌ No talent ID available for fetching market profile');
      this.error = 'Unable to load talent profile: Missing talent ID';
      return;
    }

    this.loading = true;
    this.error = '';

    console.log('🔍 Fetching market profile for talent:', talentId);

    this.scouterService.fetchTalentMarketProfile(talentId).subscribe({
      next: (response) => {
        this.loading = false;
        console.log('✅ Market profile fetched:', response);
        this.processMarketProfile(response);
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err.message || 'Failed to load talent profile. Please try again.';
        console.error('❌ Error loading market profile:', err);

        this.marketProfile = null;
        this.skillSet = [];
        this.marketReviews = [];
        this.pictorialDocumentations = [];
      },
    });
  }

  private getTalentId(): string | null {
    const possibleIdLocations = [
      this.hire?._raw?.talentId,
      this.talentData?._raw?.talentId,
      this.hire?.talentId,
      this.talentData?.talentId,
      this.hire?.id,
      this.talentData?.id,
    ];

    return possibleIdLocations.find((id) => id) || null;
  }

  private processMarketProfile(response: any) {
    this.marketProfile = response;

    if (response.details?.skillSets) {
      this.skillSet = this.parseSkillSets(response.details.skillSets);
    }

    if (response.details?.marketReviews) {
      this.marketReviews = this.parseJsonField(response.details.marketReviews);
    }

    if (response.details?.pictorialDocumentations) {
      this.pictorialDocumentations = this.parseJsonField(
        response.details.pictorialDocumentations,
      );
    }

    if (response.metaData) {
      try {
        this.metaData = this.scouterService.decodeTalentMetaData(
          response.metaData,
        );
      } catch (error) {
        console.warn('⚠️ Error decoding metadata:', error);
      }
    }
  }

  private parseSkillSets(skillSetsData: any): any[] {
    try {
      let skillSets: any[] = [];

      if (typeof skillSetsData === 'string') {
        skillSets = JSON.parse(skillSetsData);
      } else if (Array.isArray(skillSetsData)) {
        skillSets = skillSetsData;
      }

      return skillSets
        .filter(
          (skill) => skill && (skill.skill || skill.jobTitle || skill.name),
        )
        .map((skill: any) => ({
          jobTitle:
            skill.skill || skill.jobTitle || skill.name || 'Unknown Skill',
          skillLevel:
            skill.skillLevel || skill.level || skill.experienceLevel || '',
          amount: this.parsePrice(
            skill.pricing || skill.amount || skill.hourlyRate,
          ),
          pricing: skill.pricing,
          description: skill.description || '',
          _raw: skill,
        }));
    } catch (error) {
      console.warn('⚠️ Error parsing skill sets:', error);
      return [];
    }
  }

  private parseJsonField(fieldData: any): any[] {
    try {
      if (typeof fieldData === 'string') {
        const parsed = JSON.parse(fieldData);
        return Array.isArray(parsed) ? parsed.filter((item) => item) : [];
      } else if (Array.isArray(fieldData)) {
        return fieldData.filter((item) => item);
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
      const str = String(priceString);
      const numericString = str.replace(/[^\d.]/g, '');
      const price = parseFloat(numericString);
      return isNaN(price) ? 0 : price;
    } catch (error) {
      console.warn('⚠️ Error parsing price:', priceString);
      return 0;
    }
  }

 async closeModal() {
   await this.modalCtrl.dismiss();
  }

  get hasTalentData(): boolean {
    return !!this.marketProfile || !!this.hire || !!this.talentData;
  }

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
    return (
      this.marketProfile?.details?.fullName ||
      this.hire?.name ||
      this.talentData?.fullName ||
      'Talent'
    );
  }

  get location(): string {
    return (
      this.marketProfile?.details?.location ||
      this.hire?.location ||
      this.talentData?.address ||
      'Location not specified'
    );
  }

  get valueProposition(): string {
    const valueProp =
      this.marketProfile?.details?.valueProposition ||
      this.hire?.aboutTalent ||
      this.talentData?.bio;

    return valueProp || 'No description available yet.';
  }

  get profilePic(): string {
    return (
      this.marketProfile?.details?.talentProfilePic ||
      this.hire?.profilePic ||
      this.talentData?.talentPicture ||
      'assets/images/default-avatar.png'
    );
  }

  // Updated to return DEFAULT_RATING (5 stars) when no reviews exist
  get averageRating(): number {
    if (!this.marketReviews || this.marketReviews.length === 0) {
      return this.DEFAULT_RATING; // Default to 5 stars
    }

    const validReviews = this.marketReviews.filter((review) => review.rating);
    if (validReviews.length === 0) {
      return this.DEFAULT_RATING; // Default to 5 stars if reviews exist but no ratings
    }

    const total = validReviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round(total / validReviews.length);
  }

  // Helper method to get display rating (for template use)
  get displayRating(): number {
    return this.averageRating;
  }

  // Helper method to check if we should show default rating
  get isDefaultRating(): boolean {
    return (
      !this.marketReviews ||
      this.marketReviews.length === 0 ||
      this.marketReviews.filter((review) => review.rating).length === 0
    );
  }

  hireTalent() {
    const talentId = this.getTalentId();

    this.modalCtrl
      .dismiss({
        selectedSkills: this.selectedSkills,
        talentId: talentId,
        talentName: this.fullName,
        marketProfile: this.marketProfile,
      })
      .then(() => {
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
              talentId: talentId,
            },
          },
        );
      });
  }
}
