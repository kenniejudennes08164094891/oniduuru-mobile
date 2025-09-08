import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-account-activation-page',
  templateUrl: './account-activation-page.component.html',
  styleUrls: ['./account-activation-page.component.scss'],
})
export class AccountActivationPageComponent implements OnInit {
  images = imageIcons;
  headerHidden: boolean = false;
  currentYear: number = new Date().getFullYear();

  constructor() {}

  ngOnInit() {}
}
