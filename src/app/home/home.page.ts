import { Component } from '@angular/core';
import { accountOptions } from '../models/stores';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

   accountOption: any[] = accountOptions;
  constructor() {}

}
