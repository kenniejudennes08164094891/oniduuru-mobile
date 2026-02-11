// accept-or-reject.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { EndpointService } from 'src/app/services/endpoint.service'; // Add this
import { ToastsService } from 'src/app/services/toasts.service'; // Add this

@Component({
  selector: 'app-accept-or-reject',
  templateUrl: './accept-or-reject.component.html',
  styleUrls: ['./accept-or-reject.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class AcceptOrRejectComponent implements OnInit {
  @Input() scouterName!: string;
  @Input() hireDate!: string;
  @Input() hireTime!: string;
  @Input() hireData!: any; // Add this to receive hire data
  @Input() talentId!: string; // Add this

  // Add confirmation state
  showConfirmation = false;
  selectedAction: 'accept' | 'decline' | null = null;
  isLoading = false; // Add loading state

  constructor(
    private modalCtrl: ModalController,
    private endpointService: EndpointService, // Add this
    private toastService: ToastsService, // Add this
  ) {}

  ngOnInit() {
    console.log(
      'Modal opened for:',
      this.scouterName,
      'on',
      this.hireDate,
      this.hireTime,
    );
    console.log('Hire data:', this.hireData);
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }

  // Update acceptOffer to show confirmation
  acceptOffer() {
    this.selectedAction = 'accept';
    this.showConfirmation = true;
  }

  // Update declineOffer to show confirmation
  declineOffer() {
    this.selectedAction = 'decline';
    this.showConfirmation = true;
  }

  // Confirm the selected action - UPDATED
  async confirmAction() {
    if (!this.selectedAction || !this.hireData) return;

    this.isLoading = true;

    try {
      // Get necessary IDs - use FORMATTED IDs
      const talentId =
        this.hireData.formattedTalentId ||
        sessionStorage.getItem('talentId') ||
        this.talentId ||
        localStorage.getItem('talentId') ||
        sessionStorage.getItem('talentId') ||
        '';

      const scouterId =
        this.hireData.formattedScouterId || this.hireData.scouterId || '';

      const marketHireId = this.hireData.marketHireId || this.hireData.id;

      if (!talentId || !scouterId || !marketHireId) {
        throw new Error('Missing required IDs');
      }

      console.log('Using IDs for API:', {
        talentId,
        scouterId,
        marketHireId,
        hireData: this.hireData,
      });

      // Determine the API status
      const apiStatus =
        this.selectedAction === 'accept' ? 'offer-accepted' : 'offer-declined';

      // Call API with hire data
      this.endpointService
        .toggleMarketStatus(
          talentId,
          scouterId,
          marketHireId,
          apiStatus,
          this.hireData,
        )
        .subscribe({
          next: (response) => {
            this.isLoading = false;

            // Determine the display status
            const displayStatus =
              this.selectedAction === 'accept'
                ? 'Offers Accepted'
                : 'Offers Declined';

            // Show success message
            const message =
              this.selectedAction === 'accept'
                ? `✅ Offer from ${this.scouterName} accepted successfully!`
                : `❌ Offer from ${this.scouterName} declined.`;

            this.toastService.openSnackBar(
              message,
              this.selectedAction === 'accept' ? 'success' : 'warning',
            );

            // Dismiss with result
            this.modalCtrl.dismiss({
              action: this.selectedAction,
              success: true,
              response: response,
              newStatus: displayStatus,
              hireId: marketHireId,
              hire: {
                ...this.hireData,
                status: displayStatus,
                offerStatus: displayStatus,
                hireStatus: apiStatus,
              },
            });
          },
          error: (error) => {
            this.isLoading = false;
            console.error(`Error ${this.selectedAction}ing offer:`, error);

            // More detailed error logging
            console.error('API Error Details:', {
              status: error.status,
              message: error.message,
              error: error.error,
              url: error.url,
              talentId,
              scouterId,
              marketHireId,
            });

            this.toastService.openSnackBar(
              `Failed to ${this.selectedAction} offer: ${error.error?.message || 'Please check the IDs and try again'}`,
              'error',
            );

            // Still dismiss but with error
            this.modalCtrl.dismiss({
              action: this.selectedAction,
              success: false,
              error: error,
            });
          },
        });
    } catch (error: any) {
      this.isLoading = false;
      console.error('Error in confirmAction:', error);

      this.toastService.openSnackBar(
        `Error: ${error.message || 'Failed to process request'}`,
        'error',
      );
    }
  }

  // Cancel the confirmation
  cancelConfirmation() {
    this.showConfirmation = false;
    this.selectedAction = null;
  }

  // Get confirmation message based on action
  getConfirmationMessage(): string {
    if (this.selectedAction === 'accept') {
      return `Are you sure you want to accept this offer from ${this.scouterName}?`;
    } else if (this.selectedAction === 'decline') {
      return `Are you sure you want to decline this offer from ${this.scouterName}?`;
    }
    return '';
  }
}
