import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

// adjust this path to where your header really is
import { TalentHeaderComponent } from '../talent/talent-header/talent-header.component';

@NgModule({
  declarations: [
    TalentHeaderComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule
  ],
  exports: [
    TalentHeaderComponent
  ]
})
export class SharedModule {}
