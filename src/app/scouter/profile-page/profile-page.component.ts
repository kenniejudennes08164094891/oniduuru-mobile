import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular';   // 👈 add this

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

  @ViewChild(IonContent) pageContent!: IonContent; // 👈 ion-content reference
  @ViewChild('profilePicture') profilePicture!: ElementRef;
@ViewChild('securityQuestionsSection') securityQuestionsSection!: ElementRef;

  constructor(private router: Router, private location: Location) {}

  ngOnInit() {}

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

}
