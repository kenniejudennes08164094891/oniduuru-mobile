import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { EvaluationPageComponent } from 'src/app/components/evaluation-page/evaluation-page.component';
import {
  ModalController,
  ToastController,
  AlertController,
} from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';
import { StatsComponent } from './stats/stats.component';
import { AcceptOrRejectComponent } from './accept-or-reject/accept-or-reject.component';

export interface SatisfactoryComment {
  talentId?: string;
  scouterId?: string;
  dateOfComment: string;
  remark: string;
  rating: number;
}

export interface HireData {
  id: string;
  name?: string;
  scouterName?: string;
  email?: string;
  scouterEmail?: string;
  status?: string;
  offerStatus?: string;
  hireStatus?: string;
  date?: string;
  dateOfHire?: string;
  startDate?: string;
  amount?: number;
  amountToPay?: string | number;
  jobDescription?: string;
  profilePic?: string;
  isRated?: boolean;
  rating?: number;
  talentRating?: number;
  yourRating?: number;
  comment?: string;
  talentComment?: string;
  yourComment?: string;
  originalData?: any;
  scouterId?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  satisFactoryCommentByTalent?: SatisfactoryComment | string | any;
  satisFactoryCommentByScouter?: SatisfactoryComment | string | any;
  talentId?: string;
  talentName?: string;
  talentEmail?: string;
  scouterPicture?: string;
  talentPicture?: string;
  scouterPhoneNumber?: string;
  marketHireId?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-market-price-preposition',
  templateUrl: './market-price-preposition.page.html',
  styleUrls: ['./market-price-preposition.page.scss'],
})
export class MarketPricePrepositionPage implements OnInit {
  @ViewChild(StatsComponent) statsComponent!: StatsComponent;

  hire: HireData | null = null;
  images = imageIcons;
  userName: string = 'User';
  scouterName: string = 'Scouter';
  headerHidden: boolean = false;
  rating: number = 0;
  marketItems: any[] = [];

  talentId: string = '';
  hiresData: any[] = [];
  currentView: 'details' | 'engagements' | 'stats' = 'details'; // Track current view

  selectedScouter: any = null;
  allHires: any[] = [];
  scouterHires: any[] = []; // Hires from the selected scouter

  constructor(
    private route: ActivatedRoute,
    private endpointService: EndpointService,
    private router: Router,
    private authService: AuthService,
    private toast: ToastsService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {}

  

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Route ID:', id);

    // Get talent ID from storage
    this.talentId =
      localStorage.getItem('talentId') ||
      sessionStorage.getItem('talentId') ||
      '';

    // Get the hire data from navigation state
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;

    if (state && state['hire']) {
      this.hire = state['hire'] as HireData;

      // ✅ ALWAYS set selected scouter from hire data
      if (state['scouterId'] || this.hire.scouterId) {
        const scouterId = state['scouterId'] || this.hire.scouterId;
        const scouterName =
          this.hire.scouterName || this.hire.name || 'Scouter';

        this.selectedScouter = {
          id: scouterId,
          name: scouterName,
          email: this.hire.scouterEmail || this.hire.email || '',
          profilePic: this.hire.scouterPicture || this.hire.profilePic,
          selectedAt: new Date().toISOString(),
        };

        console.log(
          '✅ Set scouter from navigation state:',
          this.selectedScouter,
        );
      }

      this.extractScouterName();

      // ✅ Check if we should navigate to stats tab
      if (state['openStats']) {
        this.currentView = 'stats';
        console.log('✅ Opening stats tab by request');
      }
    } else {
      // Try to recover from URL or localStorage
      if (id) {
        this.fetchHireById(id);
      }
    }

    this.loadTalentName();
  }

  // Initialize data on page load
  initializeData() {
    // Try to get selected scouter from sessionStorage
    const storedScouter = sessionStorage.getItem('selectedScouter');
    if (storedScouter) {
      this.selectedScouter = JSON.parse(storedScouter);
      this.scouterName = this.selectedScouter.name;
    }

    // Get talent ID
    this.talentId =
      localStorage.getItem('talentId') ||
      sessionStorage.getItem('talentId') ||
      '';
  }

  // Helper method to ensure scouter is selected
  private ensureScouterSelection() {
    const storedScouter = sessionStorage.getItem('selectedScouter');
    if (!storedScouter && this.selectedScouter) {
      // Ensure the selected scouter is in sessionStorage
      sessionStorage.setItem(
        'selectedScouter',
        JSON.stringify(this.selectedScouter),
      );
    }

    // Ensure scouterId is in sessionStorage
    if (this.selectedScouter?.id) {
      sessionStorage.setItem('scouterId', this.selectedScouter.id);
    }
  }

