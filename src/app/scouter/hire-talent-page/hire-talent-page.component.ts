import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-hire-talent-page',
  templateUrl: './hire-talent-page.component.html',
  styleUrls: ['./hire-talent-page.component.scss'],
})
export class HireTalentPageComponent implements OnInit {
  headerHidden: boolean = false;

  constructor(private router: Router) {}

  goToViewHires() {
    // this.router.navigate(['/scouter/view-hires']);
  }

  ngOnInit() {}
}
