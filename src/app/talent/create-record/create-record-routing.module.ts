import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CreateRecordPage } from './create-record.page';

const routes: Routes = [
  {
    path: '',
    component: CreateRecordPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CreateRecordPageRoutingModule {}
