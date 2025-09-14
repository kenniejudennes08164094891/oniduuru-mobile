import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-slideshow-text-for-view-hires',
  templateUrl: './slideshow-text-for-view-hires.component.html',
  styleUrls: ['./slideshow-text-for-view-hires.component.scss'],
})
export class SlideshowTextForViewHiresComponent implements OnInit {
  /**
   * The list of text strings to display in the marquee.
   */
  @Input() slideshowTexts: string[] = [];

  /**
   * The desired speed in seconds per item. A higher number means a slower scroll.
   * Example: 4 seconds per item.
   */
  @Input() speed: number = 4;

  // Internal properties
  public marqueeTexts: string[] = [];
  public animationDuration: string = '20s'; // A default value

  ngOnInit() {
    // We only need to set this up if there are items to display
    if (this.slideshowTexts.length > 0) {
      // 1. Calculate the total animation duration to maintain a consistent speed
      const duration = this.slideshowTexts.length * this.speed;
      this.animationDuration = `${duration}s`;

      // 2. Duplicate the content to create a seamless loop effect
      // The animation will scroll through the first half. When it ends, it
      // instantly jumps back to the start, which looks identical to the start
      // of the second half, creating the illusion of an infinite loop.
      this.marqueeTexts = [...this.slideshowTexts, ...this.slideshowTexts];
    }
  }
}
