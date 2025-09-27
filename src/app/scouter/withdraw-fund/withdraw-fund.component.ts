import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-withdraw-fund',
  templateUrl: './withdraw-fund.component.html',
  styleUrls: ['./withdraw-fund.component.scss'],
  standalone: false,
})
export class WithdrawFundComponent implements OnInit {
  images = imageIcons;
  constructor() {}

  ngOnInit() {}
}
