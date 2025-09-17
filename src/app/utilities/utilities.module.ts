import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { UtilitiesPageRoutingModule } from './utilities-routing.module';
import { UtilitiesPage } from './utilities.page';
import {ToastComponent} from "./toast/toast.component";
import {MaterialModule} from "../shared/material-module";
import { SpinnerComponent } from './spinner/spinner.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UtilitiesPageRoutingModule,
    MaterialModule
  ],
  declarations: [UtilitiesPage,ToastComponent], 
})
export class UtilitiesPageModule {}
