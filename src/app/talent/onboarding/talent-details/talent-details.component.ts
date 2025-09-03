import { Component, OnInit } from '@angular/core';
import { IonicModule } from "@ionic/angular";

@Component({
  selector: 'app-talent-details',
  templateUrl: './talent-details.component.html',
  styleUrls: ['./talent-details.component.scss'],
  imports: [IonicModule],
  standalone: true
})
export class TalentDetailsComponent  implements OnInit {

  constructor() { }

  ngOnInit() {}

}
