import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastComponent } from '../utilities/toast/toast.component';

@Injectable({
  providedIn: 'root',
})
export class ToastsService {
  duration: number = 4000;

  constructor(private snackBar: MatSnackBar) {}

  openSnackBar(
    message: string,
    panelClass: string,
    type: 'success' | 'error' | 'warn' | 'info' = 'success',
    duration?: number,
  ) {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { message, panelClass, type },
      duration: duration === undefined ? this.duration : duration,
      verticalPosition: 'bottom',
      horizontalPosition: 'right',
      panelClass: ['safe-area-snackbar', panelClass], // Add safe area class
    });
  }

  // In your toasts.service.ts
  showPaymentVerificationError() {
    const message = 'Your account is undergoing payment verification.';
    const action = "You'll be notified once verification is complete.";

    // You can use a custom toast style for this specific error
    this.openSnackBar(message, 'error');

    // Optional: Show follow-up info toast
    setTimeout(() => {
      this.openSnackBar(action, 'info');
    }, 1500);
  }

  closeSnackBar() {
    this.snackBar.dismiss();
  }
}
