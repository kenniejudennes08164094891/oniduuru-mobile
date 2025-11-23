// src/app/services/chat-visibility.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatVisibilityService {
  private isChatPageOpenSubject = new BehaviorSubject<boolean>(false);
  
  // Remove the global floating button control
  // private isFloatingButtonVisibleSubject = new BehaviorSubject<boolean>(true);

  // Observable for chat page status
  isChatPageOpen$: Observable<boolean> = this.isChatPageOpenSubject.asObservable();
  
  // Remove this observable since we'll handle visibility differently
  // isFloatingButtonVisible$: Observable<boolean> = this.isFloatingButtonVisibleSubject.asObservable();

  // Method to set chat page open status
  setChatPageOpen(isOpen: boolean): void {
    this.isChatPageOpenSubject.next(isOpen);
    // Remove this line - we don't want to control button visibility globally
    // this.isFloatingButtonVisibleSubject.next(!isOpen);
  }

  // Remove these methods since we're handling visibility differently
  /*
  setFloatingButtonVisible(isVisible: boolean): void {
    this.isFloatingButtonVisibleSubject.next(isVisible);
  }

  getIsFloatingButtonVisible(): boolean {
    return this.isFloatingButtonVisibleSubject.value;
  }
  */

  // Get current state
  getIsChatPageOpen(): boolean {
    return this.isChatPageOpenSubject.value;
  }
}