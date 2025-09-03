import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ScouterPageRoutingModule } from './scouter-routing.module';

import { ScouterPage } from './scouter.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ScouterPageRoutingModule
  ],
  declarations: [ScouterPage]
})
export class ScouterPageModule {}
