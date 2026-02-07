import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreateRecordPageRoutingModule } from './create-record-routing.module';

import { CreateRecordPage } from './create-record.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { LucideAngularModule, Pencil } from 'lucide-angular';
// import { TalentHeaderComponent } from '../../talent/talent-header/talent-header.component';




@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreateRecordPageRoutingModule,
    SharedModule,
   LucideAngularModule.pick({ Pencil }),
   
  ],
  declarations: [CreateRecordPage, 
    // TalentHeaderComponent
  ]
})
export class CreateRecordPageModule {}
