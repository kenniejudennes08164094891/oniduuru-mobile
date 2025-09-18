import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-recent-reviews-tab',
  templateUrl: './recent-reviews-tab.component.html',
  styleUrls: ['./recent-reviews-tab.component.scss'],
})
export class RecentReviewsTabComponent implements OnInit {
  images = imageIcons;
  @Input() hire: any;

  constructor(private toastController: ToastController) {}

  ngOnInit() {
    // Nothing special to init because recentReview is an array
  }

  setRating(review: any, star: number) {
    review.yourRating = star;
  }
}
