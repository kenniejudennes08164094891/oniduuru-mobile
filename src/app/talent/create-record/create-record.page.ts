// import { Component, OnInit } from '@angular/core';
// import { ToastrService } from 'ngx-toastr';
// import { EndpointService } from 'src/app/services/endpoint.service';
// @Component({
//   selector: 'app-create-record',
//   templateUrl: './create-record.page.html',
//   styleUrls: ['./create-record.page.scss'],
// })
// export class CreateRecordPage implements OnInit {
//   talentId: string | null = null;
//   headerHidden: boolean = false;
//   isEditing = false;
//   isLoading = false;
//   saveText = 'Create Record';
//   isBioEditorOpen = false;
//   editedBio: string = '';
//   bio: string = 'Sell yourself... Emphasizing your skills and achieving your skills to recuiters.';

//   marketProfile = {
//     valueProposition: '',
//     skillSets: [
//       { skill: '', pricing: '', skillLevel: '' }
//     ],
//     pictorialDocumentations: []
//   };

//   profile = {
//     name: 'Adediji Oluwaseyi',
//     address: '12 Henry Uzoma Street, Awoyaya Lagos',
//     bio: 'Sell yourself… Emphasize your skills and Achievements to recruiters.',
//     phone: '09031251953',
//     photo: ''
//   };
//   activeTab: 'skills' | 'docs' = 'skills';
//   // skills: { level: string; price: string }[] = [{ level: '', price: '' }];
//   // uploadedFiles: any[] = [];

//   constructor(private endPointService: EndpointService, private toastr: ToastrService) { }
//   ngOnInit(): void {
//     this.talentId = localStorage.getItem('talentId'); // or use route param if you prefer
//     if (this.talentId) {
//       this.fetchMarketProfile();
//     }
//   }

//   fetchMarketProfile(): void {
//     this.endPointService.fetchTalentMarketProfile(this.talentId!).subscribe({
//       next: (res) => {
//         if (res && res.details) {
//           const data = res.details;
//           this.isEditing = true;
//           this.saveText = 'Update Record';

//           this.marketProfile = {
//             valueProposition: data.valueProposition || '',
//             skillSets: data.skillSets && data.skillSets.length > 0 ? data.skillSets : [{ skill: '', pricing: '', skillLevel: '' }],
//             pictorialDocumentations: data.pictorialDocumentations || []
//           };
//         }
//       },
//       error: (err) => {
//         if (err.status === 404) {
//           this.isEditing = false;
//           this.saveText = 'Create Record';
//         } else {
//           this.toastr.error('Error fetching market profile');
//           console.error(err);
//         }
//       }
//     });
//   }
//   saveMarketProfile(): void {
//     if (!this.talentId) {
//       this.toastr.error('Talent ID not found.');
//       return;
//     }

//     this.isLoading = true;
//     this.saveText = this.isEditing ? 'Updating...' : 'Creating...';

//     const payload = {
//       valueProposition: this.marketProfile.valueProposition,
//       skillSets: this.marketProfile.skillSets,
//       pictorialDocumentations: this.marketProfile.pictorialDocumentations
//     };

//     const apiCall = this.isEditing
//       ? this.endPointService.updateTalentMarketProfileData(payload, this.talentId!)
//       : this.endPointService.createTalentMarketProfileData(payload, this.talentId!);

//     apiCall.subscribe({
//       next: () => {
//         this.toastr.success(this.isEditing ? 'Profile updated successfully!' : 'Profile created successfully!');
//         this.isEditing = true;
//         this.saveText = 'Update Record';
//         this.isLoading = false;
//       },
//       error: (err) => {
//         this.toastr.error('Something went wrong. Try again.');
//         console.error(err);
//         this.isLoading = false;
//         this.saveText = this.isEditing ? 'Update Record' : 'Create Record';
//       }
//     });
//   }

//   // Add a new skill row
//   addSkill() {
//     this.marketProfile.skillSets.push({ skill: '', pricing: '', skillLevel: '' });
//   }

//   // Remove a skill row
//   removeSkill(index: number) {
//     this.marketProfile.skillSets.splice(index, 1);
//   }
//   // Switch between tabs

//   setActiveTab(tab: 'skills' | 'docs') {
//     this.activeTab = tab;
//   }

//   skills = [
//     { level: '', price: '' }
//   ];


//   uploadedFiles: { base64: string; type: string }[] = [];

//   openBioEditor() {
//     this.editedBio = this.bio; // preload with existing bio
//     this.isBioEditorOpen = true;
//   }

//   closeBioEditor() {
//     this.isBioEditorOpen = false;
//   }

//   saveBio() {
//     this.bio = this.editedBio;  // update bio
//     this.isBioEditorOpen = false;
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (!input.files || input.files.length === 0) return;