  ngAfterViewInit() {
    // ✅ If we're on stats tab and have a scouter, load stats
    if (this.currentView === 'stats' && this.selectedScouter) {
      console.log(
        '✅ Loading stats in ngAfterViewInit with scouter:',
        this.selectedScouter,
      );

      // Small delay to ensure the component is fully initialized
      setTimeout(() => {
        if (this.statsComponent) {
          this.statsComponent.loadStatsData();
        } else {
          console.warn('⚠️ Stats component not yet available');
          // Try again after a bit more time
          setTimeout(() => {
            if (this.statsComponent) {
              this.statsComponent.loadStatsData();
            }
          }, 200);
        }
      }, 100);
    }
  }

  switchToStatsTab() {
    this.currentView = 'stats';
    console.log('✅ Switching to stats tab');

    // ✅ If we have a selected scouter, load stats
    if (this.selectedScouter && this.selectedScouter.id) {
      console.log('✅ Using selected scouter for stats:', this.selectedScouter);

      setTimeout(() => {
        if (this.statsComponent) {
          this.statsComponent.loadStatsData();
        }
      }, 50);
    } else {
      // Try to extract scouter from the current hire using multiple possible keys
      const hireAny: any = this.hire as any;
      const scouterId =
        hireAny?.scouterId || hireAny?.formattedScouterId || hireAny?.scouter?.id || hireAny?.originalData?.scouterId || hireAny?.simpleId;

      if (this.hire && scouterId) {
        this.selectedScouter = {
          id: scouterId,
          name:
            this.hire.scouterName || this.hire.name || this.hire.firstName || 'Scouter',
          email: this.hire.scouterEmail || this.hire.email || '',
          profilePic: this.hire.scouterPicture || this.hire.profilePic || null,
          selectedAt: new Date().toISOString(),
        };

        console.log('✅ Extracted scouter from hire (fallback keys):', this.selectedScouter);

        setTimeout(() => {
          if (this.statsComponent) {
            this.statsComponent.loadStatsData();
          }
        }, 50);
      } else {
        this.toast.openSnackBar('No scouter information available for this hire', 'warning');
      }
    }
  }

  switchToDetailsTab() {
    this.currentView = 'details';
    console.log('✅ Switching to details tab');
  }

  async onHireSelected(hire: any) {
    console.log('Hire selected from table:', hire);

    // Update the current hire
    this.hire = hire;

    // ✅ Extract scouter information with all fallbacks
    const scouterId = hire.formattedScouterId || hire.scouterId;
    const scouterName = hire.scouterName || hire.name || 'Scouter';
    const scouterEmail = hire.scouterEmail || hire.email || '';
    const scouterProfilePic =
      hire.scouterPicture ||
      hire.profilePic ||
      'assets/images/default-avatar.png';

    // Set the selected scouter
    this.selectedScouter = {
      id: scouterId,
      simpleId: hire.scouterId,
      name: scouterName,
      email: scouterEmail,
      profilePic: scouterProfilePic,
      selectedAt: new Date().toISOString(),
    };

    console.log('✅ Updated selected scouter:', this.selectedScouter);
    this.extractScouterName();

    // Check which modal should open based on hire flags
    if (hire.shouldShowAcceptRejectModal) {
      await this.openAcceptRejectModal(hire);
    } else if (hire.shouldShowEvaluationModal) {
      await this.openEvaluation(hire);
    }

    // If we're on the stats tab, refresh stats with the new scouter
    if (this.currentView === 'stats' && this.statsComponent) {
      setTimeout(() => {
        this.statsComponent.loadStatsData();
      }, 100);
    }
  }

  // Add method to get scouter statistics
  getScouterStats() {
    if (!this.selectedScouter) return null;

    // Get all hires from localStorage (loaded by HiresTableComponent)
    const storedHires = localStorage.getItem('allMarketRecords');
    if (!storedHires) return null;

    try {
      const allHires = JSON.parse(storedHires);

      // Filter hires for this scouter
      const scouterHires = allHires.filter(
        (hire: any) => hire.scouterId === this.selectedScouter.id,
      );

      if (scouterHires.length === 0) return null;

      const stats = {
        totalHires: scouterHires.length,
        acceptedHires: scouterHires.filter(
          (h: any) => h.status === 'Offers Accepted',
        ).length,
        pendingHires: scouterHires.filter(
          (h: any) => h.status === 'Awaiting Acceptance',
        ).length,
        declinedHires: scouterHires.filter(
          (h: any) => h.status === 'Offers Declined',
        ).length,
        totalAmount: scouterHires.reduce(
          (sum: number, hire: any) => sum + (hire.amount || 0),
          0,
        ),
        averageRating: this.calculateAverageRating(scouterHires),
      };

      return stats;
    } catch (error) {
      console.error('Error calculating scouter stats:', error);
      return null;
    }
  }

