import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { EndpointService } from 'src/app/services/endpoint.service';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-evaluation-page',
  templateUrl: './evaluation-page.component.html',
  styleUrls: ['./evaluation-page.component.scss'],
})
export class EvaluationPageComponent implements OnInit {
  @Input() scouterName!: string;
  @Input() jobDescription?: string;
  @Input() previousComments?: any[];
  @Input() marketHireId?: string;

  rating = 0;
  comment = '';
  location: string = '';
  photoAttached: boolean = false;
  isLoading: boolean = false;
  paymentOption: string = '';
  isModalOpen: boolean = true;

  constructor(
    private modalCtrl: ModalController,
    private endpointService: EndpointService,
    private toastService: ToastsService,
  ) {}
  ngOnInit(): void {
    console.log('Evaluating scouter:', this.scouterName);
    console.log('Job description:', this.jobDescription);
  }

  setRating(value: number) {
    if (!this.isLoading) {
      this.rating = value;
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  submitEvaluation() {
    if (!this.isFormValid()) {
      // Show a better alert/toast
      const alert = document.createElement('ion-alert');
      alert.header = 'Incomplete Form';
      alert.message =
        'Please select a rating and payment option before submitting.';
      alert.buttons = ['OK'];
      document.body.appendChild(alert);
      alert.present();
      return;
    }

    this.isLoading = true;

    // Get the talentId from storage
    const talentId =
      localStorage.getItem('talentId') ||
      sessionStorage.getItem('talentId') ||
      '';

    if (!talentId) {
      this.isLoading = false;
      this.toastService.openSnackBar(
        'Talent ID not found. Please login again.',
        'error',
      );
      return;
    }

    if (!this.marketHireId) {
      this.isLoading = false;
      this.toastService.openSnackBar('Market Hire ID not found.', 'error');
      return;
    }

    // Create payload according to API specification
    const payload = {
      talentId: talentId,
      remark: this.comment,
      rating: this.rating,
      paymentMethod: this.paymentOption as 'WALLET' | 'BANK_TRANSFER',
    };

    // You need to inject EndpointService into this component
    // Add this to constructor: private endpointService: EndpointService
    this.endpointService
      .submitTalentMarketComment(this.marketHireId, payload)
      .subscribe({
        next: (response) => {
          this.isLoading = false;

          // Dismiss with success data
          this.modalCtrl.dismiss({
            success: true,
            rating: this.rating,
            comment: this.comment,
            scouter: this.scouterName,
            location: this.location,
            photoAttached: this.photoAttached,
            paymentOption: this.paymentOption,
            apiResponse: response,
          });
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error submitting evaluation:', error);

          // Show error message
          const errorMsg =
            error.error?.message ||
            'Failed to submit evaluation. Please try again.';
          const alert = document.createElement('ion-alert');
          alert.header = 'Submission Failed';
          alert.message = errorMsg;
          alert.buttons = ['OK'];
          document.body.appendChild(alert);
          alert.present();
        },
      });
  }

  addLink() {
    const link = prompt('Enter link URL');
    if (link) {
      this.comment += `\n${link}`;
    }
  }

  addLocation() {
    if (this.isLoading) return;

    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      this.location = `https://maps.google.com/?q=${lat},${lng}`;
      this.comment += `\nLocation: ${this.location}`;
    });
  }

  onPhotoSelected(event: Event) {
    if (this.isLoading) return;

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    console.log('Selected photo:', file);
    this.photoAttached = true;
    this.comment += `\n[Photo attached: ${file.name}]`;
  }

  // Add this method for file input click
  handleFileInput(event: Event) {
    this.onPhotoSelected(event);
  }

  isFormValid(): boolean {
    return this.rating > 0 && !!this.paymentOption;
  }
}
