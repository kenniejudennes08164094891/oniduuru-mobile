import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-reconsider-confirmation-modal',
  templateUrl: './reconsider-confirmation-modal.component.html',
  styleUrls: ['./reconsider-confirmation-modal.component.scss']
})
export class ReconsiderConfirmationModalComponent {
  @Input() talentName: string = '';
  @Input() status: string = 'Offer Rejected'; // Make sure this exists
  @Input() isModalOpen: boolean = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}