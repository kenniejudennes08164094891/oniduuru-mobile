


import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { EndpointService } from '../../services/endpoint.service';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastsService } from 'src/app/services/toasts.service';


@Component({
  selector: 'app-create-record',
  templateUrl: './create-record.page.html',
  styleUrls: ['./create-record.page.scss'],
})
export class CreateRecordPage implements OnInit {
  headerHidden = false;
  talentId: string | null = null;
  skills: any[] = [];
  receiverId: string | any = "";
  uploadError: string = ''; // <-- new property for error messages
  // state
  isEditing = false; // true when a market profile already exists
  isLoading = false;
  saveText = 'Create Record';
  activeTab: 'skills' | 'docs' = 'skills';

  // bio editor
  isBioEditorOpen = false;
  editedBio = '';
  bio = 'Sell yourself... Emphasizing your skills and achieving your skills to recruiters.';
  // convenience computed property for template
  get isNewUser(): boolean {
    // A user is "new" for this page if we are not editing an existing market profile
    return !this.isEditing;
  }

  // Market Profile model that the template binds to (must match HTML)
  marketProfile: {
    valueProposition: string;
    skillSets: Array<{ skill: string; skillLevel: string; pricing: string }>;
    pictorialDocumentations: string[];
  } = {
      valueProposition: '',
      skillSets: [{ skill: '', skillLevel: '', pricing: '' }],
      pictorialDocumentations: []
    };

  // profile basics used for UI header (populated from talent profile)
  profile = {
    name: '',
    email: '',
    address: '',
    bio: '',
    phone: '',
    photo: ''
  };
  //   talentData = {
  //   email: '',
  //   fullName: '',
  //   phoneNumber: '',
  //   address: '',
  //   educationalBackground: '',
  //   skillSets: [],
  //   skillLevel: '',
  //   payRange: ''
  // };


  // uploaded files preview & payload content
  uploadedFiles: { base64: string; type: string }[] = [];

  constructor(
    private endPointService: EndpointService,
    // private toastr: ToastrService,
    private toast: ToastsService,
    private router: Router,
    private route: ActivatedRoute,

  ) { }
  copied = false;

  copyPhone() {
    navigator.clipboard.writeText(this.profile.phone).then(() => {
      this.copied = true;

      // Hide checkmark after 2 seconds
      setTimeout(() => {
        this.copied = false;
      }, 3000);

      // Optionally show a toast
      this.toast.openSnackBar('Phone number copied to clipboard!', 'success');

    });
  }

  setActiveTab(tab: 'skills' | 'docs'): void {
    this.activeTab = tab;
  }
  ngOnInit(): void {
    // Read talentId from route param if passed; if not, fallback to stored id
    this.route.paramMap.subscribe(params => {
      this.talentId = params.get('talentId') || localStorage.getItem('talentId') || sessionStorage.getItem('talentId');

      if (this.talentId) {
        // persist for other pages and subsequent reloads
        localStorage.setItem('talentId', this.talentId);
        this.loadMarketOrTalentProfile();
      } else {
        this.toast.openSnackBar('Talent ID not found. Please log in again.', 'error');
        this.router.navigate(['/login']);
      }
    });
    this.loadSkillDropdown();
    this.fetchMyNotifications();
    this.clearNotifications();
    // this.updateTalentProfile();
  }

  // -------------------- NOTIFICATIONS --------------------
  fetchMyNotifications(): void {
    // Placeholder for notification fetching logic
    console.debug('Fetching notifications for talentId:', this.talentId);
    // You can implement actual notification fetching here
  }
  async clearNotifications(): Promise<void> {
    if (!this.talentId) return;

    const payload = {
      receiverId: this.talentId
    };

    try {
      const response = await firstValueFrom(this.endPointService.clearMyNotifications(payload));
      console.debug('Clear notifications response:', response);
      // Optionally show a toast or update UI
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Optionally show an error toast
    }
  }

