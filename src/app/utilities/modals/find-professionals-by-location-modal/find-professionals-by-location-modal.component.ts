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
  implements OnDestroy
{
  @Input() hires: MockPayment[] = [];
  @Input() location: string = '';

  images = imageIcons;
  currentPage: number = 1;
  pageSize: number = 5;

  loading: boolean = false;
  error: string | null = null;

  searchQuery: string = '';
  selectedSkillLevel: string = '';
  currentLocation = '';

  private navSub?: Subscription;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private router: Router,
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
      this.hires = this.hires.map((hire) => {
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
      firstPayRange: this.hires?.[0]?.payRange,
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


  loadData() {
    // Implement your data loading logic here
    // For example, if you need to reload or fetch data:
    this.loading = true;
    this.error = null;
    
    // Simulate data loading or call an API
    setTimeout(() => {
      this.loading = false;
      // If there's an error, set this.error = 'Error message'
    }, 500);
  }

  // In , modify the filteredAndSearchedHires getter:
  get filteredAndSearchedHires() {
    if (!this.hires || this.hires.length === 0) {
      return [];
    }

    return this.hires
      .filter((hire: any) => {
        const matchesSearch =
          !this.searchQuery ||
          hire.name?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          hire.email?.toLowerCase().includes(this.searchQuery.toLowerCase());

        const matchesSkill =
          !this.selectedSkillLevel ||
          hire.skillSet?.some(
            (s: any) =>
              s.skillLevel?.toLowerCase() ===
              this.selectedSkillLevel.toLowerCase(),
          );

        return matchesSearch && matchesSkill;
      })
      .map((hire) => {
        // Ensure skillSet has at least one item
        if (
          !hire.skillSet ||
          !Array.isArray(hire.skillSet) ||
          hire.skillSet.length === 0
        ) {
          hire.skillSet = [
            {
              jobTitle: 'Not specified',
              skillLevel: 'Not specified',
              amount: 0,
            },
          ];
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
