import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {
  private profileDataSource = new BehaviorSubject<any>(null);
  private profileImageSource = new BehaviorSubject<string | null>(null);

  profileData$ = this.profileDataSource.asObservable();
  profileImage$ = this.profileImageSource.asObservable();

  constructor() {
    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      this.setProfileData(JSON.parse(storedProfile));
    }
  }

  setProfileData(data: any) {
    this.profileDataSource.next(data);
    localStorage.setItem('profile', JSON.stringify(data));
  }

  getProfileData() {
    return this.profileDataSource.value;
  }

  setProfileImage(imageUrl: string) {
    this.profileImageSource.next(imageUrl);
  }

  getProfileImage() {
    return this.profileImageSource.value;
  }

  getScouterId(): string | null {
    const profile = this.getProfileData();
    return profile?.id || null;
  }
}
