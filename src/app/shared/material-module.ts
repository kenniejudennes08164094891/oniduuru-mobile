import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import {MatMenuModule} from '@angular/material/menu';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatSelectModule} from "@angular/material/select";
import {MatRadioModule} from '@angular/material/radio';

// ng generate module shared/material --module=app --flat

const materialModules = [
MatButtonModule, MatInputModule, MatIconModule, MatCardModule, MatToolbarModule,MatMenuModule,
MatFormFieldModule,MatSelectModule,MatRadioModule
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    materialModules
  ],
  exports: [materialModules]
})
export class MaterialModule { }
