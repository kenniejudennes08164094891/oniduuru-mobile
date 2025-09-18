import { Component, OnInit, Input } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-view-all-talents-popup-modal',
  templateUrl: './view-all-talents-popup-modal.component.html',
  styleUrls: ['./view-all-talents-popup-modal.component.scss'],
})
export class ViewAllTalentsPopupModalComponent implements OnInit {
  images = imageIcons;

  @Input() hire: any; // ✅ receive hire from parent

  constructor() {}

  ngOnInit() {
    console.log('Hire received in modal:', this.hire);
  }
}
