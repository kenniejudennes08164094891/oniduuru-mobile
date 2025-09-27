import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
  standalone: false,
})
export class ViewAllTalentsPopupModalComponent extends BaseModal {
  images = imageIcons;
  @Input() hire: MockPayment | any;
  selectedSkills: any[] = []; // ✅ central store

  constructor(
    modalCtrl: ModalController,
    private router: Router,
    platform: Platform
  ) {
    super(modalCtrl, platform); // ✅ gets dismiss + back button
  }
  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills; // ✅ update central store
  }

  get hasSelectedSkill(): boolean {
    return this.selectedSkills.length > 0;
  }

  hireTalent() {
    this.modalCtrl.dismiss().then(() => {
      this.router.navigate(
        [
          '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location/conclude-hiring',
        ],
        {
          state: {
            hire: this.hire,
            selectedSkills: this.selectedSkills,
          },
        }
      );
    });
  }
}
