// reels-and-documentation-tab.component.ts
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-reels-and-documentation-tab',
  templateUrl: './reels-and-documentation-tab.component.html',
  styleUrls: ['./reels-and-documentation-tab.component.scss'],
  standalone: false,
})
export class ReelsAndDocumentationTabComponent implements OnInit {
  @Input() pictorialDocumentations: any[] = [];
  @Input() hire: any; // Keep for fallback
  
  // Store the pictures with error handling
  pictures: string[] = [];

  ngOnInit() {
    // If no API data, use hire data or defaults
    if (!this.pictorialDocumentations || this.pictorialDocumentations.length === 0) {
      if (this.hire?.pictures) {
        this.pictures = this.hire.pictures;
      } else {
        // Default placeholder images
        this.pictures = [
          'assets/images/portfolio1.jpg',
          'assets/images/portfolio2.jpg',
          'assets/images/portfolio3.jpg'
        ];
      }
    } else {
      // Use API data
      this.pictures = [...this.pictorialDocumentations];
    }
  }

  // Method to handle image load errors
  handleImageError(index: number) {
    // Use a fallback image
    const fallbackImage = `assets/images/portfolio${(index % 3) + 1}.jpg`;
    this.pictures[index] = fallbackImage;
  }
  
  // Check if there's a video (reel) - you might need to adjust based on your API response
  get hasVideo(): boolean {
    return false; // Adjust based on your API response
  }
  
  get videoUrl(): string | null {
    return null; // Adjust based on your API response
  }
}