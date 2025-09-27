import { Component, OnInit } from '@angular/core';
import { talentOnboardingTabItems } from '../models/stores';
import { TabItems } from '../models/mocks';

@Component({
  selector: 'app-talent',
  templateUrl: './talent.page.html',
  styleUrls: ['./talent.page.scss'],
  standalone: false,
})
export class TalentPage implements OnInit {
  tabItems: TabItems[] = talentOnboardingTabItems;
  constructor() {}

  ngOnInit() {}
}
