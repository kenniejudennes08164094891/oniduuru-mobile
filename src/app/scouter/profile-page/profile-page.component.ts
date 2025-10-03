import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent, ModalController } from '@ionic/angular'; // 👈 add this
import { UpdateProfileConfirmationPopupModalComponent } from 'src/app/utilities/modals/update-profile-confirmation-popup-modal/update-profile-confirmation-popup-modal.component';
import { UserService } from 'src/app/services/user.service'; // adjust path
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';

interface SecurityQA {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  standalone: false,
})
export class ProfilePageComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  headerHidden: boolean = false;
  profileImage: string | null = null;
  profileData: any = {
    fullName: '',
    phoneNumber: '',
    email: '',
    location: '',
    scoutingPurpose: '',
    organizationType: [],
    payRange: '',
  };
  scouterId: string | null = null;
  showQuestions: boolean = false;
  securityQuestions: SecurityQA[] = [];

  @ViewChild(IonContent) pageContent!: IonContent; // 👈 ion-content reference
  @ViewChild('profilePicture') profilePicture!: ElementRef;
  @ViewChild('securityQuestionsSection') securityQuestionsSection!: ElementRef;

  constructor(
    private router: Router,
    private location: Location,
    private modalCtrl: ModalController, // 👈 add this
    public userService: UserService,
    private endpointService: ScouterEndpointsService
  ) {}

  isOrganisationDropdownOpen = false;

  organizationTypes: string[] = [
    'Individual',
    'Corporate',
    'Small Business',
    'NGO',
    'Startup',
    'Government',
  ];
  selectedOrgTypes: string[] = [];

  toggleOrganisationDropdown() {
    this.isOrganisationDropdownOpen = !this.isOrganisationDropdownOpen;
  }

  addOrgTypeFromDropdown(type: string) {
    if (!this.selectedOrgTypes.includes(type)) {
      this.selectedOrgTypes.push(type);
    }
    this.isOrganisationDropdownOpen = false; // close dropdown after selection
  }

  removeOrgType(index: number) {
    this.selectedOrgTypes.splice(index, 1);
  }
  ngOnInit() {
    // First, check BehaviorSubject
    this.scouterId = this.userService.getScouterId();

    // If not in memory, try localStorage (already handled in service constructor)
    if (!this.scouterId) {
      console.warn('No scouter ID in memory, checking localStorage...');
      this.scouterId = this.userService.getScouterId();
    }

    // if (this.scouterId) {
    //   console.log('Scouter ID found:', this.scouterId);
    //   this.loadProfile();
    // } else {
    //   console.error(
    //     'No scouter ID found anywhere, redirecting to login or onboarding'
    //   );
    //   this.router.navigate(['/auth/login']); // or your onboarding route
    // }

    this.showQuestions = false; // default state
  }

  ngAfterViewInit() {
    // safe to scroll
    this.scrollToTop();
  }

  // ✅ Load profile
  loadProfile() {
    if (!this.scouterId) {
      console.error('Cannot fetch profile: scouter ID is missing');
      return;
    }

    console.log('Fetching profile for scouter ID:', this.scouterId);

    this.endpointService.fetchScouterProfile(this.scouterId).subscribe({
      next: (res) => {
        console.log('Profile fetched successfully', res);

        this.profileData = {
          fullName: res.fullName || '',
          phoneNumber: res.phoneNumber || '',
          email: res.email || '',
          location: res.location || '',
          scoutingPurpose: res.scoutingPurpose || '',
          payRange: res.payRange || '',
        };

        this.selectedOrgTypes = res.organizationType || [];
        this.securityQuestions = res.securityQuestions || [];

        if (!this.scouterId) {
          console.error('No scouter ID found, cannot call API');
          return;
        }
        // Fetch profile image
        this.endpointService.getProfilePic(this.scouterId).subscribe({
          next: (imgRes) => {
            this.profileImage = imgRes?.url || null;
            console.log('Profile image loaded', this.profileImage);
          },
          error: (err) => {
            this.profileImage = null;
            console.error('Failed to fetch profile image', err);
          },
        });
      },
      error: (err) => console.error('Failed to fetch profile', err),
    });
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goBack() {
    this.location.back();
  }

  toggleQuestions() {
    this.showQuestions = !this.showQuestions;
  }

  addQuestion() {
    if (this.securityQuestions.length < 5) {
      this.securityQuestions.push({ question: '', answer: '' });
    }
  }

  formatNumber(event: any) {
    let input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  scrollToProfilePicture() {
    const y = this.profilePicture.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600); // 👈 smooth scroll inside ion-content
  }

  scrollToSecurityQuestions() {
    //this.showQuestions = true; // open inputs
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  // ✅ Handle file upload
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const base64Picture = reader.result as string;

        if (!this.scouterId) {
          console.error('No scouter ID found, cannot call API');
          return;
        }

        this.endpointService
          .uploadProfilePic(this.scouterId, base64Picture)
          .subscribe(() => {
            this.profileImage = base64Picture;
            this.userService.setProfileImage(base64Picture);
          });
      };
      reader.readAsDataURL(file);
    }
  }

  async saveProfile() {
    if (!this.scouterId) {
      console.error('No scouter ID found, cannot call API');
      return;
    }

    const body = {
      ...this.profileData,
      organizationType: this.selectedOrgTypes,
    };

    // Call API to update profile
    this.endpointService.updateScouterProfile(this.scouterId, body).subscribe({
      next: (res) => {
        // Use backend response if available, otherwise fallback to body
        const profileToStore = res || body;

        // Update service & localStorage
        this.userService.setProfileData(profileToStore);
        localStorage.setItem('profile', JSON.stringify(profileToStore));

        console.log('Profile updated successfully');

        // Open confirmation modal
        this.openConfirmationPopup();
      },
      error: (err) => {
        console.error('Failed to update profile', err);
      },
    });
  }

  // Call this when security questions are saved
  saveSecurityQuestions() {
    if (!this.scouterId) {
      console.error('No scouter ID found, cannot call API');
      return;
    }

    this.endpointService
      .updateScouterSecurityQuestions(this.scouterId, this.securityQuestions)
      .subscribe({
        next: () => {
          console.log('Security questions saved');
          this.showQuestions = false;
          this.scrollToTop();
        },
        error: (err) => console.error('Failed to save security questions', err),
      });
    // Close question inputs
    // this.showQuestions = false;

    // Scroll to top after saving
    // this.scrollToTop();
  }

  // Reusable scroll-to-top function
  scrollToTop() {
    if (this.pageContent) {
      this.pageContent.scrollToTop(600);
    }
  }

  // ✅ Modal helper
  async openConfirmationPopup() {
    const modal = await this.modalCtrl.create({
      component: UpdateProfileConfirmationPopupModalComponent,
      cssClass: 'update-profile-modal',
    });
    await modal.present();
  }
}
