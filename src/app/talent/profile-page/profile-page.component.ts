import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular';

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
  currentYear: number = new Date().getFullYear();
  headerHidden: boolean = false;

  showQuestions: boolean = false;
  securityQuestions: SecurityQA[] = [];

  // Talent profile data model
  talent = {
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
  

  @ViewChild(IonContent) pageContent!: IonContent;
  @ViewChild('profilePicture') profilePicture!: ElementRef;
  @ViewChild('securityQuestionsSection') securityQuestionsSection!: ElementRef;

  constructor(private router: Router, private location: Location) {}

  ngOnInit() {}

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
    this.talent.payRange = input.value;
  }

  scrollToProfilePicture() {
    const y = this.profilePicture.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  scrollToSecurityQuestions() {
    const y = this.securityQuestionsSection.nativeElement.offsetTop;
    this.pageContent.scrollToPoint(0, y, 600);
  }

  saveProfile() {
    console.log('Talent Profile Data:', this.talent, this.securityQuestions);
    // later: call API to save
  }
   // List of skills
  skills: string[] = ['Singing', 'Painting', 'Acting'];

  // For binding the input field
  newSkill: string = '';

  // Remove a skill
  removeSkill(skill: string) {
    this.skills = this.skills.filter(s => s !== skill);
  }

  //  Add a new skill
  addSkill() {
    if (this.newSkill.trim()) {
      this.skills.push(this.newSkill.trim());
      this.newSkill = ''; // clear input
    }
  }
}

