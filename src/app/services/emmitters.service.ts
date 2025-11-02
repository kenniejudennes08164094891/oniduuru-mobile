import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EmmittersService {
  // Emits updated profile picture data
  uploadProfilePic$: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  // Emits when a reel replacement occurs
  replaceReel$: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);

  constructor() {}

  // Profile Picture Stream
  public setProfilePicture(picture: string): void {
    this.uploadProfilePic$.next(picture);
  }

  public getProfilePicture(): Observable<any> {
    return this.uploadProfilePic$.asObservable();
  }

  // Replace Reel Stream
  public setReplacedReel(isReplaceReel: boolean): void {
    this.replaceReel$.next(isReplaceReel);
  }

  public getReplaceReel(): Observable<boolean> {
    return this.replaceReel$.asObservable();
  }
}
