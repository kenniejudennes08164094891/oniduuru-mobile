import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { EvaluationPageModule } from 'src/app/components/evaluation-page/evaluation-page.module';

import { ViewHiresPageRoutingModule } from './view-hires-routing.module';

import { ViewHiresPage } from './view-hires.page';
import { SharedModule } from '../../shared/shared.module';
import {SpinnerComponent} from "../../utilities/spinner/spinner.component";


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ViewHiresPageRoutingModule,
        SharedModule,
        EvaluationPageModule,
        SpinnerComponent
    ],
  declarations: [ViewHiresPage] // declare the header component here
})
export class ViewHiresPageModule {}
