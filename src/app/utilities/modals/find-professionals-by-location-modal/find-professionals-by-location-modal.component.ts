import { Component, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { MockPayment, MockRecentHires, SkillSet } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-find-professionals-by-location-modal',
  templateUrl: './find-professionals-by-location-modal.component.html',
  styleUrls: ['./find-professionals-by-location-modal.component.scss'],
})
export class FindProfessionalsByLocationModalComponent implements OnInit {
  @Input() hires: MockPayment[] = []; // 👈 accept hires from parent
  @Input() location: string = ''; // 👈 add this

  images = imageIcons;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 5;

  // Filters
  searchQuery: string = '';
  selectedSkillLevel: string = '';
  currentLocation = 'Lagos';
  constructor(private modalCtrl: ModalController, private router: Router) {}

  ngOnInit() {
    console.log('Modal opened with hires:', this.hires);
    console.log('Modal opened with location:', this.location);
  }

  closeModal() {
    this.modalCtrl.dismiss(); // ✅ closes the modal properly
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
}
