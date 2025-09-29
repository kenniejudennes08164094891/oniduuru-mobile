import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewHiresPageRoutingModule } from './view-hires-routing.module';

import { ViewHiresPage } from './view-hires.page';
import { SharedModule } from '../../shared/shared.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViewHiresPageRoutingModule,
    SharedModule
  ],
  declarations: [ViewHiresPage] // declare the header component here
})
export class ViewHiresPageModule {}
