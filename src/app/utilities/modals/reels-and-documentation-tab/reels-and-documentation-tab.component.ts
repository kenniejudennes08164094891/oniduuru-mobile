import { Component, OnInit, Input } from '@angular/core';
import { MockRecentHires, MockPayment } from 'src/app/models/mocks';

@Component({
  selector: 'app-reels-and-documentation-tab',
  templateUrl: './reels-and-documentation-tab.component.html',
  styleUrls: ['./reels-and-documentation-tab.component.scss'],
})
export class ReelsAndDocumentationTabComponent implements OnInit {
  // hire!: MockPayment; // single user
  @Input() hire: any; // ✅ receive hire directly

  ngOnInit() {
    // ✅ Select just one user (change ID as needed)
    this.hire = MockRecentHires.find((h) => h.id === '1')!;
  }

  getPictureUrls(pictures: File[] | string[]): string[] {
    if (!pictures) return [];
    return pictures.map((pic) =>
      typeof pic === 'string' ? pic : URL.createObjectURL(pic)
    );
  }
}
