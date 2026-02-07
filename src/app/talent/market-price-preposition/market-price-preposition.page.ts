import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginationParams } from 'src/app/models/mocks';
import { ToastrService } from 'ngx-toastr';
import { EvaluationPageComponent } from 'src/app/components/evaluation-page/evaluation-page.component';
import {
  ModalController,
  ToastController,
  AlertController,
} from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';

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
  hire: HireData | null = null;
  images = imageIcons;
  userName: string = 'User';
  scouterName: string = 'Scouter';
  headerHidden: boolean = false;
  rating: number = 0;
  marketItems: any[] = [];

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

    // Get the hire data from navigation state FIRST
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state;
    console.log('Navigation State:', state);

    if (state && state['hire']) {
      // Use the hire data passed from the table click
      this.hire = state['hire'] as HireData;
      console.log('Hire data from state:', this.hire);

      // Store the scouterId if available
      if (state['scouterId']) {
        sessionStorage.setItem('scouterId', state['scouterId']);
      }

      // Extract and set scouter name from hire data
      this.extractScouterName();

      // Handle transaction flow if needed
      this.handleTransactionFlow();

      // Debug: Log the comment data from state
      console.log('🔍 Comment data from state:', {
        satisFactoryCommentByTalent: this.hire?.satisFactoryCommentByTalent,
        satisFactoryCommentByScouter: this.hire?.satisFactoryCommentByScouter,
        typeTalent: typeof this.hire?.satisFactoryCommentByTalent,
        typeScouter: typeof this.hire?.satisFactoryCommentByScouter,
      });
    } else {
      // If no state, try to get from route params only (fallback)
      console.warn('No hire data in navigation state');
      this.fetchHireById(id);
    }

    this.fetchMarketsOnEnter();
    this.loadTalentName();
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

    switch (status) {
      case 'Offer Accepted':
      case 'offer-accepted':
      case 'Offers Accepted':
        await this.openEvaluation(this.hire);
        break;

      case 'Awaiting Acceptance':
      case 'awaiting-acceptance':
        await this.showAcceptRejectPopup(this.hire);
        break;

      case 'Offer Rejected':
      case 'offer-rejected':
      case 'offer-declined':
      case 'Offers Declined':
        break;
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
    const paginationParams = { limit: 50, pageNo: 1 };

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

    if (
      this.hire.offerStatus !== 'Offer Accepted' &&
      this.hire.hireStatus !== 'offer-accepted' &&
      this.hire.hireStatus !== 'Offer Accepted'
    ) {
      this.toast.openSnackBar(
        'You can only evaluate accepted offers.',
        'warning',
      );
      return;
    }

    if (this.hire.isRated) {
      this.toast.openSnackBar(
        'You have already rated this scouter.',
        'warning',
      );
      return;
    }

    const modal = await this.modalCtrl.create({
      component: EvaluationPageComponent,
      componentProps: {
        scouterName: this.getScouterDisplayName(),
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.hire.isRated = true;
      this.hire.talentRating = data.rating;
      this.hire.talentComment = data.comment;

      if (this.hire.id) {
        const updatedHires = MockRecentHires.map((h) =>
          h.id === this.hire?.id
            ? this.convertHireDataToMockPayment(this.hire)
            : h,
        );
        localStorage.setItem('MockRecentHires', JSON.stringify(updatedHires));
      }

      this.toast.openSnackBar(
        `Thank you for evaluating ${this.getScouterDisplayName()}!`,
        'success',
      );
    }
  }

  private convertHireDataToMockPayment(hire: HireData): MockPayment {
    return {
      id: hire.id,
      scouterName: hire.scouterName || '',
      email: hire.scouterEmail || '',
      offerStatus:
        (hire.offerStatus as
          | 'Offer Accepted'
          | 'Awaiting Acceptance'
          | 'Offer Rejected') || 'Awaiting Acceptance',
      date: hire.date || '',
      startDate: hire.startDate || '',
      amount: hire.amount || 0,
      jobDescription: hire.jobDescription || '',
      talentRating: hire.talentRating || 0,
      yourRating: hire.yourRating || 0,
      talentComment: hire.talentComment || '',
      yourComment: hire.yourComment || '',
      isRated: hire.isRated || false,
    } as MockPayment;
  }

  goToHireTransaction(hire: HireData): void {
    if (!hire) return;
    const hireId = hire.id;
    const scouterId = hire.scouterId || '';

    this.router.navigate(['/talent/market-price-preposition', hireId], {
      state: { scouterId, hire },
    });
  }

  async showAcceptRejectPopup(hire: HireData) {
    const alert = await this.alertCtrl.create({
      header: 'Offer Decision',
      message: `Would you like to accept or decline this offer from <b>${this.getScouterDisplayName()}</b>?`,
      buttons: [
        {
          text: 'Decline',
          role: 'cancel',
          cssClass: 'danger',
          handler: async () => {
            await this.confirmChoice(hire, 'Offer Rejected');
          },
        },
        {
          text: 'Accept',
          handler: async () => {
            await this.confirmChoice(hire, 'Offer Accepted');
          },
        },
      ],
    });

    await alert.present();
  }

  async confirmChoice(
    hire: HireData,
    choice: 'Offer Accepted' | 'Offer Rejected',
  ) {
    const confirm = await this.alertCtrl.create({
      header: 'Confirm Choice',
      message: `Are you sure you want to ${choice === 'Offer Accepted' ? 'accept' : 'decline'} this offer?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes, Confirm',
          handler: async () => {
            hire.offerStatus = choice;

            const hires = JSON.parse(
              localStorage.getItem('MockRecentHires') || '[]',
            );
            const updated = hires.map((h: any) =>
              h.id === hire.id ? this.convertHireDataToMockPayment(hire) : h,
            );
            localStorage.setItem('MockRecentHires', JSON.stringify(updated));

            this.toast.openSnackBar(
              `Offer ${choice === 'Offer Accepted' ? 'accepted' : 'declined'} successfully.`,
              `${choice === 'Offer Accepted' ? 'success' : 'error'}`,
            );

            if (choice === 'Offer Accepted') {
              await this.openEvaluation(hire);
            }
          },
        },
      ],
    });

    await confirm.present();
  }
}
