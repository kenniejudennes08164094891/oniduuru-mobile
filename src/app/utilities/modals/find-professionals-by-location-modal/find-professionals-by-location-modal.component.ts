import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { MockPayment, SkillSet } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { ViewAllTalentsPopupModalComponent } from '../view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-find-professionals-by-location-modal',
  templateUrl: './find-professionals-by-location-modal.component.html',
  styleUrls: ['./find-professionals-by-location-modal.component.scss'],
  standalone: false,
})
export class FindProfessionalsByLocationModalComponent extends BaseModal {
  @Input() hires: MockPayment[] = [];
  @Input() location: string = '';

  images = imageIcons;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  // Filters
  searchQuery: string = '';
  selectedSkillLevel: string = '';
  currentLocation = '';

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router
  ) {
    super(modalCtrl, platform); // ✅ inherits back-button + dismiss
  }

  override ngOnInit() {
    super.ngOnInit(); // keep BaseModal subscription
    this.currentLocation = this.location || 'Unknown';
    console.log('Modal opened with location:', this.currentLocation);
  }

  closeModal() {
    this.dismiss(); // ✅ dismiss inherited from BaseModal
  }

  // ✅ Apply search + skill filter
  get filteredAndSearchedHires() {
    return this.hires.filter((hire: MockPayment) => {
      const matchesSearch =
        hire.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        hire.email.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesSkill =
        !this.selectedSkillLevel ||
        hire.skillSet.some(
          (s: SkillSet) =>
            s.skillLevel.toLowerCase() === this.selectedSkillLevel.toLowerCase()
        );

      return matchesSearch && matchesSkill;
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredAndSearchedHires.length / this.pageSize) || 1;
  }

  get paginatedHires() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return '#189537'; // green
      case 'Pending':
        return '#FFA500'; // orange
      case 'Away':
        return '#79797B'; // gray
      default:
        return '#ffffff';
    }
  }

  async openTalentModal(hire: MockPayment) {
    // ✅ First close this modal
    await this.dismiss();

    // ✅ Then open the talent popup
    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: { hire },
      cssClass: 'all-talents-fullscreen-modal',
    });
    await modal.present();
  }
}
