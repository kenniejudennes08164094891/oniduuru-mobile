import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  defaultAvatar = 'https://api.dicebear.com/6.x/thumbs/svg?seed=default';
  private profileImageSubject = new BehaviorSubject<string>(this.defaultAvatar);

  private statusSubject = new BehaviorSubject<'online' | 'away' | 'offline'>(
    'offline'
  );
  status$ = this.statusSubject.asObservable();

  // Observable for components to subscribe
  profileImage$ = this.profileImageSubject.asObservable();

  constructor() {}

  // Call this when user logs in or reconnects
  setStatus(status: 'online' | 'away' | 'offline') {
    this.statusSubject.next(status);
  }

  getStatus() {
    return this.statusSubject.value;
  }

  // Update image
  setProfileImage(url: string) {
    this.profileImageSubject.next(url);
  }

  // Get current image (sync)
  getProfileImage(): string {
    return this.profileImageSubject.value;
  }
}