  calculateAverageRating(hires: any[]): number {
    const ratedHires = hires.filter((h) => h.talentRating > 0);
    if (ratedHires.length === 0) return 0;

    const totalRating = ratedHires.reduce(
      (sum, hire) => sum + (hire.talentRating || 0),
      0,
    );
    return Math.round((totalRating / ratedHires.length) * 10) / 10; // Round to 1 decimal
  }

  // Transform API data for the table (similar to HiresTableComponent)
  transformApiDataToHireFormat(apiData: any[]): any[] {
    return apiData.map((item) => {
      // Determine profile picture
      let profilePic = 'assets/images/portrait-man-cartoon-style.jpg'; // Default
      if (item.scouterPicture) {
        profilePic = item.scouterPicture;
      } else if (item.talentPicture) {
        profilePic = item.talentPicture;
      }

      // Determine name - prioritize scouter name, then talent name
      let name = item.scouterName || item.talentName || 'Unknown';
      if (item.firstName && item.lastName) {
        name = `${item.firstName} ${item.lastName}`;
      } else if (item.fullName) {
        name = item.fullName;
      }

      // Determine email
      let email =
        item.scouterEmail || item.talentEmail || item.email || 'No email';

      // Determine status - map from API status to display status
      let status = this.mapApiStatusToDisplayStatus(
        item.offerStatus || item.hireStatus || item.status,
      );

      // Determine amount - ensure it's properly converted
      let amount = 0;
      const amountValue = item.amount || item.amountToPay || 0;

      // Convert to number safely
      if (typeof amountValue === 'string') {
        // Remove any non-numeric characters except dots and commas
        const cleanString = amountValue.replace(/[^\d.-]/g, '');
        amount = parseFloat(cleanString) || 0;
      } else if (typeof amountValue === 'number') {
        amount = amountValue;
      }

      // If amount is less than 1000, it might be in thousands (like 450 for 450,000)
      // Check if this could be the case
      if (amount > 0 && amount < 1000) {
        // Assuming the amount might be in hundreds but should be thousands
        // For example: 450 should be 450,000
        amount = amount * 1000;
      }

      // Ensure marketHireId is included
      const marketHireId = item.marketHireId || item.id;

      return {
        id: item.id || marketHireId || this.generateRandomId(),
        marketHireId: marketHireId, // Include marketHireId
        name: name,
        email: email,
        status: status,
        date:
          item.date ||
          item.dateOfHire ||
          item.createdAt ||
          new Date().toISOString(),
        startDate: item.startDate || 'Not set',
        amount: amount,
        amountToPay: String(amount), // Keep as string for API

        // Additional fields for detail page
        scouterName: item.scouterName,
        scouterEmail: item.scouterEmail,
        scouterId: item.scouterId,
        talentName: item.talentName,
        talentEmail: item.talentEmail,
        talentId: item.talentId,
        jobDescription: item.jobDescription || '',
        offerStatus: item.offerStatus,
        hireStatus: item.hireStatus,
        satisFactoryCommentByTalent: item.satisFactoryCommentByTalent,
        satisFactoryCommentByScouter: item.satisFactoryCommentByScouter,
        talentRating: item.talentRating,
        yourRating: item.yourRating,
        talentComment: item.talentComment,
        yourComment: item.yourComment,
        isRated: item.isRated,
        scouterPicture: item.scouterPicture,
        talentPicture: item.talentPicture,
        firstName: item.firstName,
        lastName: item.lastName,
        fullName: item.fullName,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
  }

  // Add to your market-price-preposition.page.ts
  private getUserProfileDatePart(): string {
    try {
      // Try to get from localStorage first
      const savedProfile = localStorage.getItem('talentProfile');
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);

        // Check for createdAt or registration date
        const dateStr =
          parsedProfile.createdAt ||
          parsedProfile.registrationDate ||
          parsedProfile.created_at;
        if (dateStr) {
          const date = new Date(dateStr);
          const day = date.getDate();
          const month = date.toLocaleString('default', { month: 'long' });
          const year = date.getFullYear();
          return `${day}${month}${year}`;
        }
      }

      // Try from auth service
      const talentDetails = this.authService.decodeTalentDetails();
      if (talentDetails?.createdAt) {
        const date = new Date(talentDetails.createdAt);
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${day}${month}${year}`;
      }
    } catch (error) {
      console.error('Error getting user profile date:', error);
    }

    // Default fallback (you should update this)
    return '29September2025';
  }

  mapApiStatusToDisplayStatus(apiStatus: string): string {
    if (!apiStatus) return 'Unknown';

    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Offers Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-rejected': 'Offers Declined',
      'offer-declined': 'Offers Declined',
      'Offers Accepted': 'Offers Accepted',
      'Awaiting Acceptance': 'Awaiting Acceptance',
      'Offers Declined': 'Offers Declined',
    };

    return statusMap[apiStatus] || apiStatus;
  }

  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Extract scouter name from hire data with multiple fallbacks
   */
  private extractScouterName(): void {
    if (!this.hire) {
      this.scouterName = 'Scouter';
      return;
    }

    // Try multiple possible properties for scouter name
    this.scouterName =
      this.hire.scouterName ||
      this.hire.name ||
      this.hire.fullName ||
      this.getCombinedName() ||
      'Scouter';

    console.log('Extracted scouter name:', this.scouterName);
  }

  /**
   * Combine firstName and lastName if available
   */
  private getCombinedName(): string | null {
    if (this.hire?.firstName && this.hire?.lastName) {
      return `${this.hire.firstName} ${this.hire.lastName}`;
    } else if (this.hire?.firstName) {
      return this.hire.firstName;
    } else if (this.hire?.lastName) {
      return this.hire.lastName;
    }
    return null;
  }

  /**
   * Get display name for the template
   */
  getScouterDisplayName(): string {
    if (this.scouterName && this.scouterName !== 'Scouter') {
      return this.scouterName;
    }
    return 'Your Scouter';
  }

  private fetchHireById(hireId: string | null): void {
    if (!hireId) return;

    const talentId =
      localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.error('No talent ID found');
      return;
    }

    console.log('Trying to fetch hire by ID:', hireId);

    // Check if we have market records in localStorage from view-hires
    const storedRecords = localStorage.getItem('marketRecords');
    if (storedRecords) {
      try {
        const records = JSON.parse(storedRecords);
        const foundHire = records.find(
          (record: any) => String(record.id) === String(hireId),
        );
        if (foundHire) {
          this.hire = foundHire as HireData;
          this.extractScouterName();
          console.log('Found hire in localStorage:', this.hire);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored records:', error);
      }
    }

    // Fallback to mock data
    const mockHire = MockRecentHires.find(
      (h) => String(h.id) === String(hireId),
    );
    if (mockHire) {
      this.hire = this.convertMockPaymentToHireData(mockHire);
      this.extractScouterName();
      console.log('Found hire in MockRecentHires:', this.hire);
    }
  }

  private convertMockPaymentToHireData(mock: MockPayment): HireData {
    const hireData: HireData = {
      id: mock.id,
      scouterName: mock.scouterName,
      name: mock.scouterName,
      scouterEmail: mock.email,
      email: mock.email,
      offerStatus: mock.offerStatus,
      date: mock.date,
      startDate: mock.startDate,
      amount: mock.amount,
      jobDescription: mock.jobDescription,
      talentRating: mock.talentRating,
      yourRating: mock.yourRating,
      talentComment: mock.talentComment,
      yourComment: mock.yourComment,
      isRated: mock.isRated,
    };

    if (mock.scouterName && mock.scouterName.includes(' ')) {
      const nameParts = mock.scouterName.split(' ');
      hireData.firstName = nameParts[0];
      hireData.lastName = nameParts.slice(1).join(' ');
      hireData.fullName = mock.scouterName;
    } else {
      hireData.firstName = mock.scouterName;
      hireData.fullName = mock.scouterName;
    }

    return hireData;
  }

  /**
   * Parse satisfactory comment from API response - SIMPLIFIED FIXED VERSION
   */
  private parseSatisfactoryComment(comment: any): SatisfactoryComment | null {
    if (!comment) {
      console.log('Comment is null or undefined');
      return null;
    }

    console.log('RAW COMMENT TO PARSE:', comment);
    console.log('Type of comment:', typeof comment);

    try {
      // CASE 1: It's already a parsed object (from state navigation)
      if (typeof comment === 'object' && comment !== null) {
        // Check if it has the structure we need
        if (comment.remark !== undefined || comment.rating !== undefined) {
          console.log('Already a SatisfactoryComment object');
          return {
            talentId: comment.talentId,
            scouterId: comment.scouterId,
            dateOfComment: comment.dateOfComment || '',
            remark: comment.remark || '',
            rating: Number(comment.rating) || 0,
          };
        }

        // Check if it's empty
        if (Object.keys(comment).length === 0) {
          return null;
        }
      }

      // CASE 2: It's a string - could be JSON string or empty
      if (typeof comment === 'string') {
        console.log('Comment is string:', comment.substring(0, 100));

        // Check for empty/undefined strings
        if (
          comment.trim() === '' ||
          comment === 'undefined' ||
          comment === 'null' ||
          comment === '""'
        ) {
          return null;
        }

        // Try to parse as JSON
        try {
          const parsed = JSON.parse(comment);
          console.log('Successfully parsed JSON string');

          return {
            talentId: parsed.talentId,
            scouterId: parsed.scouterId,
            dateOfComment: parsed.dateOfComment || '',
            remark: parsed.remark || parsed.comment || '',
            rating: Number(parsed.rating) || 0,
          };
        } catch (jsonError) {
          console.log(
            'Not JSON, treating as plain text:',
            comment.substring(0, 50),
          );

          // If it's not JSON but has content, create a basic object
          return {
            dateOfComment: new Date().toISOString(),
            remark: comment,
            rating: 0,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing satisfactory comment:', error);
      return null;
    }
  }

  /**
   * Check if talent has commented
   */
  hasTalentComment(): boolean {
    if (!this.hire) {
      console.log('No hire data');
      return false;
    }

    console.log('Checking talent comment:', {
      rawComment: this.hire.satisFactoryCommentByTalent,
      hireId: this.hire.id,
    });

    const talentComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByTalent,
    );
    const hasComment =
      !!talentComment &&
      !!talentComment.remark &&
      talentComment.remark.trim() !== '';

    console.log('Talent has comment?', hasComment);
    return hasComment;
  }

  /**
   * Get talent comment
   */
  getTalentComment(): string {
    if (!this.hire) return '';

    const talentComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByTalent,
    );
    const comment = talentComment?.remark || this.hire.talentComment || '';

    console.log('Getting talent comment:', {
      parsedComment: talentComment,
      result: comment,
    });

    return comment;
  }

  /**
   * Get talent comment date
   */
  getTalentCommentDate(): Date | null {
    if (!this.hire) return null;

    const talentComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByTalent,
    );
    if (!talentComment || !talentComment.dateOfComment) return null;

    try {
      return new Date(talentComment.dateOfComment);
    } catch (e) {
      console.error('Error parsing talent comment date:', e);
      return null;
    }
  }

  /**
   * Get talent rating
   */
  getTalentRating(): number {
    if (!this.hire) return 0;

    const talentComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByTalent,
    );
    const rating = talentComment?.rating || this.hire.talentRating || 0;

    console.log('Getting talent rating:', {
      rawComment: this.hire.satisFactoryCommentByTalent,
      parsedComment: talentComment,
      rating: rating,
    });

    return rating;
  }

  /**
   * Check if scouter has commented
   */
  hasScouterComment(): boolean {
    if (!this.hire) {
      console.log('No hire data');
      return false;
    }

    console.log('Checking scouter comment:', {
      rawComment: this.hire.satisFactoryCommentByScouter,
      hireId: this.hire.id,
    });

    const scouterComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByScouter,
    );
    const hasComment =
      !!scouterComment &&
      !!scouterComment.remark &&
      scouterComment.remark.trim() !== '';

    console.log('Scouter has comment?', hasComment);
    return hasComment;
  }

  /**
   * Get scouter comment
   */
  getScouterComment(): string {
    if (!this.hire) return '';

    const scouterComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByScouter,
    );
    const comment = scouterComment?.remark || this.hire.yourComment || '';

    console.log('Getting scouter comment:', {
      parsedComment: scouterComment,
      result: comment,
    });

    return comment;
  }

  /**
   * Get scouter comment date
   */
  getScouterCommentDate(): Date | null {
    if (!this.hire) return null;

    const scouterComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByScouter,
    );
    if (!scouterComment || !scouterComment.dateOfComment) return null;

    try {
      return new Date(scouterComment.dateOfComment);
    } catch (e) {
      console.error('Error parsing scouter comment date:', e);
      return null;
    }
  }

  /**
   * Get scouter rating
   */
  getScouterRating(): number {
    if (!this.hire) return 0;

    const scouterComment = this.parseSatisfactoryComment(
      this.hire.satisFactoryCommentByScouter,
    );
    const rating = scouterComment?.rating || this.hire.yourRating || 0;

    console.log('Getting scouter rating:', {
      rawComment: this.hire.satisFactoryCommentByScouter,
      parsedComment: scouterComment,
      rating: rating,
    });

    return rating;
  }

  /**
   * Format hire status for display
   */
  formatHireStatus(status: string | undefined): string {
    if (!status) return 'Unknown';

    const statusMap: { [key: string]: string } = {
      'offer-accepted': 'Offer Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-rejected': 'Offer Rejected',
      'offer-declined': 'Offer Declined',
      pending: 'Pending',
      'Offers Accepted': 'Offer Accepted',
      'Awaiting Acceptance': 'Awaiting Acceptance',
      'Offers Declined': 'Offer Declined',
      'Offer Accepted': 'Offer Accepted',
      'Offer Rejected': 'Offer Rejected',
    };

    const formatted =
      statusMap[status] ||
      status.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return formatted;
  }

  async handleTransactionFlow() {
    if (!this.hire) return;

    try {
      const statusMap: {
        [key: string]:
          | 'Offer Accepted'
          | 'Awaiting Acceptance'
          | 'Offer Rejected';
      } = {
        'Offers Accepted': 'Offer Accepted',
        'Awaiting Acceptance': 'Awaiting Acceptance',
        'Offers Declined': 'Offer Rejected',
        'offer-accepted': 'Offer Accepted',
        'awaiting-acceptance': 'Awaiting Acceptance',
        'offer-rejected': 'Offer Rejected',
        'offer-declined': 'Offer Rejected',
      };

      const currentStatus =
        this.hire.offerStatus || this.hire.hireStatus || this.hire.status;

      if (currentStatus && statusMap[currentStatus]) {
        this.hire.offerStatus = statusMap[currentStatus];
      }

      const status =
        this.hire.offerStatus || this.hire.hireStatus || this.hire.status || '';

      // switch (status) {
      //   case 'Offer Accepted':
      //   case 'offer-accepted':
      //   case 'Offers Accepted':
      //     await this.openEvaluation(this.hire);
      //     break;

      //   case 'Awaiting Acceptance':
      //   case 'awaiting-acceptance':
      //     await this.openAcceptRejectModal(this.hire);
      //     break;

      //   case 'Offer Rejected':
      //   case 'offer-rejected':
      //   case 'offer-declined':
      //   case 'Offers Declined':
      //     // Show message if offer was declined
      //     if (status.includes('Declined') || status.includes('Rejected')) {
      //       this.toast.openSnackBar(
      //         `You previously declined this offer from ${this.getScouterDisplayName()}`,
      //         'info',
      //       );
      //     }
      //     break;

      //   default:
      //     console.log('Unknown status:', status);
      // }
    } catch (error) {
      console.error('Error in handleTransactionFlow:', error);
    }
  }

  getFormattedDateTime(
    dateStr: string | undefined,
  ): { date: string; time: string } | null {
    if (!dateStr) return null;

    try {
      const dateObj = new Date(dateStr);
      const optionsDate: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      };
      const optionsTime: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const formattedDate = dateObj.toLocaleDateString('en-US', optionsDate);
      const formattedTime = dateObj.toLocaleTimeString('en-US', optionsTime);

      return { date: formattedDate, time: formattedTime };
    } catch (e) {
      console.error('Error formatting date:', e);
      return null;
    }
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
    const talentId =
      localStorage.getItem('talentId') || sessionStorage.getItem('talentId');
    if (!talentId) {
      console.error('Talent ID not found in storage.');
      return;
    }

    const navState: any = history && history.state ? history.state : {};
    const scouterIdFromState = navState?.scouterId || navState?.hire?.scouterId;
    const scouterId = scouterIdFromState || this.hire?.scouterId || '';

    sessionStorage.setItem('talentId', talentId);
    if (scouterId) {
      sessionStorage.setItem('scouterId', scouterId);
    }

    const hireId = this.route.snapshot.paramMap.get('id');

    // If we don't have a hire yet, fetch it directly
    if (!this.hire && hireId) {
      this.fetchSpecificHire(talentId, hireId, scouterId);
    } else {
      // Otherwise, fetch all markets (for the table)
      this.fetchAllMarkets(talentId, scouterId);
    }
  }

  /**
   * Fetch a specific hire by ID
   */
  private fetchSpecificHire(
    talentId: string,
    hireId: string,
    scouterId: string,
  ): void {
    console.log('Fetching specific hire:', { talentId, hireId, scouterId });

    // Use a larger limit to ensure we find the hire
    const paginationParams = { limit: 10, pageNo: 1 };

    this.endpointService
      .fetchMarketsByTalent(talentId, paginationParams, '', scouterId)
      .subscribe({
        next: (res: any) => {
          console.log('Specific hire API Response:', res);
          const decoded = this.base64JsonDecode<any[]>(res?.details) || [];

          // Find the specific hire by ID
          const foundHire = decoded.find(
            (item: any) =>
              String(item.id) === String(hireId) ||
              String(item.marketHireId) === String(hireId),
          );

          if (foundHire) {
            this.hire = foundHire as HireData;
            this.extractScouterName();
            console.log('✅ Found specific hire in API response:', this.hire);

            // Log comment data for debugging
            console.log('🔍 Hire comment data:', {
              satisFactoryCommentByTalent:
                this.hire.satisFactoryCommentByTalent,
              satisFactoryCommentByScouter:
                this.hire.satisFactoryCommentByScouter,
              talentRating: this.getTalentRating(),
              scouterRating: this.getScouterRating(),
              talentComment: this.getTalentComment(),
              scouterComment: this.getScouterComment(),
            });
          } else {
            console.error('❌ Hire not found in API response for ID:', hireId);
            console.log(
              'Available hires:',
              decoded.map((h: any) => ({
                id: h.id,
                marketHireId: h.marketHireId,
              })),
            );
          }

          this.marketItems = decoded;
        },
        error: (err: any) => {
          console.error('Error fetching specific hire:', err);
          this.marketItems = [];
        },
      });
  }

  async openAcceptRejectModal(hire: any) {
    if (!hire) return;

    // Get formatted date and time
    const formattedDateTime = this.getFormattedDateTime(hire.date);

    const modal = await this.modalCtrl.create({
      component: AcceptOrRejectComponent,
      componentProps: {
        scouterName: this.getScouterDisplayName(),
        hireDate: formattedDateTime?.date || 'Unknown date',
        hireTime: formattedDateTime?.time || '',
        hireData: hire, // Pass the hire data with all fields
        talentId: this.talentId, // Pass the talent ID
      },
      cssClass: 'accept-or-reject-offer',
      backdropDismiss: false, // Prevent accidental closing
      keyboardClose: false,
      showBackdrop: true,
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data && data.success) {
      // Handle successful response
      await this.handleModalResponse(data, hire);
    } else if (data && !data.success) {
      // Handle error
      console.error('Modal returned with error:', data.error);
      this.toast.openSnackBar(
        'Failed to process your request. Please try again.',
        'error',
      );
    }
  }

  private async handleModalResponse(modalData: any, hire: any) {
    const { action, newStatus, hireId, response } = modalData;

    console.log(`User ${action}ed offer for hire:`, hireId);
    console.log('API Response:', response);

    // Update the hire status using the data from the modal response
    if (modalData.hire) {
      // Use the updated hire from modal if available
      Object.assign(hire, modalData.hire);
    } else {
      // Fallback: update manually
      hire.status = newStatus;
      hire.offerStatus = newStatus;
      hire.hireStatus =
        action === 'accept' ? 'offer-accepted' : 'offer-declined';
    }

    // Show appropriate message
    const actionText = action === 'accept' ? 'accepted' : 'declined';
    const message =
      action === 'accept'
        ? `✅ Offer from ${this.getScouterDisplayName()} accepted successfully!`
        : `❌ Offer from ${this.getScouterDisplayName()} declined.`;

    const toastType = action === 'accept' ? 'success' : 'warning';

    this.toast.openSnackBar(message, toastType);

    // Update in localStorage
    this.updateHireStatusInStorage(hire, newStatus);

    // Refresh the stats if on stats tab
    if (this.currentView === 'stats' && this.statsComponent) {
      this.statsComponent.loadStatsData();
    }
  }

  // Update hire status in localStorage
  private updateHireStatusInStorage(hire: any, newStatus: string) {
    if (!hire || (!hire.id && !hire.marketHireId)) return;

    // Update in allMarketRecords
    const storedRecords = localStorage.getItem('allMarketRecords');
    if (storedRecords) {
      try {
        const records = JSON.parse(storedRecords);
        const updatedRecords = records.map((record: any) => {
          const matchesId =
            record.id === hire.id ||
            record.marketHireId === hire.id ||
            record.id === hire.marketHireId ||
            record.marketHireId === hire.marketHireId;

          if (matchesId) {
            return {
              ...record,
              status: newStatus,
              offerStatus: newStatus,
              hireStatus:
                hire.hireStatus ||
                (newStatus === 'Offers Accepted'
                  ? 'offer-accepted'
                  : 'offer-declined'),
              // Update other fields if available in the hire object
              ...(hire.amount && { amount: hire.amount }),
              ...(hire.jobDescription && {
                jobDescription: hire.jobDescription,
              }),
              ...(hire.scouterName && { scouterName: hire.scouterName }),
            };
          }
          return record;
        });
        localStorage.setItem(
          'allMarketRecords',
          JSON.stringify(updatedRecords),
        );
        console.log('Updated localStorage with new hire status:', newStatus);
      } catch (error) {
        console.error('Error updating records:', error);
      }
    }
  }

  /**
   * Fetch all markets (for the table)
   */
  private fetchAllMarkets(talentId: string, scouterId: string): void {
    const paginationParams = { limit: 10, pageNo: 1 };

    this.endpointService
      .fetchMarketsByTalent(talentId, paginationParams, '', scouterId)
      .subscribe({
        next: (res: any) => {
          const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
          this.marketItems = Array.isArray(decoded) ? decoded : [];
          console.log('Market items loaded:', this.marketItems.length);
        },
        error: (err: any) => {
          console.error('Error fetching markets:', err);
          this.marketItems = [];
        },
      });
  }

  setRating(star: number) {
    if (!this.hire) return;
    this.hire.yourRating = star;
    this.hire.talentRating = star;
  }

  setSelectedHire(hire: HireData) {
    this.hire = hire;
  }

  getFormattedAmount(amount: number | string | undefined): string {
    const safeAmount = Number(amount) || 0;
    return safeAmount.toLocaleString('en-NG', {
      style: 'currency',
      currency: 'NGN',
    });
  }

  getStatusColor(offerStatus: string | undefined): string {
    const status = offerStatus || '';
    switch (status.toLowerCase()) {
      case 'offer accepted':
      case 'offers accepted':
      case 'offer-accepted':
        return '#189537';
      case 'awaiting acceptance':
      case 'awaiting-acceptance':
        return '#FFA500';
      case 'offer rejected':
      case 'offers declined':
      case 'offer-rejected':
      case 'offer-declined':
        return '#CC0000';
      default:
        return '#79797B';
    }
  }

  async openEvaluation(hire?: HireData) {
    if (hire) {
      this.hire = hire;
      this.extractScouterName();
    }

    if (!this.hire) return;

    // Check if already rated (enhanced check)
    const isRated =
      this.hire.isRated ||
      this.hasTalentComment() ||
      this.getTalentRating() > 0;

    if (isRated) {
      this.toast.openSnackBar(
        'You have already rated this scouter.',
        'warning',
      );
      return;
    }

    // Check if offer is accepted
    const isAccepted =
      this.hire.offerStatus === 'Offers Accepted' ||
      this.hire.hireStatus === 'Offers Accepted' ||
      this.hire.offerStatus === 'offer-accepted' ||
      this.hire.hireStatus === 'offer-accepted';

    if (!isAccepted) {
      this.toast.openSnackBar(
        'You can only evaluate accepted offers.',
        'warning',
      );
      return;
    }

    // Get the marketHireId from hire data
    const marketHireId = this.hire.marketHireId || this.hire.id;

    if (!marketHireId) {
      this.toast.openSnackBar('Market Hire ID not found.', 'error');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: EvaluationPageComponent,
      componentProps: {
        scouterName: this.getScouterDisplayName(),
        jobDescription:
          this.hire.jobDescription || 'No job description provided',
        marketHireId: marketHireId, // Pass the marketHireId
      },
      cssClass: 'fund-wallet-modal',
      backdropDismiss: false, // Prevent closing by clicking outside
      keyboardClose: false, // Prevent closing with keyboard
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data && data.success) {
      // Update the hire with rating data
      this.hire.isRated = true;
      this.hire.talentRating = data.rating;
      this.hire.talentComment = data.comment;

      // Also update the satisFactoryCommentByTalent
      const commentData = {
        talentId: this.talentId,
        scouterId: this.hire.scouterId,
        dateOfComment: new Date().toISOString(),
        remark: data.comment,
        rating: data.rating,
      };

      this.hire.satisFactoryCommentByTalent = JSON.stringify(commentData);

      this.toast.openSnackBar(
        `Thank you for evaluating ${this.getScouterDisplayName()}!`,
        'success',
      );

      // Update the table data if needed
      this.updateHireInTable();
    }
  }

  // Add this helper method to update the hire in the table
  private updateHireInTable() {
    if (!this.hire || !this.hire.id) return;

    // Update in localStorage if using stored data
    const storedRecords = localStorage.getItem('allMarketRecords');
    if (storedRecords) {
      try {
        const records = JSON.parse(storedRecords);
        const updatedRecords = records.map((record: any) => {
          if (
            record.id === this.hire?.id ||
            record.marketHireId === this.hire?.id
          ) {
            return {
              ...record,
              isRated: true,
              satisFactoryCommentByTalent:
                this.hire?.satisFactoryCommentByTalent,
            };
          }
          return record;
        });
        localStorage.setItem(
          'allMarketRecords',
          JSON.stringify(updatedRecords),
        );
      } catch (error) {
        console.error('Error updating records:', error);
      }
    }
  }

  goToHireTransaction(hire: HireData): void {
    if (!hire) return;
    const hireId = hire.id;
    const scouterId = hire.scouterId || '';

    this.router.navigate(['/talent/market-price-preposition', hireId], {
      state: { scouterId, hire },
    });
  }
}
