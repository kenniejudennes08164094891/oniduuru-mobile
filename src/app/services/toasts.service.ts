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
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    duration?: number,
  ) {
    this.snackBar.openFromComponent(ToastComponent, {
      data: { message, panelClass, type },
      duration: duration === undefined ? this.duration : duration,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['safe-area-snackbar', panelClass], // Add safe area class
    });
  }

  closeSnackBar() {
    this.snackBar.dismiss();
  }
}