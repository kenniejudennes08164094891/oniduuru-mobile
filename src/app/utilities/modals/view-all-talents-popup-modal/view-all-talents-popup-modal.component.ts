import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
  standalone: false,
})
export class ViewAllTalentsPopupModalComponent implements OnInit {
  images = imageIcons;
  @Input() hire: MockPayment | any;
  selectedSkills: any[] = []; // ✅ central store

  ngOnInit() {
    console.log('Hire received in modal:', this.hire);
  }
  constructor(private modalCtrl: ModalController, private router: Router) {}

  onSkillSelectionChanged(skills: any[]) {
    this.selectedSkills = skills; // ✅ update central store
  }

  get hasSelectedSkill(): boolean {
    return this.selectedSkills.length > 0;
  }

  hireTalent() {
    // ✅ Close the popup
    this.modalCtrl.dismiss({ hiredTalent: this.hire });
    this.modalCtrl.dismiss().then(() => {
      // ✅ Then navigate to the next page
      this.router.navigate([
        '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents/view-talents-location/conclude-hiring',
      ]);
    });
  }
}
