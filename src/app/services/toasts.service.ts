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
      data: { message, panelClass },
      duration: duration === undefined ? this.duration : duration,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: panelClass,
    });
  }

  closeSnackBar() {
    this.snackBar.dismiss();
  }
}
// toasts.service.ts

// import { Injectable } from '@angular/core';
// import { ToastController } from '@ionic/angular';

// @Injectable({
//   providedIn: 'root',
// })
// export class ToastsService {
//   constructor(private toastController: ToastController) {}

//   async openSnackBar(
//     message: string,
//     type: 'success' | 'error' | 'warning' | 'info' = 'success',
//     duration: number = 3000
//   ): Promise<void> {
//     const toast = await this.toastController.create({
//       message: message,
//       duration: duration,
//       color: this.getColor(type),
//       position: 'bottom',
//       buttons: [
//         {
//           text: 'OK',
//           role: 'cancel',
//         },
//       ],
//     });

//     await toast.present();
//   }

//   private getColor(type: string): string {
//     switch (type) {
//       case 'success':
//         return 'success';
//       case 'error':
//         return 'danger';
//       case 'warning':
//         return 'warning';
//       default:
//         return 'primary';
//     }
//   }

//   async presentToast(
//     message: string,
//     color: string = 'success',
//     duration: number = 3000
//   ): Promise<void> {
//     const toast = await this.toastController.create({
//       message: message,
//       duration: duration,
//       color: color,
//       position: 'bottom',
//     });

//     await toast.present();
//   }
// }
