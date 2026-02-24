// payment.service.ts
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
      // First, check user_data from login (this is the source of truth)
      const userData = localStorage.getItem('user_data');
      if (userData) {
        const parsed = JSON.parse(userData);
        
        // Extract paid status from user_data - this comes from login response
        // It could be: "true", "false", "pendingPaymentVerification", null, or undefined
        let paidStatus = parsed.paid;
        
        // Also check nested locations just in case
        if (paidStatus === undefined && parsed.details?.user?.paid) {
          paidStatus = parsed.details.user.paid;
        }
        if (paidStatus === undefined && parsed.user?.paid) {
          paidStatus = parsed.user.paid;
        }

        console.log('💰 PaymentService loading initial state from user_data:', paidStatus);

        // Normalize the value
        if (paidStatus === true || paidStatus === 'true') {
          return { status: 'true' };
        } else if (paidStatus === 'pendingPaymentVerification') {
          return { status: 'pendingPaymentVerification' };
        } else {
          // This handles: false, "false", null, undefined, or any other value
          return { status: 'false' };
        }
      }
      
      // If no user_data, try stored payment status (as fallback)
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
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

  isPaid(): boolean {
    return this.paymentStatusSubject.value.status === 'true';
  }

  isPending(): boolean {
    return this.paymentStatusSubject.value.status === 'pendingPaymentVerification';
  }

  isUnpaid(): boolean {
    return this.paymentStatusSubject.value.status === 'false';
  }

  setPaymentStatus(status: PaymentStatusValue | string | boolean) {
    let normalizedStatus: PaymentStatusValue = 'false';
    
    // Handle both string and boolean inputs
    if (status === true || status === 'true') {
      normalizedStatus = 'true';
    } else if (status === false || status === 'false') {
      normalizedStatus = 'false';
    } else if (status === 'pendingPaymentVerification') {
      normalizedStatus = 'pendingPaymentVerification';
    } else {
      normalizedStatus = 'false';
    }
    
    const newState: PaymentStatus = { 
      ...this.paymentStatusSubject.value,
      status: normalizedStatus 
    };
    
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
    
    console.log('💰 Payment status updated:', newState);
  }

  setFullPaymentStatus(status: {
    status: PaymentStatusValue;
    receiptUrl?: string;
    transactionId?: string;
    timeOfUpload?: string;
  }) {
    const newState: PaymentStatus = {
      status: status.status,
      receiptUrl: status.receiptUrl,
      transactionId: status.transactionId,
      timeOfUpload: status.timeOfUpload
    };
    
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
    
    console.log('💰 Full payment status updated:', newState);
  }

  clearPaymentStatus() {
    const newState: PaymentStatus = { status: 'false' };
    this.paymentStatusSubject.next(newState);
    this.persistState(newState);
  }

  // Sync with user_data from login
  syncWithUserData(userData: any): void {
    if (!userData) return;
    
    let paidStatus = userData.paid;
    
    if (paidStatus === undefined && userData.details?.user?.paid) {
      paidStatus = userData.details.user.paid;
    }
    
    console.log('🔄 Syncing payment service with user data:', paidStatus);
    
    if (paidStatus === true || paidStatus === 'true') {
      this.setPaymentStatus('true');
    } else if (paidStatus === 'pendingPaymentVerification') {
      this.setPaymentStatus('pendingPaymentVerification');
    } else {
      this.setPaymentStatus('false');
    }
  }
}