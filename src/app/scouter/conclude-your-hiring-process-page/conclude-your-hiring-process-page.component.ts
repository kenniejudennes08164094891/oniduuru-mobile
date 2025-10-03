import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { imageIcons } from 'src/app/models/stores';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { Location } from '@angular/common';
import { BaseModal } from 'src/app/base/base-modal.abstract';

@Component({
  selector: 'app-conclude-your-hiring-process-page',
  templateUrl: './conclude-your-hiring-process-page.component.html',
  styleUrls: ['./conclude-your-hiring-process-page.component.scss'],
  standalone: false,
})
export class ConcludeYourHiringProcessPageComponent
  extends BaseModal
  implements OnInit
{
  headerHidden: boolean = false;
  @Input() hire: any;
  @Input() selectedSkills: any[] = [];
  @Output() skillSelectionChanged = new EventEmitter<any[]>();

  images = imageIcons;
  isUpdated = false; // ✅ controls Update button visibility

  isFormDisabled = false;

  // ✅ form data
  formData = {
    purpose: '',
    amount: 0,
    startDate: '',
  };

  previewConfirmed = false; // ✅ tracks state
  isPreviewOpen = false;

  constructor(
    private router: Router,
    private toastCtrl: ToastController,
    private location: Location,
    modalCtrl: ModalController,
    platform: Platform
  ) {
    super(modalCtrl, platform); // ✅ gets dismiss + back button
  }

  override ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state) {
      this.hire = nav.extras.state['hire'];
      this.selectedSkills = nav.extras.state['selectedSkills'] || [];
      this.formData.amount = this.totalPrice;
    }
  }

  get totalPrice(): number {
    return this.selectedSkills.reduce((sum, s) => sum + (s.amount || 0), 0);
  }

  get isFormValid(): boolean {
    return (
      !!this.formData.purpose &&
      !!this.formData.amount &&
      !!this.formData.startDate
    );
  }

  onAmountChange(value: string) {
    const numericValue = value.replace(/,/g, '');
    this.formData.amount = parseInt(numericValue, 10) || 0;
  }

  previewData() {
    this.isPreviewOpen = true;
  }

  closePreview() {
    this.isPreviewOpen = false;
  }

  confirmPreview() {
    this.previewConfirmed = true;
    this.isFormDisabled = true; // ✅ disable form
    this.closePreview();
  }

  async hireTalent() {
    // console.log('Hiring talent...', this.formData);
    const toast = await this.toastCtrl.create({
      message: 'Hire offer sent!',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });
    await toast.present();

    this.location.back();
  }

  async updateRecord() {
    // console.log('Updating record...', this.formData);

    const toast = await this.toastCtrl.create({
      message: 'Record updated successfully ✅',
      duration: 2000,
      color: 'success',
      position: 'bottom',
    });

    await toast.present();

    // ✅ hide the button
    this.isUpdated = true;
  }

  onCancel() {
    this.dismiss(null, 'cancel');
    this.router.navigate([
      '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
    ]);
  }

  onConfirm() {
    this.dismiss(null, 'confirm');
  }

  // goBack() {
  //   this.router.navigate([
  //     '/scouter/hire-talent/welcome-to-oniduuru/view-all-talents',
  //   ]);
  // }
}
