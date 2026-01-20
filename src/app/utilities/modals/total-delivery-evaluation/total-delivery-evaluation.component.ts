// total-delivery-evaluation.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-total-delivery-evaluation',
  templateUrl: './total-delivery-evaluation.component.html',
  styleUrls: ['./total-delivery-evaluation.component.scss'],
  standalone: false,
})
export class TotalDeliveryEvaluationComponent implements OnInit, OnChanges {
  @Input() hire: any;
  @Input() isModalOpen: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() ratingUpdated = new EventEmitter<{
    hireId: string;
    rating: number;
  }>();

  // Form state
  comment: string = '';
  rating: number = 0;
  paymentOption: string = 'wallet';
  attachments: File[] = [];
  location: string = '';
  isLoading: boolean = false;
  hasRatingSelected: boolean = false;

  constructor(
    private toastController: ToastController,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['hire'] && changes['hire'].currentValue) {
      this.initializeForm();
    }

    if (changes['isModalOpen'] && changes['isModalOpen'].currentValue) {
      // Reset form when modal opens
      if (this.isModalOpen) {
        this.resetForm();
      }
    }
  }

  private initializeForm() {
    // Initialize rating with existing value if available
    if (this.hire?.yourRating && this.hire.yourRating > 0) {
      this.rating = this.hire.yourRating;
      this.hasRatingSelected = true;
    } else {
      this.rating = 0;
      this.hasRatingSelected = false;
    }

    // Initialize comment if available
    if (this.hire?.yourComment) {
      this.comment = this.hire.yourComment;
    }

    // Initialize payment option
    this.paymentOption = 'wallet';
  }

  async showToast(message: string, color: string = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'top',
      color,
    });
    toast.present();
  }

  closeModal() {
    this.close.emit();
  }

  // Rating logic
  setRating(star: number) {
    this.rating = star;
    this.hasRatingSelected = star > 0;
    console.log('Rating set to:', star, 'hasRatingSelected:', this.hasRatingSelected);
  }

  // File attachment logic
  handleFileInput(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.attachments = Array.from(files);
    }
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
  }

  // Simulate location picker
  setLocation(loc: string) {
    this.location = loc;
  }

  // Get job description for display
  getJobDescription(): string {
    if (this.hire?.jobDescription) {
      return this.hire.jobDescription;
    }
    return 'No job description available';
  }

  // Check if form is valid for submission
  isFormValid(): boolean {
    const hasRating = this.rating > 0 && this.hasRatingSelected;
    console.log('Form validation check:', {
      rating: this.rating,
      hasRatingSelected: this.hasRatingSelected,
      comment: this.comment?.trim(),
      isFormValid: hasRating
    });
    return hasRating;
  }

  // Submit comment to API
  async submitEvaluation() {
    console.log('Submit evaluation called, form valid:', this.isFormValid());

    if (!this.isFormValid()) {
      if (this.rating === 0) {
        await this.showToast('Please provide a rating before submitting!');
      }
      return;
    }

    if (!this.hire?.id) {
      await this.showToast('Invalid hire data');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      await this.showToast('User not authenticated');
      return;
    }

    // Check if we have marketHireId (required for API)
    if (!this.hire.marketHireId) {
      console.error('❌ Missing marketHireId for API call:', this.hire);
      await this.showToast('Unable to submit evaluation: Missing market data');
      return;
    }

    this.isLoading = true;

    // Prepare payload according to API specification
    const payload = {
      scouterId: scouterId,
      remark: this.comment.trim() || 'No comment provided',
      rating: this.rating,
    };

    console.log('📝 Submitting evaluation:', {
      marketHireId: this.hire.marketHireId,
      payload,
      hireData: this.hire
    });

    // Call the API endpoint
   this.scouterService.updateMarketComment(this.hire.marketHireId, payload).subscribe({
    next: (response) => {
      console.log('✅ Evaluation submitted successfully:', response);

      // Update local hire data
      this.hire.yourRating = this.rating;
      this.hire.yourComment = this.comment;

      // Create the new comment object
      const newComment = {
        scouterId: scouterId,
        dateOfComment: new Date().toISOString(),
        remark: this.comment,
        rating: this.rating
      };

      // Handle satisFactoryCommentByScouter update
      if (!this.hire.satisFactoryCommentByScouter || this.hire.satisFactoryCommentByScouter.trim() === '') {
        // If empty, create new JSON
        this.hire.satisFactoryCommentByScouter = JSON.stringify(newComment);
      } else {
        try {
          // Try to parse existing
          let existingComment = JSON.parse(this.hire.satisFactoryCommentByScouter);
          
          // If it's an object (not array), update it
          if (typeof existingComment === 'object' && !Array.isArray(existingComment)) {
            this.hire.satisFactoryCommentByScouter = JSON.stringify(newComment);
          }
        } catch (error) {
          // If parsing fails, create new
          this.hire.satisFactoryCommentByScouter = JSON.stringify(newComment);
        }
      }

      // Emit event to parent components
      this.ratingUpdated.emit({
        hireId: this.hire.id,
        rating: this.rating,
      });

      this.showToast('Evaluation submitted successfully!', 'success');
      this.resetForm();
      this.closeModal();
    },
      error: (error) => {
        console.error('❌ Failed to submit evaluation:', error);
        let errorMessage = 'Failed to submit evaluation';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Session expired. Please login again.';
        } else if (error.status === 404) {
          errorMessage = 'Market engagement not found.';
        }

        this.showToast(errorMessage, 'danger');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

getPreviousComments(): any[] {
  if (!this.hire?.satisFactoryCommentByScouter) {
    return [];
  }

  console.log('🔍 Getting previous comments:', this.hire.satisFactoryCommentByScouter);

  try {
    let comments = this.hire.satisFactoryCommentByScouter;

    // If it's a string, parse it
    if (typeof comments === 'string') {
      comments = JSON.parse(comments);
    }

    // If it's a single object (not an array), wrap it in an array
    if (comments && typeof comments === 'object' && !Array.isArray(comments)) {
      return [comments];
    }

    // Ensure it's an array
    if (Array.isArray(comments)) {
      return comments.filter(comment => comment && (comment.remark || comment)).reverse();
    }

    // If all else fails, return empty array
    return [];
  } catch (error) {
    console.error('Error parsing previous comments:', error);
    
    // If parsing fails but there's content, show it as-is
    if (typeof this.hire.satisFactoryCommentByScouter === 'string') {
      return [{ remark: this.hire.satisFactoryCommentByScouter }];
    }
    
    return [];
  }
}

  private resetForm() {
    this.comment = '';
    this.rating = 0;
    this.hasRatingSelected = false;
    this.paymentOption = 'wallet';
    this.attachments = [];
    this.location = '';
    this.isLoading = false;
  }
}