//     const file = input.files[0];
//     const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

//     if (!allowedTypes.includes(file.type)) {
//       alert('Invalid file format. Please upload ONLY png, jpg, or jpeg.');
//       return;
//     }
//     const reader = new FileReader();
//     reader.onload = () => {
//       this.profile.photo = reader.result as string; // ✅ base64 string
//       console.log('Base64 image:', this.profile.photo.substring(0, 50) + '...'); // Debug
//     };
//     reader.readAsDataURL(file); // ✅ convert to base64

//   }


//   removeFile(index: number) {
//     this.uploadedFiles.splice(index, 1);
//   }

//   updateRecord() {
//     console.log('Profile:', this.profile);
//     console.log('Skills:', this.skills);
//     console.log('Uploaded Files:', this.uploadedFiles);
//   }
// }


import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { EndpointService } from '../../services/endpoint.service';
import { Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


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

  // profile basics used for UI header (you can populate from talent profile if available)
  profile = {
    name: 'Adediji Oluwaseyi',
    address: '12 Henry Uzoma Street, Awoyaya Lagos',
    bio: 'Sell yourself… Emphasize your skills and Achievements to recruiters.',
    phone: '09031251953',
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
    private toastr: ToastrService,
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
      this.toastr.success('Phone number copied to clipboard!');

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
        this.toastr.error('Talent ID not found. Please log in again.');
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
        this.toastr.error('Unable to load skill options.');
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
          return of(null); // Prevent forkJoin from failing
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
        console.log('Market Response:', marketRes);
        console.log('Talent Response:', talentRes);

        const marketDetails = marketRes?.details ?? null;
        const talentDetails = talentRes?.details ?? null;

        const hasMarketData =
          marketDetails &&
          (
            (Array.isArray(marketDetails.skillSets) && marketDetails.skillSets.length > 0) ||
            (typeof marketDetails.skillSets === 'string' && marketDetails.skillSets.trim().length > 0) ||
            (marketDetails.valueProposition && marketDetails.valueProposition.trim().length > 0) ||
            (marketDetails.profileName && marketDetails.profileName.trim().length > 0) ||
            (Array.isArray(marketDetails.pictorialDocumentations) && marketDetails.pictorialDocumentations.length > 0)
          );

        if (hasMarketData) {
          console.debug('Using MARKET profile data');

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

          this.profile.name = marketDetails.profileName ?? this.profile.name;
          this.isEditing = true;
          this.saveText = 'Update Record';

        } else if (talentDetails) {
          console.debug('Market profile empty — using TALENT profile data');

          let parsedSkillNames: string[] = [];

          if (typeof talentDetails.skillSets === 'string') {
            try {
              parsedSkillNames = JSON.parse(talentDetails.skillSets);
            } catch (e) {
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

          this.profile = {
            name: talentDetails.fullName || '',
            address: talentDetails.address || '',
            bio: 'Sell yourself… Emphasize your skills and Achievements to recruiters.',
            phone: talentDetails.phoneNumber || '',
            photo: talentDetails.photo || ''
          };

          this.isEditing = false;
          this.saveText = 'Create Record';
        } else {
          this.toastr.error('No profile data found.');
        }

        this.isLoading = false;
      },

      error: (err) => {
        console.error('Unexpected error:', err);
        this.toastr.error('Error loading profiles.');
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
      this.toastr.error('Talent ID not found.');
      return;
    }

    // Validate basic fields (optional)
    if (!this.marketProfile.skillSets || this.marketProfile.skillSets.length === 0) {
      this.toastr.warning('Please add at least one skill.');
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

    this.isLoading = true;
    this.saveText = this.isEditing ? 'Updating...' : 'Creating...';

    const apiCall = this.isEditing
      ? this.endPointService.updateTalentMarketProfileData(payload, this.talentId!)
      : this.endPointService.createTalentMarketProfileData(payload, this.talentId!);

    apiCall.subscribe({
      next: (res: any) => {
        console.debug('Save response:', res);
        this.toastr.success(this.isEditing ? 'Market profile updated!' : 'Market profile created!');
        this.isEditing = true;
        this.saveText = 'Update Record';
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Save error:', err);
        // If backend returns 409 or message indicating already exists, you can handle it here
        this.toastr.error(err?.error?.message || 'Failed to save market profile.');
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

    if (!allowedTypes.includes(file.type)) {
      this.toastr.error('Only PNG/JPG/JPEG and MP4 are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.uploadedFiles.push({ base64, type: file.type });
      this.marketProfile.pictorialDocumentations.push(base64);
    };
    reader.readAsDataURL(file);
  }

  removeFile(index: number): void {
    this.uploadedFiles.splice(index, 1);
    this.marketProfile.pictorialDocumentations.splice(index, 1);
  }
}
