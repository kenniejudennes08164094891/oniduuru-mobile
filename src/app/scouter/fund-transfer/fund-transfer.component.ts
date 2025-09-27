import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-fund-transfer',
  templateUrl: './fund-transfer.component.html',
  styleUrls: ['./fund-transfer.component.scss'],
  standalone: false,
})
export class FundTransferComponent implements OnInit {
  images = imageIcons;
  constructor() {}

  ngOnInit() {}
}
