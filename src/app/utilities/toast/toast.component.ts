import { Component, Inject } from '@angular/core';
import {
  MatSnackBarRef,
  MAT_SNACK_BAR_DATA,
  MatSnackBarModule,
} from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: false,
  selector: 'app-toast',
  template: `
    <div
      class="snack-content font-euclid w-full"
      [ngClass]="{
        error: isErrorMessage,
        success: isSuccessMessage,
        warn: isWarningMessage,
        info: isInfoMessage
      }"
    >
      <div class="flex items-center ">
        <span class="info-icon">
          <ion-icon name="information-circle-outline"></ion-icon>
        </span>
        <span class="text-base -mt-2">{{ data.message }}</span>
      </div>
      <span class="cancel-snack">
        <ion-icon
          name="close-outline"
          (click)="snackBarRef.dismiss()"
        ></ion-icon>
      </span>
    </div>
  `,
  styles: [
    `
      @import url('https://fonts.cdnfonts.com/css/euclid-circular-a');
      div {
        font-family: 'Euclid Circular A';
        color: white;
      }
      .snack-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        overflow: hidden;
        padding: 0.5rem;
      }

      .info-icon {
        margin-right: 1rem;
      }

      .cancel-snack {
        cursor: pointer;
      }

      .error {
        background-color: #b42318;
        color: white;
      }

      .success {
        background-color: #044c21;
        color: white;
      }

      .warn {
        background-color: #eb470c; //rgb(241, 158, 4);
        color: white;
      }

      .info {
        background-color: #0288d1;
        color: white;
      }
    `,
  ],
})
export class ToastComponent {
  isErrorMessage: boolean;
  isWarningMessage: boolean | any;
  isSuccessMessage: boolean | any;
  isInfoMessage: boolean | any;

  constructor(
    public snackBarRef: MatSnackBarRef<ToastComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: any
  ) {
    this.isSuccessMessage = data.panelClass.includes('success');
    this.isErrorMessage = data.panelClass.includes('error');
    this.isWarningMessage = data.panelClass.includes('warn');
    this.isInfoMessage = data.panelClass.includes('info');
  }
}
