import { Component, Input, OnInit } from '@angular/core';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
})
export class ViewAllTalentsPopupModalComponent implements OnInit {
  images = imageIcons;
  @Input() hire: MockPayment | any;
  selectedSkills: any[] = [];     // ✅ central store

  ngOnInit() {
    console.log('Hire received in modal:', this.hire);
  }

  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills; // ✅ update central store
  }

  get hasSelectedSkill(): boolean {
    return this.selectedSkills.length > 0;
  }

  hireTalent() {
    console.log('Hiring:', this.hire?.name, 'with skills:', this.selectedSkills);
  }
}
