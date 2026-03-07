import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastComponent } from './toast/toast.component';
import { MaterialModule } from '../shared/material-module';
import { SpinnerComponent } from './spinner/spinner.component';

@NgModule({
  // utilities module is now purely a shared component collection;
  // it no longer defines any routes so it can be imported freely without
  // polluting feature modules.  The utilities page is now a standalone
  // component (see utilities.page.ts) and therefore does not need to be
  // declared here.
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MaterialModule,
    SpinnerComponent, // standalone component must be imported before exporting
  ],
  declarations: [ToastComponent],
  exports: [ToastComponent, SpinnerComponent],
})
export class UtilitiesPageModule {}
