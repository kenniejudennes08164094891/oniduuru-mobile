import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-onboarding-header',
  templateUrl: './onboarding-header.component.html',
  styleUrls: ['./onboarding-header.component.scss']
})
export class OnboardingHeaderComponent {
  @Input() currentStep = 0;

  steps = ['Talent details', 'Other details', 'Login credentials', 'Verify credentials'];

  get progress() {
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }
}
