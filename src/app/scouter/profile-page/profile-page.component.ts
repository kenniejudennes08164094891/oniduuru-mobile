import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

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

  constructor(private router: Router, private location: Location) {}

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  goBack() {
    this.location.back();
  }

  ngOnInit() {}

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
}
