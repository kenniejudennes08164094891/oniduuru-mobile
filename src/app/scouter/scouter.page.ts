import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-scouter',
  templateUrl: './scouter.page.html',
  styleUrls: ['./scouter.page.scss'],
  standalone: false,
})
export class ScouterPage implements OnInit {
  constructor(private location: Location) {}

  goBack() {
    this.location.back();
  }

  ngOnInit() {}
}
