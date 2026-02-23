import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type PaymentStatusValue = 'true' | 'false' | 'pendingPaymentVerification';

export interface PaymentStatus {
  status: PaymentStatusValue;
  receiptUrl?: string;
  transactionId?: string;
  timeOfUpload?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly STORAGE_KEY = 'payment_status';
  
  private paymentStatusSubject = new BehaviorSubject<PaymentStatus>(this.loadInitialState());

  paymentStatus$ = this.paymentStatusSubject.asObservable();

  constructor() {}

  private loadInitialState(): PaymentStatus {
    try {
      // Try to load from localStorage first
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate and normalize the status
        if (parsed && typeof parsed === 'object') {
          const status = parsed.status;
          if (status === 'true' || status === 'false' || status === 'pendingPaymentVerification') {
            return {
              status: status as PaymentStatusValue,
              receiptUrl: parsed.receiptUrl,
              transactionId: parsed.transactionId,
              timeOfUpload: parsed.timeOfUpload
            };
          }
        }
      }
      
      // If no stored state, try to get from user_data
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        let paidStatus = parsed.paid || parsed.details?.user?.paid || parsed.user?.paid;
        
        if (paidStatus === true || paidStatus === 'true') {
          return { status: 'true' };
        } else if (paidStatus === 'pendingPaymentVerification') {
          return { status: 'pendingPaymentVerification' };
        }
      }
    } catch (error) {
      console.error('Error loading payment status:', error);
    }
    
    return { status: 'false' };
  }

  private persistState(state: PaymentStatus): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error persisting payment status:', error);
    }
  }

  getPaymentStatus(): PaymentStatus {
    return this.paymentStatusSubject.value;
  }

  getPaymentStatusString(): PaymentStatusValue {
    return this.paymentStatusSubject.value.status;
  }

  // For backward compatibility - returns boolean if paid
  isPaid(): boolean {
    return this.paymentStatusSubject.value.status === 'true';
  }

  // Set just the status string
  setPaymentStatus(status: PaymentStatusValue | string) {
    let normalizedStatus: PaymentStatusValue = 'false';
    
    if (status === 'true') {
      normalizedStatus = 'true';
    } else if (status === 'pendingPaymentVerification') {
      normalizedStatus = 'pendingPaymentVerification';
    } else {
      normalizedStatus = 'false';
    }
    
    // Create a properly typed new state
    const newState: PaymentStatus = { 
      ...this.paymentStatusSubject.value,
      status: normalizedStatus 
    };
    
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
  }

  // Set full payment status with receipt details
  setFullPaymentStatus(status: {
    status: PaymentStatusValue;
    receiptUrl?: string;
    transactionId?: string;
    timeOfUpload?: string;
  }) {
    // Create a properly typed new state
    const newState: PaymentStatus = {
      status: status.status,
      receiptUrl: status.receiptUrl,
      transactionId: status.transactionId,
      timeOfUpload: status.timeOfUpload
    };
    
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
  }

  // For backward compatibility - handle old format
  setLegacyPaymentStatus(legacyStatus: { isPaid: boolean; receiptUrl?: string; transactionId?: string; timeOfUpload?: string }) {
    const newStatus: PaymentStatusValue = legacyStatus.isPaid ? 'true' : 'false';
    
    const newState: PaymentStatus = {
      status: newStatus,
      receiptUrl: legacyStatus.receiptUrl,
      transactionId: legacyStatus.transactionId,
      timeOfUpload: legacyStatus.timeOfUpload
    };
    
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
  }

  // Helper methods
  isPending(): boolean {
    return this.paymentStatusSubject.value.status === 'pendingPaymentVerification';
  }

  isUnpaid(): boolean {
    return this.paymentStatusSubject.value.status === 'false';
  }

  clearPaymentStatus() {
    const newState: PaymentStatus = { status: 'false' };
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
  }
}