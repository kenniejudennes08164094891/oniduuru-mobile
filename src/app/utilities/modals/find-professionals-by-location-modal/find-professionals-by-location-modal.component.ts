import { Component, Input, OnDestroy } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { ModalController, Platform } from '@ionic/angular';
import { MockPayment, SkillSet } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { ViewAllTalentsPopupModalComponent } from '../view-all-talents-popup-modal/view-all-talents-popup-modal.component';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-find-professionals-by-location-modal',
  templateUrl: './find-professionals-by-location-modal.component.html',
  styleUrls: ['./find-professionals-by-location-modal.component.scss'],
  standalone: false,
})
export class FindProfessionalsByLocationModalComponent
  extends BaseModal
  implements OnDestroy {
  @Input() hires: MockPayment[] = [];
  @Input() location: string = '';

  images = imageIcons;
  currentPage: number = 1;
  pageSize: number = 5;

  searchQuery: string = '';
  selectedSkillLevel: string = '';
  currentLocation = '';

  private navSub?: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router
  ) {
    super(modalCtrl, platform);
  }

  // In FindProfessionalsByLocationModalComponent, add this method to fix encoding
  private fixNairaEncoding(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // Comprehensive Naira symbol encoding fixes
    return text
      .replace(/â\x82¦/g, '₦')
      .replace(/â‚¦/g, '₦')
      .replace(/â€Â¦/g, '₦')
      .replace(/\u00a3/g, '₦')
      .replace(/\\u20a6/g, '₦')
      .replace(/&#8358;/g, '₦')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  // Update ngOnInit to log and fix encoding
  override ngOnInit() {
    super.ngOnInit();
    this.currentLocation = this.location || 'Unknown';

    // Fix encoding for all hires
    if (this.hires && Array.isArray(this.hires)) {
      this.hires = this.hires.map(hire => {
        if (hire.payRange) {
          hire.payRange = this.fixNairaEncoding(hire.payRange);
        }
        return hire;
      });
    }

    // Debug logging
    console.log('🔍 Modal opened with data:', {
      location: this.currentLocation,
      hiresCount: this.hires?.length,
      hires: this.hires,
      firstHire: this.hires?.[0],
      firstPayRange: this.hires?.[0]?.payRange
    });

    // 👇 auto-dismiss modal on navigation
    this.navSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.dismiss();
      }
    });
  }

  override ngOnDestroy() {
    this.navSub?.unsubscribe();
  }

  closeModal() {
    this.dismiss();
  }

  // In , modify the filteredAndSearchedHires getter:
  get filteredAndSearchedHires() {
    if (!this.hires || this.hires.length === 0) {
      return [];
    }

    return this.hires.filter((hire: any) => {
      const matchesSearch =
        !this.searchQuery ||
        hire.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        hire.email?.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesSkill =
        !this.selectedSkillLevel ||
        hire.skillSet?.some((s: any) =>
          s.skillLevel?.toLowerCase() === this.selectedSkillLevel.toLowerCase()
        );

      return matchesSearch && matchesSkill;
    }).map(hire => {
      // Ensure skillSet has at least one item
      if (!hire.skillSet || !Array.isArray(hire.skillSet) || hire.skillSet.length === 0) {
        hire.skillSet = [{ jobTitle: 'Not specified', skillLevel: 'Not specified', amount: 0 }];
      }
      return hire;
    });
  }

  get hasData(): boolean {
    return this.filteredAndSearchedHires.length > 0;
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
        return '#189537';
      case 'Pending':
        return '#FFA500';
      case 'Away':
        return '#79797B';
      default:
        return '#ffffff';
    }
  }

  async openTalentModal(hire: MockPayment) {
    await this.dismiss();

    const modal = await this.modalCtrl.create({
      component: ViewAllTalentsPopupModalComponent,
      componentProps: { hire },
      cssClass: 'all-talents-fullscreen-modal',
    });
    await modal.present();
  }



}

// import { Component, Input } from '@angular/core';
// import { Router } from '@angular/router';
// import { ModalController, Platform } from '@ionic/angular';
// import { MockPayment, SkillSet } from 'src/app/models/mocks';
// import { imageIcons } from 'src/app/models/stores';
// import { ViewAllTalentsPopupModalComponent } from '../view-all-talents-popup-modal/view-all-talents-popup-modal.component';
// import { BaseModal } from 'src/app/base/base-modal.abstract';

// @Component({
//   selector: 'app-find-professionals-by-location-modal',
//   templateUrl: './find-professionals-by-location-modal.component.html',
//   styleUrls: ['./find-professionals-by-location-modal.component.scss'],
//   standalone: false,
// })
// export class FindProfessionalsByLocationModalComponent extends BaseModal {
//   @Input() hires: MockPayment[] = [];
//   @Input() location: string = '';

//   images = imageIcons;

//   // Pagination
//   currentPage: number = 1;
//   pageSize: number = 5;

//   // Filters
//   searchQuery: string = '';
//   selectedSkillLevel: string = '';
//   currentLocation = '';

//   constructor(
//     modalCtrl: ModalController,
//     platform: Platform,
//     private router: Router
//   ) {
//     super(modalCtrl, platform); // ✅ inherits back-button + dismiss
//   }

//   override ngOnInit() {
//     super.ngOnInit(); // keep BaseModal subscription
//     this.currentLocation = this.location || 'Unknown';
//     // console.log('Modal opened with location:', this.currentLocation);
//   }

//   closeModal() {
//     this.dismiss(); // ✅ dismiss inherited from BaseModal
//   }

//   // ✅ Apply search + skill filter
//   get filteredAndSearchedHires() {
//     return this.hires.filter((hire: MockPayment) => {
//       const matchesSearch =
//         hire.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
//         hire.email.toLowerCase().includes(this.searchQuery.toLowerCase());

//       const matchesSkill =
//         !this.selectedSkillLevel ||
//         hire.skillSet.some(
//           (s: SkillSet) =>
//             s.skillLevel.toLowerCase() === this.selectedSkillLevel.toLowerCase()
//         );

//       return matchesSearch && matchesSkill;
//     });
//   }

//   get totalPages(): number {
//     return Math.ceil(this.filteredAndSearchedHires.length / this.pageSize) || 1;
//   }

//   get paginatedHires() {
//     const start = (this.currentPage - 1) * this.pageSize;
//     return this.filteredAndSearchedHires.slice(start, start + this.pageSize);
//   }

//   nextPage() {
//     if (this.currentPage < this.totalPages) this.currentPage++;
//   }

//   prevPage() {
//     if (this.currentPage > 1) this.currentPage--;
//   }

//   getStatusColor(status: string): string {
//     switch (status) {
//       case 'Active':
//         return '#189537'; // green
//       case 'Pending':
//         return '#FFA500'; // orange
//       case 'Away':
//         return '#79797B'; // gray
//       default:
//         return '#ffffff';
//     }
//   }

//   async openTalentModal(hire: MockPayment) {
//     // ✅ First close this modal
//     await this.dismiss();

//     // ✅ Then open the talent popup
//     const modal = await this.modalCtrl.create({
//       component: ViewAllTalentsPopupModalComponent,
//       componentProps: { hire },
//       cssClass: 'all-talents-fullscreen-modal',
//     });
//     await modal.present();
//   }
// }
