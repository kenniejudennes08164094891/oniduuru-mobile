import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import {completeOnboardingEnums, dropdownItems, imageIcons, TalentProfile} from "../../models/stores";
import {AuthService} from "../../services/auth.service";
import {ToastsService} from "../../services/toasts.service";
import {EndpointService} from "../../services/endpoint.service";
import {firstValueFrom, lastValueFrom} from "rxjs";
import {EmmittersService} from "../../services/emmitters.service";

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
  talent: TalentProfile = {
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
  newSkill: string = '';
  selectItems: dropdownItems = {
    educationalBackground: [],
    organizationType: [],
    payRange: [],
    skillLevel: [],
    skillSets: []
  }
  updateText: string = "Save";
  fileUploads: string = imageIcons?.imageUploads;
  noProfilePicture: boolean = true;
  completeOnboardingEnums!: completeOnboardingEnums;
  createSecQBtn: string = "Create";
  updateSecQBtn: string = "Update";
  reelIcon: string = imageIcons?.reelIcon;

  selectedFile: File | any = null;
  previewUrl: string | null = null;

  uploadProgress = 0;
  isUploading = false;

  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastsService,
    private talentService: EndpointService,
    private emmitterService: EmmittersService
  ) {
    // console.log("talent profile>>", this.authService.decodeTalentDetails());
    this.fetchTalentProfile();
  }

  fetchTalentProfile() {
    const talentProfile = this.authService.decodeTalentDetails();
    console.clear();
    this.completeOnboardingEnums = JSON.parse(talentProfile?.completeOnboarding);
    console.log("completeOnboardingEnums>>",this.completeOnboardingEnums);
    this.talentId = talentProfile?.talentId ?? this.talentFullProfile?.talentId;
    this.talent = talentProfile;
    this.talent = {
      fullName: talentProfile?.fullName,
      phone: talentProfile?.phoneNumber,
      email: talentProfile?.email,
      password: talentProfile?.password,
      location: talentProfile?.address,
      skillLevel: talentProfile?.skillLevel,
      educationalBackground: talentProfile?.educationalBackground,
      skills: JSON.parse(talentProfile?.skillSets),
      payRange: talentProfile?.payRange,
    };
    // console.log("talent>>", this.talentId);
  }

  async getTalentProfileFromAPI(): Promise<any> {
    try {
      const talentProfile = await firstValueFrom(this.talentService.fetchTalentProfile(this.talentId));
      //console.log("talentProfile>>",talentProfile);
      this.talent = {
        fullName: talentProfile?.details?.fullName,
        phone: talentProfile?.details?.phoneNumber,
        email: talentProfile?.details?.email,
        password: talentProfile?.details?.password,
        location: talentProfile?.details?.address,
        skillLevel: talentProfile?.details?.skillLevel,
        educationalBackground: talentProfile?.details?.educationalBackground,
        skills: JSON.parse(talentProfile?.details?.skillSets),
        payRange: talentProfile?.details?.payRange,
      };
      console.log("talent fetched!!!>>", this.talent);
    } catch (e: any) {
      this.toast.openSnackBar(e?.message ?? "Oops an error occurred when fetching talent's profile", 'error');
    }
  }

  uploadProfilePic(event: any) {
    const file: File = event?.target?.files[0];
    let typeOfFile: string = event?.target?.files[0]?.type?.split('/')[1];
    if (typeOfFile === "jpeg" || typeOfFile === "png") {
      if (file) {
        const reader: FileReader = new FileReader();
        reader.onload = (e: any) => {
          const base64String: string = e?.target?.result;
          this.fileUploads = base64String;
          this.getProfilePictureToUpload(base64String.split(',')[1], this.talentId);
        };
        reader.readAsDataURL(file);
      }
    } else {
      this.toast.openSnackBar('Only jpeg or png file format is acceptable', 'error');
    }
  }


  getProfilePictureToUpload(base64String: string, talentId: string) {
    let data = {
      talentId: talentId,
      base64Picture: base64String
    }

    if (this.noProfilePicture === true) {
      // upload profile pic afresh
      this.talentService.uploadTalentPicture(data).subscribe({
        next: (response: any) => {
          // console.log("data uploads>>>", response);
          this.toast.openSnackBar(`${response?.message}`, 'success');
          location.reload();
        },
        error: (err: any) => {
          console.error("err>>>", err);
          if (err?.status === 401) {
            this.authService.logoutUser();
            this.toast.openSnackBar("Your session is expired!", 'error');
          } else if (err?.error?.message === "You can only replace an existing profile picture, and not create another!") {
            // replace the profile picture
            this.talentService.replaceTalentPicture(data).subscribe({
              next: (response: any) => {
                //console.log("response updates>>>", response);
                this.toast.openSnackBar(`${response?.message}`, 'success');
                location.reload();
              },
              error: (err: any) => {
                console.error("err>>>", err);
                this.toast.openSnackBar(`${err?.error?.message || err?.statusText}`, 'error');
                if (err?.status === 401) {
                  this.authService.logoutUser();
                  this.toast.openSnackBar("Your session is expired!", 'error');
                }
              }
            });
          } else {
            this.toast.openSnackBar(`${err?.error?.message || err?.statusText}`, 'error');
          }
        }
      })
    } else if (this.noProfilePicture === false) {
      // replace profile pic
      //console.log('data>>>', data)
      this.talentService.replaceTalentPicture(data).subscribe({
        next: (response: any) => {
          //  console.log("response updates>>>", response);
          this.toast.openSnackBar(`${response?.message}`, 'success');
          // location.reload();
        },
        error: (err: any) => {
          console.error("err>>>", err);
          this.toast.openSnackBar(`${err?.error?.message || err?.statusText}`, 'error');
          if (err?.status === 401) {
            this.authService.logoutUser();
            this.toast.openSnackBar("Your session is expired!", 'error');
          }
        }
      });
    } else {
      this.authService.logoutUser();
    }
  }

  getTalentProfilePicture() {
    this.talentService.getTalentPicture(this.talentId).subscribe({
      next: (response: any) => {
        this.fileUploads = `${response?.data?.base64Picture}`;
        this.emmitterService.setProfilePicture(`${response?.data?.base64Picture}`);
        //  this.toast.openSnackBar(`${response?.message}`, 'success');
      },
      error: (err: any) => {
        console.error("err>>", err);
        this.toast.openSnackBar(`${err?.error?.message || err?.statusText}`, 'error');
        if (err?.status === 401) {
          this.authService.logoutUser();
          this.toast.openSnackBar("Your session is expired!", 'error');
        } else if (err?.error?.message === 'This talent has no profile picture uploaded!') {
          this.toast.openSnackBar("Why haven't you uploaded your profile picture?", 'warning')
        }
      }
    })
  }

  navigateToView(sectionId: string) {
    setTimeout(async () => {
      await this.router.navigate([], {
        fragment: sectionId,
        queryParamsHandling: 'preserve'
      });
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({behavior: 'smooth'});
      }
    }, 100)

  }


  moveStringFirstIndex(arr: String[], str: string) {
    const index = arr.indexOf(str);
    if (index !== -1) {
      arr.splice(0, 0, arr.splice(index, 1)[0]);
    }
    return arr;
  }

  fetchDropdownItems() {
    this.talentService.fetchSkillDropdown().subscribe({
      next: (data: any) => {
        this.selectItems = data;
        const skillLevel = this.moveStringFirstIndex(this.selectItems.skillLevel, this.talent.skillLevel);
        const educationalBackground = this.moveStringFirstIndex(this.selectItems.educationalBackground, this.talent.educationalBackground);
        const payRange = this.moveStringFirstIndex(this.selectItems.payRange, this.talent.payRange)
        // console.log({skillLevel,educationalBackground,payRange})
      }
    })
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
    //console.clear();
    // console.log("array>>", this.questions.value);
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.toast.openSnackBar('We recommend you have at least two security questions', 'error');
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

  async scrollToProfilePicture(): Promise<any> {
    const y = this.profilePicture.nativeElement.offsetTop;
    await this.pageContent.scrollToPoint(0, y, 600);
  }

  async scrollToSecurityQuestions(): Promise<any> {
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
    await this.pageContent.scrollToPoint(0, y, 600);
  }

  // Skills handling
  removeSkill(skill: string) {
    this.talent.skills.forEach((item: any, idIndex: number) => {
      if (item === skill) {
        this.talent.skills.splice(idIndex, 1);
      }
    })
    console.clear();
    //console.log("skills>>",this.talent.skills)
    // this.talent.skills = this.skills;
  }

  addSkill() {
    if (this.newSkill.trim()) {
      this.talent.skills.push(this.newSkill.trim());
      this.newSkill = '';
    }
  }

  updateTalentProfile() {
    this.updateText = "Processing...";
    console.clear();
    //console.log("talent profile>>", this.talent);
    if (this.newSkill.length > 0) { // check if a skill is yet to be added.
      this.updateText = "Save";
      this.toast.openSnackBar("You have some skill yet to be added!", "warning");
      return; // return nothing...i.e no operation should be done until condition is resolved.
    } else {
      const payload = {
        ...this.talent,
        phoneNumber: this.talent.phone,
        skillSets: this.talent.skills
      }
      this.talentService.updateTalentProfile(this.talentId, payload).subscribe({
        next: async (res: any): Promise<void> => {
          this.updateText = "Save";
          this.toast.openSnackBar("Your profile has been updated successfully!", 'success');
          await this.ngOnInit(); // ngOnInit is used here to DOM refresh the update;
        },
        error: (err: any) => {
          this.updateText = "Save";
          this.toast.openSnackBar(err?.message ?? "Oops an error occurred when fetching talent's profile", 'error');
        }
      })
    }

  }

  createSecurityQuestion() {
    this.createSecQBtn = "Processing...";
    const securityQuestionsArray = this.questions?.value?.filter((item: any) => item?.questions?.length !== 0 && item?.answer?.length !== 0).map((elem: any) => ({
      question: elem?.question?.toLowerCase(),
      answer: elem?.answer?.toLowerCase()
    }));

    if (securityQuestionsArray.length < 2) {
      this.createSecQBtn = "Create";
      this.toast.openSnackBar("At least two security questions is required!", "error");
    } else {
      const payload = {
        uniqueId: this.talentId,
        securityQuestions: securityQuestionsArray
      }
      this.talentService.createTalentSecurityQuestion(payload).subscribe({
        next: async (response: any) => {
          this.createSecQBtn = "Create";
          this.toast.openSnackBar(response.message ?? "Security questions created successfully!", 'success');
          await this.ngOnInit();
        },
        error: (err: any) => {
          this.createSecQBtn = "Create";
          this.toast.openSnackBar(err?.message ?? "Oops an error occurred while creating security questions", 'error');
        }
      })
    }
  }

  getMySecurityQuestions() {
    this.authService.getMySecurityQuestionsWithAnswers(this.talentId).subscribe({
      next: (data: any) => {
        const dataFromAPI = JSON.parse(decodeURIComponent(escape(atob(data?.data))));
        // console.clear();
        // console.log("dataFromAPI>>", dataFromAPI);
        this.questions.clear();
        dataFromAPI.forEach((item: any) => {
          const questionGroup: FormGroup<any> = this.fb.group({
            question: [item.question, Validators.required],
            answer: [item.answer, Validators.required],
          });

          this.questions.push(questionGroup);
        });
      },
      error: (err: any) => {
        console.error("err>>", err);
        if (err?.status === 401) {
          this.authService.logoutUser();
          this.toast.openSnackBar("Your session is expired!", 'error');
        }
      }
    })
  }

  updateSecQuestions() {
    console.clear();
    this.updateSecQBtn = "Processing...";
    const securityQuestionsArray = this.questions?.value?.filter((item: any) => item?.questions?.length !== 0 && item?.answer?.length !== 0).map((elem: any) => ({
      question: elem?.question?.toLowerCase(),
      answer: elem?.answer?.toLowerCase()
    }));

    if (securityQuestionsArray.length < 2) {
      this.updateSecQBtn = "Update";
      this.toast.openSnackBar("At least two security questions is required!", "error");
    } else {
      const payload = {
        securityQuestions: securityQuestionsArray
      }
      this.talentService.updateTalentSecurityQuestions(payload, this.talentId).subscribe({
        next: async (response: any): Promise<void> => {
          this.updateSecQBtn = "Update";
          this.toast.openSnackBar(response.message ?? "Your security questions have been updated successfully!", 'success');
          await this.ngOnInit();
        },
        error: (err: any) => {
          this.updateSecQBtn = "Update";
          this.toast.openSnackBar(err?.message ?? "Oops an error occurred while creating security questions", 'error');
        }
      })
    }
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'video/mp4') {
      this.selectedFile = file;
      const maxSize = 200 * 1024 * 1024;
      if (file.size > maxSize) {
        this.toast.openSnackBar('Video size exceeds 200MB limit.','success');
        return;
      }

      // Preview video
      const reader:FileReader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
        //console.log("previewUrl>>", this.previewUrl);
      }
      reader.readAsDataURL(file);
    } else {
      this.toast.openSnackBar('Only MP4 videos are allowed.','success');
      this.selectedFile = null;
      this.previewUrl = null;
    }
  }

 async uploadTalentReel():Promise<void>{
   this.isUploading = true;
   this.uploadProgress = 0;
   console.log("completeOnboardingEnums>>", {
     completeOnboardingEnums: this.completeOnboardingEnums,
     previewUrl: this.previewUrl?.split(',')[1]
   });

    if(!this.completeOnboardingEnums.uploadedReel){
      // Replace reel
      const fetchUrlFromCloudinary = await this.handleCloudinaryUploads();
      console.log("to replace reel>>", fetchUrlFromCloudinary);
      const payload = {
        title: `${this.talent.fullName?.split(' ')[0]} talent reel`,
        videoUrl: fetchUrlFromCloudinary.response.secure_url,
      }
      const replaceReel = await firstValueFrom(this.talentService.replaceTalentReel(payload, this.talentId));
      if(replaceReel){
        this.uploadProgress = 100;
        this.toast.openSnackBar("Reel Updated successfully!", 'success');
      }

    }else{
      // upload reel
      const fetchUrlFromCloudinary = await this.handleCloudinaryUploads();
      console.log("to upload reel>>", fetchUrlFromCloudinary);
      const payload = {
        title: `${this.talent.fullName?.split(' ')[0]} talent reel`,
        videoUrl: fetchUrlFromCloudinary.response.secure_url,
        talentId: this.talentId
      }
      const uploadReel = await firstValueFrom(this.talentService.uploadTalentReel(payload));
      if(uploadReel){
        this.uploadProgress = 100;
        this.toast.openSnackBar("Reel uploaded successfully!", 'success');
      }
    }
  }

  async handleCloudinaryUploads():Promise<any>{
   try{
     const cloudinaryResponse = await this.handleCloudinaryVideo();
     const formData = new FormData();
     formData.append('file', this.selectedFile);
     formData.append('api_key', cloudinaryResponse.apiKey);
     formData.append('timestamp', cloudinaryResponse.timestamp);
     formData.append('signature', cloudinaryResponse.signature);
     formData.append('resource_type', 'video');
     const response = await lastValueFrom(
       this.talentService.fetchUrlFromCloudinary(
         `${cloudinaryResponse.cloudinaryBaseUrl}/${cloudinaryResponse.cloudinaryCloudName}/video/upload`,
         formData
       )
     )

     if(response){
       this.isUploading = false;
       console.clear();
       console.log("cloudinary data>>", response);
       return {response,formData}
     }
   }catch (e) {
     this.toast.openSnackBar("An error occurred while fetching video from cloudinary", 'error');
   }
  }

  async handleCloudinaryVideo():Promise<any>{
    try{
      const response = await firstValueFrom(this.talentService.fetchCloudinarySecrets())
      return JSON.parse(atob(response.data));
    }catch (e:any) {
      this.toast.openSnackBar('Error from Cloudinary uploads!', e);
    }
  }
  async ngOnInit()
  {
    this.securityForm = this.fb.group({
      questions: this.fb.array([]),
    });

    // add one default question field
    this.addQuestion();
    this.fetchDropdownItems();
    this.getTalentProfilePicture();
    this.getMySecurityQuestions();
    // Declare promises below:
    await this.getTalentProfileFromAPI();
  }
}


