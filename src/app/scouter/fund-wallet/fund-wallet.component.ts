import { Component, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-fund-wallet',
  templateUrl: './fund-wallet.component.html',
  styleUrls: ['./fund-wallet.component.scss'],
  standalone: false,
})
export class FundWalletComponent implements OnInit {
images = imageIcons
  constructor() {}

  ngOnInit() {}
}
