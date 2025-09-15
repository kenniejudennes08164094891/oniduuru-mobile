import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  defaultAvatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=default';
  private profileImageSubject = new BehaviorSubject<string>(this.defaultAvatar);

  // Observable for components to subscribe
  profileImage$ = this.profileImageSubject.asObservable();

  // Update image
  setProfileImage(url: string) {
    this.profileImageSubject.next(url);
  }

  // Get current image (sync)
  getProfileImage(): string {
    return this.profileImageSubject.value;
  }
}
