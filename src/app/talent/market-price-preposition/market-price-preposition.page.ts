import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaginationParams } from 'src/app/models/mocks';
import { ToastrService } from 'ngx-toastr';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { EvaluationPageComponent } from 'src/app/components/evaluation-page/evaluation-page.component';
import { ToastsService } from 'src/app/services/toasts.service';

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
    private authService: AuthService,
    private toast: ToastsService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private evaluationPageComponent: EvaluationPageComponent,
    private alertCtrl: AlertController
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const nav = this.router.getCurrentNavigation();
    this.hire = nav?.extras?.state?.['hire'];
    this.hire = MockRecentHires.find((h) => h.id === id);
    if (this.hire) {
      this.handleTransactionFlow();
    }
    this.fetchMarketsOnEnter();
    this.loadTalentName();
  }
  async handleTransactionFlow() {
    if (!this.hire) return;
    switch (this.hire.offerStatus) {
      case 'Offer Accepted':
        await this.openEvaluation(this.hire);
        break;

      case 'Awaiting Acceptance':
        await this.showAcceptRejectPopup(this.hire);
        break;

      case 'Offer Rejected':
        // Just load the page normally (no popups)
        break;
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

    // ✅ Save both IDs for use in Stats tab
    sessionStorage.setItem('talentId', talentId);
    if (scouterId) {
      sessionStorage.setItem('scouterId', scouterId);
    }

    const paginationParams = { limit: 10, pageNo: 1 };

    this.endpointService.fetchMarketsByTalent(talentId, paginationParams, '', scouterId).subscribe({
      next: (res: any) => {
        const decoded = this.base64JsonDecode<any[]>(res?.details) || [];
        this.marketItems = Array.isArray(decoded) ? decoded : [];

        console.log('✅ Saved IDs for Stats tab:', { talentId, scouterId });
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
    this.hire = hire; //  update active hire in dashboard
  }

  //  switch between tabs
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
  async openEvaluation(hire?: MockPayment) {
    if (hire) this.hire = hire;
    if (!this.hire) return;

    if (this.hire.offerStatus !== 'Offer Accepted') {
   
      this.toast.openSnackBar('You can only evaluate accepted offers.', 'warning');


      return;
    }

    if (this.hire.isRated) {
    
      this.toast.openSnackBar('You have already rated this scouter.', 'warning');

      return;
    }

    const modal = await this.modalCtrl.create({
      component: EvaluationPageComponent,
      componentProps: { scouterName: this.hire?.scouterName || 'Your Scouter' },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.hire.isRated = true;
      this.hire.talentRating = data.rating;
      this.hire.talentComment = data.comment;

      //  Persist to local storage
      const updatedHires = MockRecentHires.map((h) =>
        h.id === this.hire?.id ? this.hire : h
      );
      localStorage.setItem('MockRecentHires', JSON.stringify(updatedHires));

   
      this.toast.openSnackBar(`Thank you for evaluating ${this.hire?.scouterName || 'the scouter'}!`, 'success');

    }
  }

  goToHireTransaction(hire: any): void {
    if (!hire) { return; }
    const hireId = hire.id;
    const scouterId = hire.scouterId || ''; // example: 'scouter/4212/23November2024'
    // pass the hire and scouterId in navigation state
    sessionStorage.setItem('scouterId', scouterId);
    this.router.navigate(['/talent/market-price-preposition', hireId], {
      state: { scouterId, hire }
    });
  }
  async showAcceptRejectPopup(hire: any) {
    const alert = await this.alertCtrl.create({
      header: 'Offer Decision',
      message: `Would you like to accept or decline this offer from <b>${hire.name}</b>?`,
      buttons: [
        {
          text: 'Decline',
          role: 'cancel',
          cssClass: 'danger',
          handler: async () => {
            await this.confirmChoice(hire, 'Offer Declined');
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

  // Confirmation for choice
  async confirmChoice(hire: any, choice: 'Offer Accepted' | 'Offer Declined') {
    const confirm = await this.alertCtrl.create({
      header: 'Confirm Choice',
      message: `Are you sure you want to ${choice === 'Offer Accepted' ? 'accept' : 'decline'} this offer?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes, Confirm',
          handler: async () => {
            hire.offerStatus = choice;

            // Persist update
            const hires = JSON.parse(localStorage.getItem('MockRecentHires') || '[]');
            const updated = hires.map((h: any) => (h.id === hire.id ? hire : h));
            localStorage.setItem('MockRecentHires', JSON.stringify(updated));

            this.toast.openSnackBar(`Offer ${choice === 'Offer Accepted' ? 'accepted' : 'declined'} successfully.`, `${choice === 'Offer Accepted' ? 'success' : 'error'}`);


            // After accepting, you can open evaluation modal immediately
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
