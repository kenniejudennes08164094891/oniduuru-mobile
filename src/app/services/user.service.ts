import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  catchError,
  Observable,
  of,
  Subscription,
} from 'rxjs';
import { endpoints } from '../models/endpoint';
import { environment } from 'src/environments/environment';
import { JwtInterceptorService } from './jwt-interceptor.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private profileImageSubject = new BehaviorSubject<string>(
    'assets/default-avatar.jpg'
  );
  public profileImage$ = this.profileImageSubject.asObservable();

  private profileDataSubject = new BehaviorSubject<any>(null);
  public profileData$ = this.profileDataSubject.asObservable();

  private statusSubject = new BehaviorSubject<'online' | 'away' | 'offline'>(
    'online'
  );
  public status$ = this.statusSubject.asObservable();

  private authSubscription!: Subscription;

  // ✅ NEW: Method to update entire profile
  updateFullProfile(profile: any): void {
    console.log('🔄 UserService: Updating full profile data', profile);

    // Update profile data
    this.profileDataSubject.next(profile);

    // Update profile image if available
    if (profile.profileImage || profile.profilePicture) {
      this.setProfileImage(profile.profileImage || profile.profilePicture);
    }

    // Cache in localStorage
    localStorage.setItem('user_profile_data', JSON.stringify(profile));
  }

  // ✅ NEW: Method to refresh from storage
  refreshFromStorage(): void {
    const profileData = localStorage.getItem('user_profile_data');
    const userData = localStorage.getItem('user_data');
    const profileImage = localStorage.getItem('profile_image');

    if (profileData) {
      try {
        this.profileDataSubject.next(JSON.parse(profileData));
      } catch (e) {
        console.error('Error parsing profile data:', e);
      }
    } else if (userData) {
      try {
        this.profileDataSubject.next(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }

    if (profileImage) {
      this.profileImageSubject.next(profileImage);
    }
  }

  constructor(
    private authService: AuthService, // Inject AuthService
    private http: HttpClient
  ) {
    this.initializeProfileImage();

    // ✅ NEW: Listen to auth state changes
    this.setupAuthListeners();

    const storedProfile = localStorage.getItem('profile');
    if (storedProfile) {
      this.setProfileData(JSON.parse(storedProfile));
    }
  }

  // ✅ NEW: Method to completely reset service state
  public resetUserData(): void {
    console.log('🔄 UserService: Resetting all user data');

    this.profileImageSubject.next('assets/default-avatar.jpg');
    this.profileDataSubject.next(null);
    this.statusSubject.next('online');

    // Don't clear profile_image from localStorage here - let auth service handle complete cleanup
  }

  private setupAuthListeners(): void {
    // Listen for login events
    this.authSubscription = this.authService.userLoggedIn$.subscribe(
      (loggedIn) => {
        if (loggedIn) {
          console.log('🔄 UserService: User logged in, reloading profile data');
          this.initializeProfileImage();
          this.loadUserDataFromStorage();
        } else {
          // ✅ NEW: Handle logout by resetting data
          console.log('🔄 UserService: User logged out, resetting data');
          this.resetUserData();
        }
      }
    );

    // Listen for login events
    this.authSubscription = this.authService.userLoggedIn$.subscribe(
      (loggedIn) => {
        if (loggedIn) {
          console.log('🔄 UserService: User logged in, reloading profile data');
          this.initializeProfileImage();
          this.loadUserDataFromStorage();
        }
      }
    );

    // Listen for profile update events
    this.authSubscription.add(
      this.authService.profileUpdated$.subscribe((updated) => {
        if (updated) {
          console.log('🔄 UserService: Profile updated, reloading data');
          this.initializeProfileImage();
          this.loadUserDataFromStorage();
        }
      })
    );

    // Listen for current user data changes
    this.authSubscription.add(
      this.authService.currentUser$.subscribe((user) => {
        if (user) {
          console.log('🔄 UserService: Current user data updated');
          this.setProfileData(user);
          if (user.profileImage || user.profilePicture) {
            this.setProfileImage(user.profileImage || user.profilePicture);
          }
        }
      })
    );
  }

  private loadUserDataFromStorage(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        this.setProfileData(parsed);
        if (parsed.profileImage || parsed.profilePicture) {
          this.setProfileImage(parsed.profileImage || parsed.profilePicture);
        }
      } catch (e) {
        console.error('Error parsing user_data:', e);
      }
    }
  }

  initializeProfileImage(): void {
    console.log('🔄 UserService: Initializing profile image');

    // Check if user is actually logged in
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('🔄 UserService: No token found, using default avatar');
      this.profileImageSubject.next('assets/default-avatar.jpg');
      return;
    }

    // Try multiple sources in order
    const sources = [
      () => localStorage.getItem('profile_image'),
      () => {
        const userData = localStorage.getItem('user_data');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            return parsed.profileImage || parsed.profilePicture;
          } catch (e) {
            return null;
          }
        }
        return null;
      },
    ];

    for (const source of sources) {
      const image = source();
      if (image && this.isValidImage(image)) {
        this.profileImageSubject.next(image);
        console.log('✅ UserService: Profile image initialized');
        return;
      }
    }

    // Set default
    this.profileImageSubject.next('assets/default-avatar.png');
    console.log('📷 UserService: Using default avatar');
  }

  setProfileImage(image: string): void {
    if (this.isValidImage(image)) {
      this.profileImageSubject.next(image);
      localStorage.setItem('profile_image', image);
      console.log('📷 UserService: Profile image updated');
    }
  }

  // setProfileImage(image: string): void {
  //   if (this.isValidImage(image)) {
  //     this.profileImageSubject.next(image);
  //     // Store in localStorage for persistence
  //     localStorage.setItem('profile_image', image);
  //     console.log('📷 Profile image updated in UserService');
  //   }
  // }

  getProfileImage(): string {
    return this.profileImageSubject.value;
  }

  private isValidImage(image: string): boolean {
    return !!(
      image &&
      (image.startsWith('data:image/') ||
        image.startsWith('http') ||
        image.startsWith('assets/'))
    );
  }

  // ✅ Profile data methods
  setProfileData(profile: any): void {
    this.profileDataSubject.next(profile);
  }
  getProfileData(): any {
    return this.profileDataSubject.value;
  }

  // ✅ Status methods
  setStatus(status: 'online' | 'away' | 'offline'): void {
    this.statusSubject.next(status);
  }

  getStatus(): 'online' | 'away' | 'offline' {
    return this.statusSubject.value;
  }
  
  getTalentId(): string | null {
    // Try multiple sources in order
    const profile = this.getProfileData();
    if (profile?.user?.id) return profile.user.id;
    if (profile?.id) return profile.id;

    // Check localStorage directly as fallback
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.id || parsed.userId || parsed.talentId || null;
      } catch (e) {
        console.error('Error parsing user_data:', e);
      }
    }

    return null;
  }

  getScouterId(): string | null {
    // Try multiple sources in order
    const profile = this.getProfileData();
    if (profile?.user?.id) return profile.user.id;
    if (profile?.id) return profile.id;

    // Check localStorage directly as fallback
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        return parsed.id || parsed.userId || parsed.scouterId || null;
      } catch (e) {
        console.error('Error parsing user_data:', e);
      }
    }

    return null;
  }

  // new method to check if email exists
  checkEmailExists(email: string): Observable<{ exists: boolean }> {
    return this.http
      .get<{ exists: boolean }>(
        `${environment.baseUrl}/${endpoints.verifyUserEmail}?email=${email}`,
        {
          headers: new HttpHeaders({ 'Skip-Interceptor': 'true' }), // 👈 bypass auth
        }
      )

      .pipe(
        catchError((err) => {
          console.error('Email check error', err);
          return of({ exists: false });
        })
      );
  }

  // ✅ NEW: Fetch profile from backend
  getUserProfile(): Observable<any> {
    const scouterId = this.getScouterId();
    if (!scouterId) return of(null);

    return this.http
      .get<any>(`${environment.baseUrl}/scouter/${scouterId}`)
      .pipe(
        catchError((err) => {
          console.error('Failed to fetch profile', err);
          return of(null);
        })
      );
  }

  // ✅ NEW: Update profile to backend
  updateUserProfile(payload: any): Observable<any> {
    const scouterId = this.getScouterId();
    if (!scouterId) return of(null);

    return this.http
      .put<any>(`${environment.baseUrl}/scouter/${scouterId}`, payload)
      .pipe(
        catchError((err) => {
          console.error('Failed to update profile', err);
          return of(null);
        })
      );
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
