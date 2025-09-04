import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-scouter-dashboard',
  templateUrl: './scouter-dashboard.component.html',
  styleUrls: ['./scouter-dashboard.component.scss'],
})
export class ScouterDashboardComponent  implements OnInit {
  loading: string = 'loading...';
  showSpinner: boolean = true;
  constructor() { }

  ngOnInit() {}

}
