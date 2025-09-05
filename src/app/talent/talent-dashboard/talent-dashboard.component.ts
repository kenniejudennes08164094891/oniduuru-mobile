import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-talent-dashboard',
  templateUrl: './talent-dashboard.component.html',
  styleUrls: ['./talent-dashboard.component.scss'],
})
export class TalentDashboardComponent  implements OnInit {
  loading: string = 'loading...';
  showSpinner: boolean = true;
  constructor() { }

  ngOnInit() {}

}
