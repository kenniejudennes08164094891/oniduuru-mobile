// wallet-events.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WalletEventsService {
  private walletProfileCreatedSubject = new Subject<void>();
  
  walletProfileCreated$ = this.walletProfileCreatedSubject.asObservable();
  
  emitWalletProfileCreated(): void {
    console.log('🚀 Emitting wallet profile created event');
    this.walletProfileCreatedSubject.next();
  }
}