import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TalentPageRoutingModule } from './talent-routing.module';
import { TalentPage } from './talent.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TalentPageRoutingModule
  ],
  declarations: [
    TalentPage
  ] 
})
export class TalentPageModule { }
