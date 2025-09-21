import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { MockPayment, MockRecentHires } from 'src/app/models/mocks';

@Component({
  selector: 'app-total-delivery-evaluation',
  templateUrl: './total-delivery-evaluation.component.html',
  styleUrls: ['./total-delivery-evaluation.component.scss'],
})
export class TotalDeliveryEvaluationComponent implements OnInit {
  @Input() hire: any;
  @Input() isModalOpen: boolean = false;
  @Output() close = new EventEmitter<void>();

  // Form state
  comment: string = '';
  rating: number = 0;
  paymentOption: string = 'wallet';
  attachments: File[] = [];
  location: string = '';

  constructor(private toastController: ToastController) {}

  ngOnInit() {}


  async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000, // 2 seconds
      position: 'top',
      color: 'danger', // red for error
    });
    toast.present();
  }

  closeModal() {
    this.close.emit();
  }

  // Rating logic
  setRating(star: number) {
    this.rating = star;
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

  // Submit comment
  submitEvaluation() {
    // if (!this.comment.trim()) {
    //   this.showToast('Please write a comment before submitting!');
    //   return;
    // }

    const evaluationData = {
      hire: this.hire,
      comment: this.comment,
      rating: this.rating,
      paymentOption: this.paymentOption,
      attachments: this.attachments,
      location: this.location,
    };

    console.log('Evaluation Submitted:', evaluationData);

    // Reset modal state
    this.comment = '';
    this.rating = 0;
    this.paymentOption = 'wallet';
    this.attachments = [];
    this.location = '';
    this.closeModal();
  }
}
