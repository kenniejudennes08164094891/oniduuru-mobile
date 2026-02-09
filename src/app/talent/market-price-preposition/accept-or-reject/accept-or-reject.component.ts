// accept-or-reject.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-accept-or-reject',
  templateUrl: './accept-or-reject.component.html',
  styleUrls: ['./accept-or-reject.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AcceptOrRejectComponent implements OnInit {
  @Input() scouterName!: string;
  @Input() hireDate!: string;
  @Input() hireTime!: string;

  // Add confirmation state
  showConfirmation = false;
  selectedAction: 'accept' | 'decline' | null = null;

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    console.log('Modal opened for:', this.scouterName, 'on', this.hireDate, this.hireTime);
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

  // Confirm the selected action
  confirmAction() {
    if (this.selectedAction) {
      this.modalCtrl.dismiss({ action: this.selectedAction });
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