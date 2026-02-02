import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-recent-reviews-tab',
  templateUrl: './recent-reviews-tab.component.html',
  styleUrls: ['./recent-reviews-tab.component.scss'],
  standalone: false,
})
export class RecentReviewsTabComponent implements OnInit {
  @Input() marketReviews: any[] = [];
  @Input() hire: any;

  images = imageIcons


      ngOnInit() {
    // Use only API data - no fallback mock data
    if (!this.marketReviews || !Array.isArray(this.marketReviews)) {
      this.marketReviews = [];
    }
  }

  // Map API review format to your expected format
  get formattedReviews(): any[] {
    if (!this.marketReviews || this.marketReviews.length === 0) {
      return [];
    }

    return this.marketReviews
      .filter(review => review && (
        review.reviewerName || review.name || review.comment || review.review
      ))
      .map((review: any) => {
        // Try to parse date
        let date = new Date();
        try {
          if (review.date) {
            date = new Date(review.date);
            if (isNaN(date.getTime())) {
              date = new Date();
            }
          }
        } catch (e) {
          date = new Date();
        }

        return {
          profilePic: review.profilePicture || review.profilePic || 'assets/images/default-avatar.png',
          name: review.reviewerName || review.name || 'Anonymous',
          comment: review.comment || review.review || 'No comment provided',
          yourRating: review.rating || review.yourRating || 0,
          date: date.toISOString()
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date, newest first
  }
}