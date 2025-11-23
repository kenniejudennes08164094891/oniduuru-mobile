import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-total-delivery-evaluation',
  templateUrl: './total-delivery-evaluation.component.html',
  styleUrls: ['./total-delivery-evaluation.component.scss'],
  standalone: false,
})
export class TotalDeliveryEvaluationComponent implements OnInit {
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

  constructor(
    private toastController: ToastController,
    private scouterService: ScouterEndpointsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Initialize rating with existing value if available
    if (this.hire?.yourRating) {
      this.rating = this.hire.yourRating;
    }
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

    // Update local hire object for immediate UI feedback
    if (this.hire) {
      this.hire.yourRating = star;
    }
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

  // Submit comment to API
  async submitEvaluation() {
    if (!this.hire?.id) {
      this.showToast('Invalid hire data');
      return;
    }

    if (this.rating === 0) {
      this.showToast('Please provide a rating before submitting!');
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    const scouterId = currentUser?.scouterId || currentUser?.id;

    if (!scouterId) {
      this.showToast('User not authenticated');
      return;
    }

    this.isLoading = true;

    const payload = {
      scouterId: scouterId,
      remark: this.comment.trim() || 'No comment provided',
      rating: this.rating,
    };

    this.scouterService.updateMarketComment(this.hire.id, payload).subscribe({
      next: (response) => {
        console.log('✅ Evaluation submitted successfully:', response);

        // Update mock data for development consistency
        const index = MockRecentHires.findIndex((h) => h.id === this.hire?.id);
        if (index !== -1) {
          MockRecentHires[index].yourRating = this.rating;
          MockRecentHires[index].yourComment = this.comment;
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
        this.showToast(error.message || 'Failed to submit evaluation');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private resetForm() {
    this.comment = '';
    this.rating = 0;
    this.paymentOption = 'wallet';
    this.attachments = [];
    this.location = '';
  }
}
