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
import { EndpointService } from 'src/app/services/endpoint.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-create-record',
  templateUrl: './create-record.page.html',
  styleUrls: ['./create-record.page.scss'],
})
export class CreateRecordPage implements OnInit {
  headerHidden = false;
  talentId: string | null = null;
  skills: any[] = []; 
  // state
  isEditing = false; // true when a market profile already exists
  isLoading = false;
  saveText = 'Create Record';
  activeTab: 'skills' | 'docs' = 'skills';

  // bio editor
  isBioEditorOpen = false;
  editedBio = '';
  bio = 'Sell yourself... Emphasizing your skills and achieving your skills to recruiters.';

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

  // uploaded files preview & payload content
  uploadedFiles: { base64: string; type: string }[] = [];

  constructor(
    private endPointService: EndpointService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) { }
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

  // -------------------- LOAD LOGIC --------------------
  // Top-level loader: try market profile first, fallback to talent profile
  loadMarketOrTalentProfile(): void {
    if (!this.talentId) return;

    this.isLoading = true;
    console.debug('Loading market profile for', this.talentId);

    this.endPointService.fetchTalentMarketProfile(this.talentId).subscribe({
      next: (res: any) => {
        console.debug('Market profile response:', res);
        if (res && res.details) {
          // Market profile exists — use it (ensure skillSets is normalized)
          const data = res.details;
          this.isEditing = true;
          this.saveText = 'Update Record';

          // Normalize skillSets (backend may return string, object or array)
          const normalizedSkillSets = this.normalizeSkillSets(data.skillSets);

          // Ensure each entry has skill, skillLevel, pricing keys
          const normalizedObjects = normalizedSkillSets.length
            ? normalizedSkillSets.map((s: any) => ({
              skill: s.skill ?? s, // if backend returns array of strings
              skillLevel: s.skillLevel ?? '',
              pricing: s.pricing ?? ''
            }))
            : [{ skill: '', skillLevel: '', pricing: '' }];

          this.marketProfile = {
            valueProposition: data.valueProposition ?? '',
            skillSets: normalizedObjects,
            pictorialDocumentations: Array.isArray(data.pictorialDocumentations) ? data.pictorialDocumentations : []
          };

          // Also populate header profile info if available
          if (data.profileName) this.profile.name = data.profileName;
        } else {
          // No market profile — fallback to talent profile
          this.loadTalentProfile();
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.warn('fetchTalentMarketProfile error:', err);
        this.isLoading = false;
        if (err?.status === 404) {
          // no market profile yet
          this.isEditing = false;
          this.saveText = 'Create Record';
          this.loadTalentProfile();
        } else {
          this.toastr.error('Error fetching market profile.');
        }
      }
    });
  }

  // Fetch talent profile (basic profile where user enters skill names)
  loadTalentProfile(): void {
    if (!this.talentId) return;

    this.isLoading = true;
    console.debug('Loading talent profile for', this.talentId);

    this.endPointService.fetchTalentProfile(this.talentId).subscribe({
      next: (res: any) => {
        console.log('Fetched Talent Data:', res);
        const details = res?.details || {};

        // Parse skillSets (stringified array)
        let parsedSkillNames: string[] = [];
        if (typeof details.skillSets === 'string') {
          try {
            parsedSkillNames = JSON.parse(details.skillSets);
          } catch (e) {
            console.warn('Could not parse skillSets JSON:', e);
            parsedSkillNames = [];
          }
        } else if (Array.isArray(details.skillSets)) {
          parsedSkillNames = details.skillSets;
        }

        // Default skill level (if available)
        const defaultLevel = details.skillLevel ?? '';

        // Prepare market profile for Create Record
        this.marketProfile = {
          valueProposition: '',
          skillSets: parsedSkillNames.length
            ? parsedSkillNames.map((skillName: string) => ({
              skill: skillName,
              skillLevel: '',
              pricing: ''
            }))
            : [{ skill: '', skillLevel: '', pricing: '' }],
          pictorialDocumentations: []
        };

        // Populate header profile details
        this.profile = {
          name: details.fullName || '',
          address: details.address || '',
          bio: 'Sell yourself… Emphasize your skills and Achievements to recruiters.',
          phone: details.phoneNumber || '',
          photo: details.photo || ''
        };

        this.saveText = 'Create Record';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error fetching talent profile:', err);
        this.toastr.error('Unable to fetch talent profile.');
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
