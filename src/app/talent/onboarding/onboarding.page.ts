import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage {
  currentStep = 0;
  steps = [
    { label: 'Talent Details' },
    { label: 'Other Details' },
    { label: 'Login Credentials' },
    { label: 'Verify Credentials' }
  ];

  constructor(private navCtrl: NavController) { }

  goNext() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
    }
  }

  goPrevious() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  goBack() {
    this.navCtrl.back();
  }

  goToLogin() {
    this.navCtrl.navigateRoot('/login');
  }


  finishOnboarding() {
    this.currentStep = 4; // optional if you want success screen here
  }
}
