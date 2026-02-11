// reconsider-confirmation-modal.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalController } from '@ionic/angular'; // ✅ ADD THIS

@Component({
  selector: 'app-reconsider-confirmation-modal',
  templateUrl: './reconsider-confirmation-modal.component.html',
  styleUrls: ['./reconsider-confirmation-modal.component.scss'],
})


export class ReconsiderConfirmationModalComponent {
  @Input() talentName: string = '';
  @Input() status: string = 'Offer Rejected';
  @Input() isModalOpen: boolean = false;
  @Input() cssClass: string = '';

  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  // REMOVE: @Output() close = new EventEmitter<void>();

  constructor(private modalCtrl: ModalController) {}

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
    this.dismissModal();
  }

  closeModal() {
    this.cancelled.emit(); // Emit cancelled instead of close
    this.dismissModal();
  }

  private dismissModal() {
    this.modalCtrl.dismiss();
  }
}