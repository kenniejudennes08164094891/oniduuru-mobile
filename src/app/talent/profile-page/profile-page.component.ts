import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { EndpointService } from 'src/app/services/endpoint.service';
import { AuthService } from 'src/app/services/auth.service';
import { of } from 'rxjs';
import { switchMap, catchError, finalize } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { Talent } from 'src/app/models/talent.model';

interface SecurityQA {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  headerHidden: boolean = false;
  securityForm!: FormGroup;
  securityQuestions: SecurityQA[] = [];
  currentYear: number = new Date().getFullYear();
  profileImage: string = 'assets/images/talentprofile.png';
  talentId: string | null = null;

  isLoading: boolean = false;
  selectedVideoFile: File | null = null;

  talent: Talent = {
    fullName: '',
    phone: '',
    email: '',
    password: '',
    location: '',
    skillLevel: '',
    educationalBackground: '',
    skills: [] as string[],
    experience: '',
    payRange: '',
  };

  skills: string[] = [];
  newSkill: string = '';

  skillLevels: string[] = [
    'Mid-Level-Experienced',
    'Intermediate-Performer',
    'Professional-Experienced',
    'Expert',
  ];

  educationalBackgrounds: string[] = [
    'Bachelors degree',
    'School drop-out',
    'SSCE',
    'Masters degree',
    'PhD',
  ];
  saveText: string = "Save"

  payRanges: string[] = [
    'less than 20k',
    '20k-50k',
    '50k-100k',
    '100k-200k',
    '200k-500k',
    '500k-1 million',
    'above 1 million',
  ];

  @ViewChild('profilePicture') profilePicture!: ElementRef;
  @ViewChild(IonContent, { static: false }) pageContent!: IonContent;
  @ViewChild('securityQuestionsSection', { static: false }) securityQuestionsSection!: ElementRef;

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private endPointService: EndpointService,
    private authService: AuthService,
    private toastr: ToastrService
  ) { }

  // ------------------ INIT ------------------ //
  ngOnInit(): void {
    this.securityForm = this.fb.group({
      questions: this.fb.array([]),
    });
    this.addQuestion();

    // ✅ Load the talentId first
    this.loadTalentId();

    // ✅ Wait a tiny bit to ensure localStorage is ready before calling profile API
    setTimeout(() => {
      if (this.talentId) {
        this.loadTalentProfile();
      } else {
        this.toastr.error('Talent ID missing. Please log in again.');
        this.router.navigate(['/login']);
      }
    }, 300);
  }


  // ------------------ LOAD TALENT ID ------------------ //
  loadTalentId() {
    this.talentId =
      localStorage.getItem('talentId') || sessionStorage.getItem('talentId');

    if (!this.talentId) {
      this.toastr.error('Talent ID not found. Please log in again.');
      this.router.navigate(['/login']);
    }
  }

  // ------------------ FETCH TALENT PROFILE ------------------ //
  loadTalentProfile() {
    if (!this.talentId) return;
    this.isLoading = true;

    this.endPointService.fetchTalentProfile(this.talentId).subscribe({
      next: (res) => {
        const data = res.details;
        console.log('Fetched Talent Data:', res);
        if (data) {
          
          this.talent = {
            fullName: data.fullName || '',
            phone: data.phoneNumber || '',
            email: data.email || '',
            password: '',
            location: data.address || '',
            skillLevel: data.skillLevel || '',
            educationalBackground: data.educationalBackground || '',
            skills: JSON.parse(data.skillSets) || [],
            experience: '',
            payRange: data.payRange || '',
          };
          this.skills = this.talent.skills;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.toastr.error('Failed to load profile.');
      },
    });
  }

  // ------------------ SAVE PROFILE ------------------ //
  saveProfile() {
    if (!this.talentId) {
      this.toastr.error('Talent ID not found. Please log in again.');
      return;
    }

    this.isLoading = true;
    this.saveText = "Processing..."
    const payload = { ...this.talent };

    this.endPointService
      .updateTalentProfile(this.talentId, payload)
      .pipe(
        switchMap(() => this.endPointService.fetchTalentProfile(this.talentId!)),
        catchError((err) => {
          console.error('Update or fetch error:', err);
          this.toastr.error('Failed to update profile.');
          this.saveText = "Save"
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((res) => {
        if (!res) return;
        const data = res.details?.user;
        console.log('Updated Talent Data:', data);
      
        if (data) {
          this.talent = {
            fullName: data.fullName || '',
            phone: data.phoneNumber || '',
            email: data.email || '',
            password: res.details?.session?.password || '',
            location: data.address || '',
            skillLevel: data.skillLevel || '',
            educationalBackground: data.educationalBackground || '',
            skills: data.skillSets || [],
            experience: '',
            payRange: data.payRange || '',
          };
          this.skills = this.talent.skills;
          this.toastr.success('Profile updated successfully!');
          this.loadTalentProfile();
        }
      });
  }

  // ------------------ VIDEO HANDLING ------------------ //
  onVideoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedVideoFile = file;
      this.toastr.info(`Selected video: ${file.name}`);
    }
  }

  uploadVideo() {
    if (!this.talentId) {
      this.toastr.error('Talent ID not found. Please log in again.');
      return;
    }

    if (!this.selectedVideoFile) {
      this.toastr.warning('Please select a video file first.');
      return;
    }

    const formData = new FormData();
    formData.append('talentId', this.talentId);
    formData.append('video', this.selectedVideoFile);

    this.isLoading = true;
    this.endPointService.uploadTalentReel(formData).subscribe({
      next: () => {
        this.toastr.success('Reel uploaded successfully!');
        this.selectedVideoFile = null;
        this.isLoading = false;
        this.loadTalentProfile(); // Refresh page data after upload
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Error uploading video.');
        this.isLoading = false;
      },
    });
  }

  // ------------------ SECURITY Q&A ------------------ //
  get questions(): FormArray {
    return this.securityForm.get('questions') as FormArray;
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      question: ['', Validators.required],
      answer: ['', Validators.required],
    });
    this.questions.push(questionGroup);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  save() {
    if (this.securityForm.valid) {
      console.log('Saved Questions:', this.securityForm.value.questions);
      this.toastr.success('Security questions saved!');
    } else {
      this.toastr.warning('Please fill all fields before saving.');
    }
  }

  // ------------------ SCROLL ------------------ //
  scrollToSecurityQuestions() {
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  scrollToProfilePicture() {
    const y = this.profilePicture.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  // ------------------ MISC ------------------ //
  goBack() {
    this.location.back();
  }

  removeSkill(skill: string) {
    this.skills = this.skills.filter((s) => s !== skill);
    this.talent.skills = this.skills;
  }

  addSkill() {
    if (this.newSkill.trim()) {
      this.skills.push(this.newSkill.trim());
      this.talent.skills = this.skills;
      this.newSkill = '';
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profileImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
}
