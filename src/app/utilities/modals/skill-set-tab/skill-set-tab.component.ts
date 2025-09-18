import { Component, Input, OnInit } from '@angular/core';
import { MockRecentHires, MockPayment } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-skill-set-tab',
  templateUrl: './skill-set-tab.component.html',
  styleUrls: ['./skill-set-tab.component.scss'],
})
export class SkillSetTabComponent implements OnInit {
  @Input() hire: any; // ✅ receive hire directly
  images = imageIcons;
  // hire!: MockPayment; // single user

  ngOnInit() {
    // ✅ Pick a single hire by ID, e.g. "1"
    this.hire = MockRecentHires.find((h) => h.id === '1')!;
  }
}
