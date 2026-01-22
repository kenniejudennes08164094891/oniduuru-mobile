// recent-reviews-tab.component.ts
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-recent-reviews-tab',
  templateUrl: './recent-reviews-tab.component.html',
  styleUrls: ['./recent-reviews-tab.component.scss'],
  standalone: false,
})
export class RecentReviewsTabComponent implements OnInit {
  @Input() marketReviews: any[] = [];
  @Input() hire: any; // For fallback

  ngOnInit() {
    // If no API reviews, use fallback
    if (!this.marketReviews || this.marketReviews.length === 0) {
      if (this.hire?.recentReview) {
        this.marketReviews = this.hire.recentReview;
      } else {
        // Default reviews
        this.marketReviews = [
          {
            profilePic: 'assets/images/default-avatar.png',
            name: 'John Doe',
            comment: 'Excellent work, very professional!',
            rating: 5,
            date: new Date().toISOString()
          }
        ];
      }
    }
  }

  // Map API review format to your expected format
  get formattedReviews(): any[] {
    return this.marketReviews.map((review: any) => ({
      profilePic: review.profilePicture || review.profilePic || 'assets/images/default-avatar.png',
      name: review.reviewerName || review.name || 'Anonymous',
      comment: review.comment || review.review || 'No comment available',
      yourRating: review.rating || review.yourRating || 0,
      date: review.date || new Date().toISOString()
    }));
  }
}