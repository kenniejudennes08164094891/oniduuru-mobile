import { Component, Input, OnInit } from '@angular/core';
import { imageIcons } from 'src/app/models/stores';
import {EndpointService} from "../../../services/endpoint.service";
import {AuthService} from "../../../services/auth.service";
import {ToastsService} from "../../../services/toasts.service";
import {EmmittersService} from "../../../services/emmitters.service";

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
  videoReel: any = {};
  hasVideo: boolean = true;
  constructor(private marketService: EndpointService, private authService: AuthService, private toast: ToastsService, private emitterService:EmmittersService) {
    this.getTalentReel();
  }

  getTalentReel() {
    const talentId = this.emitterService.getTalentIdForHire();
   if(talentId){
     this.marketService.fetchTalentReel(talentId).subscribe({
       next: (response: any) => {
         this.hasVideo = true;
         this.videoReel = response;
         console.clear();
         console.log("videoReel>>", this.videoReel);
       },
       error: (err: any) => {
         console.error("err>>", err);
         //  this.toast.openSnackBar(`${err?.error?.message || err?.statusText}`, 'error');
         if (err?.status === 401) {
           this.authService.logoutUser();
           this.toast.openSnackBar("Your session is expired!", 'error');
         }
       }
     })
   }
  }

  ngOnInit() {
    this.getTalentReel();
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

}
