import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

interface PaymentStatus {
  isPaid: boolean;
  receiptUrl?: string; // uploaded receipt image path
  transactionId?: string;
  timeOfUpload?: string; // time when receipt was uploaded to backend
}

@Injectable({
  providedIn: 'root',
})


export class PaymentService {
  // private BehaviorSubject to hold the state
  private paymentStatusSubject = new BehaviorSubject<PaymentStatus>({
    isPaid: true,
  });

  // expose as observable so components can subscribe
  paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor() {}

  // Get current value (for guards or instant checks)
  getPaymentStatus(): PaymentStatus {
    return this.paymentStatusSubject.value;
  }

  // Update state (e.g., after upload)
  setPaymentStatus(status: PaymentStatus) {
    this.paymentStatusSubject.next(status);
  }

  // Reset state (if needed, e.g., logout)
  clearPaymentStatus() {
    this.paymentStatusSubject.next({ isPaid: false });
  }
}
