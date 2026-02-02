import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';

@Component({
  selector: 'app-reels-and-documentation-tab',
  templateUrl: './reels-and-documentation-tab.component.html',
  styleUrls: ['./reels-and-documentation-tab.component.scss'],
  standalone: false,
})
export class ReelsAndDocumentationTabComponent implements OnInit {
  @Input() pictorialDocumentations: any[] = [];
  @Input() hire: any;
  images =imageIcons;

  pictures: string[] = [];

  ngOnInit() {
    // Use only API data - no fallback mock data
    if (this.pictorialDocumentations && this.pictorialDocumentations.length > 0) {
      // Filter out any empty/null values
      this.pictures = this.pictorialDocumentations
        .filter(item => item && typeof item === 'string' && item.trim() !== '')
        .map(item => item.trim());
    }
  }

  handleImageError(index: number) {
    // Remove the broken image from the array
    this.pictures.splice(index, 1);
    // Create a new array to trigger change detection
    this.pictures = [...this.pictures];
  }
  
  // If video functionality is added in the future
  get hasVideo(): boolean {
    return false; // Currently no video support
  }
}