import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-reconsider-confirmation-modal',
  templateUrl: './reconsider-confirmation-modal.component.html',
  styleUrls: ['./reconsider-confirmation-modal.component.scss']
})
export class ReconsiderConfirmationModalComponent {
  @Input() talentName: string = '';
  @Input() isModalOpen: boolean = false; // Add this
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>(); // Add this

  onConfirm() {
    this.confirmed.emit();
    this.closeModal();
  }

  onCancel() {
    this.cancelled.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}