  // -------------------- SKILL DROPDOWN --------------------
  skillOptions: string[] = [];
  loadSkillDropdown(): void {
    this.endPointService.fetchSkillDropdown().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.debug('Fetched skill dropdown:', res);
        this.skillOptions = res?.details || [];
      },
      error: (err) => {
        console.error('Error fetching skill dropdown:', err);
        this.toast.openSnackBar('Unable to load skill options.', 'error');

      }
    });
  }

  // -------------------- BIO EDITOR --------------------
  openBioEditor() {
    this.editedBio = this.marketProfile.valueProposition || this.bio;
    this.isBioEditorOpen = true;
  }

  closeBioEditor() {
    this.isBioEditorOpen = false;
  }

  saveBio() {
    this.marketProfile.valueProposition = this.editedBio;
    this.isBioEditorOpen = false;
  }

  //  updateTalentProfile(): void {
  //   if (!this.talentId) return;

  //   this.endPointService.updateTalentProfile(this.talentId, this.talentData).subscribe({
  //     next: (res) => console.log('Updated:', res),
  //     error: (err) => console.error('Error:', err)
  //   });
  // }

  // -------------------- LOAD PROFILES --------------------
  loadMarketOrTalentProfile(): void {
    if (!this.talentId) return;

    this.isLoading = true;
    console.debug('Loading both market and talent profiles for:', this.talentId);

    const market$ = this.endPointService
      .fetchTalentMarketProfile(this.talentId)
      .pipe(
        catchError((err) => {
          console.warn('Market profile error:', err);
          return of(null);
        })
      );

    const talent$ = this.endPointService
      .fetchTalentProfile(this.talentId)
      .pipe(
        catchError((err) => {
          console.warn('Talent profile error:', err);
          return of(null);
        })
      );

    forkJoin([market$, talent$]).subscribe({
      next: ([marketRes, talentRes]) => {

        const marketDetails = marketRes?.details ?? null;
        const talentDetails = talentRes?.details ?? null;

        //  POPULATE PROFILE FROM TALENT PROFILE
        // -------
        if (talentDetails) {
          this.profile = {
            name: talentDetails.fullName || '',
            email: talentDetails.email || '',
            address: talentDetails.address || '',
            bio: '',
            phone: talentDetails.phoneNumber || '',
            photo: talentDetails.photo || ''
          };
        }

        const hasMarketData =
          marketDetails &&
          (
            (Array.isArray(marketDetails.skillSets) && marketDetails.skillSets.length > 0) ||
            (typeof marketDetails.skillSets === 'string' && marketDetails.skillSets.trim().length > 0) ||
            (marketDetails.valueProposition && marketDetails.valueProposition.trim().length > 0) ||
            (Array.isArray(marketDetails.pictorialDocumentations) && marketDetails.pictorialDocumentations.length > 0)
          );

        // 
        //IF MARKET PROFILE EXISTS → LOAD ONLY MARKET DATA
        // ----------------------
        if (hasMarketData) {

          const normalizedSkillSets = this.normalizeSkillSets(marketDetails.skillSets);

          const normalizedObjects = normalizedSkillSets.length
            ? normalizedSkillSets.map((s: any) => ({
              skill: s.skill ?? s,
              skillLevel: s.skillLevel ?? '',
              pricing: s.pricing ?? ''
            }))
            : [{ skill: '', skillLevel: '', pricing: '' }];

          this.marketProfile = {
            valueProposition: marketDetails.valueProposition ?? '',
            skillSets: normalizedObjects,
            pictorialDocumentations: Array.isArray(marketDetails.pictorialDocumentations)
              ? marketDetails.pictorialDocumentations
              : []
          };

          this.isEditing = true;
          this.saveText = 'Update Record';

        }

        // IF NO MARKET PROFILE → INITIALIZE FROM TALENT SKILLS
        // -------------
        else if (talentDetails) {

          let parsedSkillNames: string[] = [];

          if (typeof talentDetails.skillSets === 'string') {
            try {
              parsedSkillNames = JSON.parse(talentDetails.skillSets);
            } catch {
              parsedSkillNames = [];
            }
          } else if (Array.isArray(talentDetails.skillSets)) {
            parsedSkillNames = talentDetails.skillSets;
          }

          this.marketProfile = {
            valueProposition: '',
            skillSets: parsedSkillNames.length
              ? parsedSkillNames.map((skill: string) => ({
                skill,
                skillLevel: '',
                pricing: ''
              }))
              : [{ skill: '', skillLevel: '', pricing: '' }],
            pictorialDocumentations: []
          };

          this.isEditing = false;
          this.saveText = 'Create Record';
        }

        else {
          this.toast.openSnackBar('No profile data found.', 'error');
        }

        this.isLoading = false;
      },

      error: (err) => {
        console.error('Unexpected error:', err);
        this.toast.openSnackBar('Error loading profiles.', 'error');
        this.isLoading = false;
      }
    });
  }

  // -------------------- NORMALIZE HELPERS --------------------
  // normalize skillSets returned from backend (array, stringified JSON, single object, or comma string)
  normalizeSkillSets(raw: any): any[] {
    if (!raw && raw !== 0) return [];

    // Already array
    if (Array.isArray(raw)) return raw;

    // Raw string: either JSON string like '[{"skill":"X"}]' or comma list "A,B"
    if (typeof raw === 'string') {
      // Try JSON parse first
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        // parsed might be object or something else; try to coerce
        if (typeof parsed === 'object') return [parsed];
      } catch (e) {
        // Not JSON — maybe comma-separated strings
        const parts = raw.split(',').map((p: string) => p.trim()).filter(Boolean);
        if (parts.length) return parts;
      }
    }

    // Single object
    if (typeof raw === 'object') return [raw];

    // fallback empty
    return [];
  }

  // -------------------- SAVE (create or update) --------------------
  // HTML calls updateRecord() on button click — map to saveMarketProfile() flow
  updateRecord(): void {
    this.saveMarketProfile();
  }

  saveMarketProfile(): void {
    if (!this.talentId) {
      this.toast.openSnackBar('Talent ID not found.', 'error');

      return;
    }
    this.isLoading = true;   // start spinner
    this.saveText = this.isEditing ? 'Updating...' : 'Creating...';
    // Validate basic fields (optional)
    if (!this.marketProfile.skillSets || this.marketProfile.skillSets.length === 0) {
      this.toast.openSnackBar('Please add at least one skill.', 'warning');

      return;
    }

    // Build payload matching Swagger: valueProposition, skillSets[], pictorialDocumentations[]
    const payload = {
      valueProposition: this.marketProfile.valueProposition,
      skillSets: this.marketProfile.skillSets.map(s => ({
        skill: s.skill ?? '',
        pricing: s.pricing ?? '',
        skillLevel: s.skillLevel ?? ''
      })),
      pictorialDocumentations: this.marketProfile.pictorialDocumentations || []
    };

    // this.isLoading = true;
    // this.saveText = this.isEditing ? 'Updating...' : 'Creating...';

    const apiCall = this.isEditing
      ? this.endPointService.updateTalentMarketProfileData(payload, this.talentId!)
      : this.endPointService.createTalentMarketProfileData(payload, this.talentId!);

    apiCall.subscribe({
      next: (res: any) => {
        console.debug('Save response:', res);
        this.toast.openSnackBar(this.isEditing ? 'Market profile updated!' : 'Market profile created!', 'success');

        this.isEditing = true;
        this.saveText = 'Update Record';
        this.isLoading = false;

        this.loadMarketOrTalentProfile(); // reload profile to reflect changes
      },
      error: (err: any) => {
        console.error('Save error:', err);
        // If backend returns 409 or message indicating already exists, you can handle it here
        this.toast.openSnackBar(err?.error?.message || 'Failed to save market profile.', 'error');

        this.isLoading = false;
        this.saveText = this.isEditing ? 'Update Record' : 'Create Record';
      }
    });
  }

  // -------------------- SKILL ROW HELPERS --------------------
  addSkill(): void {
    this.marketProfile.skillSets.push({ skill: '', skillLevel: '', pricing: '' });
  }

  removeSkill(index: number): void {
    if (this.marketProfile.skillSets.length > 1) {
      this.marketProfile.skillSets.splice(index, 1);
    } else {
      // keep at least one row
      this.marketProfile.skillSets = [{ skill: '', skillLevel: '', pricing: '' }];
    }
  }

  // -------------------- FILES --------------------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'video/mp4'];

    this.clearError(); // remove previous errors

    if (!allowedTypes.includes(file.type)) {
      this.showError('Only PNG/JPG/JPEG and MP4 files are allowed.');
      return;
    }

    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          if (img.width !== 828 || img.height !== 640) {
            this.showError('Invalid Image Dimensions, Image must be exactly 828 x 640 pixels.');
            setTimeout(() => {
              window.location.href = 'https://www.reduceimages.com/';
            }, 1200);

            return;
          }
          const base64 = reader.result as string;
          this.uploadedFiles.push({ base64, type: file.type });
          this.marketProfile.pictorialDocumentations.push(base64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // video
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.uploadedFiles.push({ base64, type: file.type });
        this.marketProfile.pictorialDocumentations.push(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.marketProfile.pictorialDocumentations.splice(index, 1);
  }

  // Show inline error and auto-clear after 3 seconds
  private showError(message: string) {
    this.uploadError = message;

    // Clear message after 2 seconds
    setTimeout(() => {
      this.uploadError = '';
    }, 2000);
  }

  private clearError() {
    this.uploadError = '';
  }
}


