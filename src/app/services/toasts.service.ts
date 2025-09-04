import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {ToastComponent} from "../utilities/toast/toast.component";

@Injectable({
  providedIn: 'root'
})
export class ToastsService {

  duration:number = 4000;
  constructor(private snackBar: MatSnackBar) {}


  openSnackBar(message: string, panelClass: string, duration?:number) {
    this.snackBar.openFromComponent(ToastComponent, {
      data: {message,panelClass},
      duration: duration === undefined ? this.duration : duration,
      verticalPosition: 'top',
      horizontalPosition: 'center',
      panelClass: panelClass,
    });
  }

  closeSnackBar(){
    this.snackBar.dismiss();
  }
}
