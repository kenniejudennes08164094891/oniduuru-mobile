import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-reconsider-offer-modal',
  templateUrl: './reconsider-offer-modal.component.html',
  styleUrls: ['./reconsider-offer-modal.component.scss']
})
export class ReconsiderOfferModalComponent implements OnInit {
  @Input() talentId: string = '';
  @Input() talentName: string = '';
  @Input() originalAmount: number = 0;
  @Input() originalJobDescription: string = '';
  @Input() isModalOpen: boolean = false; // Add this
  
  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>(); // Add this

  offerForm!: FormGroup;
  isSubmitting: boolean = false;
  today: string;

  constructor(private fb: FormBuilder) {
    const today = new Date();
    this.today = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.initializeForm();
  }

  initializeForm() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    this.offerForm = this.fb.group({
      amount: [
        this.originalAmount || 0, 
        [Validators.required, Validators.min(1000)]
      ],
      jobDescription: [
        this.originalJobDescription || '', 
        [Validators.required, Validators.minLength(20), Validators.maxLength(500)]
      ],
      startDate: [tomorrowStr, [Validators.required]],
      comments: ['']
    });
  }

  onSubmit() {
    if (this.offerForm.valid) {
      this.isSubmitting = true;
      
      const offerData = {
        ...this.offerForm.value,
        talentId: this.talentId,
        talentName: this.talentName,
        originalAmount: this.originalAmount,
        originalJobDescription: this.originalJobDescription
      };

      console.log('Submitting revised offer:', offerData);
      
      // Simulate API call
      setTimeout(() => {
        this.submitted.emit(offerData);
        this.closeModal();
        this.isSubmitting = false;
      }, 1500);
    }
  }

  onCancel() {
    this.cancelled.emit();
    this.closeModal();
  }

  closeModal() {
    this.close.emit();
  }
}