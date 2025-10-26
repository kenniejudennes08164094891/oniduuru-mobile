import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {imageIcons, TalentProfile} from "../../models/stores";
import {AuthService} from "../../services/auth.service";
import {ToastsService} from "../../services/toasts.service";

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  standalone: false,
})
export class ProfilePageComponent implements OnInit {
  currentYear: number = new Date().getFullYear();
  headerHidden: boolean = false;

  securityForm!: FormGroup;

  talentFullProfile: any = {};
  talentId: string = "";
  // Talent profile data model
  talent : TalentProfile = {
    fullName: '',
    phone: '',
    email: '',
    password: '',
    location: '',
    skillLevel: '',
    educationalBackground: '',
    skills: [] as string[],
    payRange: '',
  };
  // questions = [
  //   { question: '', answer: '' },
  //   { question: '', answer: '' },
  // ];

  @ViewChild(IonContent) pageContent!: IonContent;
  @ViewChild('profilePicture') profilePicture!: ElementRef;
  @ViewChild('securityQuestionsSection') securityQuestionsSection!: ElementRef;

  skills: string[] = ['Singing', 'Painting', 'Acting'];
  newSkill: string = '';

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastsService
  ) {
   // console.log("talent profile>>", this.authService.decodeTalentDetails());
    this.fetchTalentProfile();
  }

  fetchTalentProfile(){
    const talentProfile = this.authService.decodeTalentDetails();
    this.talentId = talentProfile?.details?.user?.talentId ?? this.talentFullProfile?.talentId;
    this.talent = talentProfile;
    this.talent = {
      fullName: talentProfile?.details?.user?.fullName,
      phone: talentProfile?.details?.user?.phoneNumber,
      email: talentProfile?.details?.session?.email,
      password: talentProfile?.details?.session?.password,
      location: talentProfile?.details?.user?.address,
      skillLevel: talentProfile?.details?.user?.skillLevel,
      educationalBackground: talentProfile?.details?.user?.educationalBackground,
      skills: talentProfile?.details?.user?.skillSets,
      payRange: talentProfile?.details?.user?.payRange,
    };
    console.log("talent>>", this.talent);
  }

  async getTalentProfileFromAPI():Promise<any>{
    try{
      const talentProfile = ""
    }catch (e:any) {
      this.toast.openSnackBar(e?.message ?? "Oops an error occurred when fetching talent's profile", 'error')
    }
  }



  ngOnInit() {
    this.securityForm = this.fb.group({
      questions: this.fb.array([]),
    });

    // add one default question field
    this.addQuestion();
  }

  // Getter for questions FormArray
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
      alert('Security questions saved!');
    } else {
      alert('Please fill all fields before saving.');
    }
  }

  goBack() {
    this.location.back();
  }

  formatNumber(event: any) {
    let input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    input.value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    this.talent.payRange = input.value;
  }

  async scrollToProfilePicture():Promise<any> {
    const y = this.profilePicture.nativeElement.offsetTop;
   await this.pageContent.scrollToPoint(0, y, 600);
  }

  async scrollToSecurityQuestions():Promise<any> {
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
   await this.pageContent.scrollToPoint(0, y, 600);
  }

  saveProfile() {
    console.log('Talent Profile Data:', this.talent, this.securityForm.value.questions);
    // later: call API to save
  }

  // Skills handling
  removeSkill(skill: string) {
    this.skills = this.skills.filter((s) => s !== skill);
  }

  addSkill() {
    if (this.newSkill.trim()) {
      this.skills.push(this.newSkill.trim());
      this.newSkill = '';
    }
  }
}
