// reconsider-offer-modal.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { ModalController } from '@ionic/angular'; // ✅ ADD THIS

@Component({
  selector: 'app-reconsider-offer-modal',
  templateUrl: './reconsider-offer-modal.component.html',
  styleUrls: ['./reconsider-offer-modal.component.scss'],
})
export class ReconsiderOfferModalComponent implements OnInit {
  @Input() talentId: string = '';
  @Input() talentName: string = '';
  @Input() originalAmount: number = 0;
  @Input() originalJobDescription: string = '';
  @Input() isModalOpen: boolean = false;
  @Input() status: string = 'Offer Rejected';
  @Input() cssClass: string = '';

  @Output() submitted = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  offerForm!: FormGroup;
  isSubmitting: boolean = false;
  today: string;

  // For formatted amount display
  formattedAmount: string = '';

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController, // ✅ ADD THIS
  ) {
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

    // Format the original amount for display
    this.formattedAmount = this.formatNumber(this.originalAmount);

    this.offerForm = this.fb.group({
      // AStore raw numeric value but display formatted
      amount: [
        this.originalAmount || 0,
        [
          Validators.required,
          Validators.min(1000),
          this.greaterThanOrEqualToOriginal.bind(this),
        ],
      ],
      // Pre-fill with original job description
      jobDescription: [
        this.originalJobDescription || '',
        [
          Validators.required,
          Validators.minLength(20),
          Validators.maxLength(500),
        ],
      ],
      startDate: [tomorrowStr, [Validators.required]],
    });

    // Set up amount formatting
    this.setupAmountFormatting();

    // Debug: Log initial form state
    console.log('Form initialized:', {
      amountValue: this.offerForm.get('amount')?.value,
      jobDescriptionValue: this.offerForm.get('jobDescription')?.value,
      startDateValue: this.offerForm.get('startDate')?.value,
    });
  }

  // Custom validator: Revised amount must be greater than or equal to original
  private greaterThanOrEqualToOriginal(
    control: AbstractControl,
  ): ValidationErrors | null {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null; // Let required validator handle empty values
    }

    const numericValue =
      typeof value === 'string' ? this.removeFormatting(value) : Number(value);

    if (isNaN(numericValue)) {
      return null; // Let other validators handle invalid numbers
    }

    if (numericValue < this.originalAmount) {
      return {
        amountTooLow: {
          requiredAmount: this.originalAmount,
          currentAmount: numericValue,
        },
      };
    }

    return null; // Valid
  }

  private setupAmountFormatting() {
    // Format amount when form control value changes
    this.offerForm.get('amount')?.valueChanges.subscribe((value) => {
      if (value !== null && value !== undefined) {
        // Update formatted display
        this.formattedAmount = this.formatNumber(value);
      }
    });
  }

  // Format number with commas (e.g., 500000 -> 500,000)
  private formatNumber(value: number | string): string {
    if (value === null || value === undefined || value === '') return '';

    let num: number;

    if (typeof value === 'string') {
      // Remove all non-digit characters from string
      const cleaned = value.replace(/[^\d]/g, '');
      num = parseFloat(cleaned) || 0;
    } else {
      // It's already a number
      num = Number(value);
    }

    if (isNaN(num)) return '';

    // Format with commas (no decimal places for Naira)
    return num.toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // Remove formatting (commas) from number - accepts string only
  private removeFormatting(value: string): number {
    if (!value) return 0;

    // Remove all non-digit characters
    const cleaned = value.replace(/[^\d]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Handle amount input - format as user types
  onAmountInput(event: any) {
    const input = event.target;
    let value = input.value;

    // Allow only numbers and commas
    value = value.replace(/[^\d,]/g, '');

    // Get numeric value
    const numericValue = this.removeFormatting(value);

    // Format for display
    this.formattedAmount = this.formatNumber(numericValue);

    // Update form control with numeric value
    this.offerForm.get('amount')?.setValue(numericValue, { emitEvent: false });

    // Update input display with formatted value
    input.value = this.formattedAmount;
  }

  // Handle amount focus - show raw number for editing
  onAmountFocus(event: any) {
    const input = event.target;
    const amountControl = this.offerForm.get('amount');
    if (amountControl?.value) {
      // Show raw number without formatting for easier editing
      input.value = amountControl.value.toString();
    }
  }

  // Handle amount blur - format with commas
  onAmountBlur(event: any) {
    const input = event.target;
    const amountControl = this.offerForm.get('amount');

    if (amountControl?.value) {
      // Get numeric value from input (which might have commas)
      const numericValue = this.removeFormatting(input.value);

      // Update formatted display
      this.formattedAmount = this.formatNumber(numericValue);

      // Update form control
      amountControl.setValue(numericValue);
      amountControl.markAsTouched();

      // Update input display
      input.value = this.formattedAmount;
    }
  }

  // Add this new method
  onAmountInputChange(value: string) {
    // Allow only numbers and commas
    value = value.replace(/[^\d,]/g, '');

    // Get numeric value
    const numericValue = this.removeFormatting(value);

    // Format for display
    this.formattedAmount = this.formatNumber(numericValue);

    // Update form control with numeric value
    this.offerForm.get('amount')?.setValue(numericValue);
    this.offerForm.get('amount')?.markAsTouched();
  }

  // Helper method for date formatting in backend payload
  private formatDateForPayload(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  // Helper method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onCancel() {
    this.cancelled.emit();
    this.modalCtrl.dismiss();
  }

  closeModal() {
    this.cancelled.emit();
    this.modalCtrl.dismiss();
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return 'Sending Offer...';
    }
    return this.status === 'Offer Rejected'
      ? 'Send Revised Offer'
      : 'Update Offer';
  }

  onSubmit() {
    console.log('Form submission attempted:', {
      valid: this.offerForm.valid,
      invalid: this.offerForm.invalid,
      errors: this.offerForm.errors,
      amountErrors: this.offerForm.get('amount')?.errors,
      jobDescriptionErrors: this.offerForm.get('jobDescription')?.errors,
      startDateErrors: this.offerForm.get('startDate')?.errors,
      amountValue: this.offerForm.get('amount')?.value,
      jobDescriptionValue: this.offerForm.get('jobDescription')?.value,
      startDateValue: this.offerForm.get('startDate')?.value,
    });

    // Get the amount value
    const amount = this.offerForm.get('amount')?.value;
    const startDate = this.offerForm.get('startDate')?.value;
    const jobDescription = this.offerForm.get('jobDescription')?.value;

    // Get current date for dateOfHire
    const currentDate = new Date();
    const formattedCurrentDate = this.formatDateForPayload(currentDate);
    const formattedStartDate = this.formatDateForPayload(new Date(startDate));

    const offerData = {
      // Form data
      amount: amount,
      jobDescription: jobDescription,
      startDate: startDate,

      // Original data
      talentId: this.talentId,
      talentName: this.talentName,
      originalAmount: this.originalAmount,
      originalJobDescription: this.originalJobDescription,
      newStatus: 'Awaiting Acceptance',

      // Backend API payload structure
      backendPayload: {
        hireStatus: 'awaiting-acceptance',
        amountToPay: amount?.toString() || '0',
        jobDescription: jobDescription || '',
        startDate: formattedStartDate,
        dateOfHire: formattedCurrentDate,
      },
    };

    if (this.offerForm.valid) {
      this.isSubmitting = true;

      console.log('Submitting revised offer:', offerData);

      // Emit the form data to parent component
      this.submitted.emit(offerData);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.offerForm);

      // Don't emit when invalid
      console.log('Form is invalid, not submitting');
    }
  }
}
