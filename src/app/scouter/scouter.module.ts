import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ScouterPageRoutingModule } from './scouter-routing.module';
import { ScouterPage } from './scouter.page';
import {ScouterDashboardComponent} from "./scouter-dashboard/scouter-dashboard.component";
import {TalentPageModule} from "../talent/talent.module";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ScouterPageRoutingModule,
        TalentPageModule
    ],
  declarations: [ScouterPage,ScouterDashboardComponent]
})
export class ScouterPageModule {}
