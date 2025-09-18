import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-view-talents-location-page',
  templateUrl: './view-talents-location-page.component.html',
  styleUrls: ['./view-talents-location-page.component.scss'],
})
export class ViewTalentsLocationPageComponent implements OnInit {
  headerHidden: boolean = false;
  images = imageIcons;
  constructor() {}

  ngOnInit() {}
}
