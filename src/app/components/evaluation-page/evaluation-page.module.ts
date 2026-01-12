import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EvaluationPageComponent } from './evaluation-page.component';

@NgModule({
  declarations: [EvaluationPageComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,  // ✅ Required for <ion-*>
  ],
  exports: [EvaluationPageComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ✅ Allows Ionic Web Components
})
export class EvaluationPageModule {}
