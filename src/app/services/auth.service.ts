// auth.service.ts
import { Injectable, Inject, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import {
  BehaviorSubject,
  // catchError,
  Observable,
  of,
  tap,
  throwError,
} from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { timeout, catchError } from 'rxjs/operators';

import { JwtInterceptorService } from '../services/jwt-interceptor.service';
import { FilterScouterParam, PaginationParams } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';
import { UserService } from './user.service';
import { AppInitService } from './app-init.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ✅ NEW: Add subjects for profile updates
  private profileUpdatedSubject = new BehaviorSubject<boolean>(false);
  public profileUpdated$ = this.profileUpdatedSubject.asObservable();

  private userLoggedInSubject = new BehaviorSubject<boolean>(false);
  public userLoggedIn$ = this.userLoggedInSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtInterceptor: JwtInterceptorService,
    private toast: ToastController,
    private injector: Injector
  ) {
    this.loadStoredUser();
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('user_data');
    this.userLoggedInSubject.next(!!(token && userData));
  }

  // ============ LOGIN & AUTHENTICATION ============
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.userLogin}`;

    return this.http
      .post<any>(url, credentials, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .pipe(
        timeout(15000),
        tap((response) => {
          if (response?.access_token) {
            this.setUserCredentialFromBackend(response);

            // ✅ EMIT login event and trigger app re-initialization
            this.userLoggedInSubject.next(true);

            console.log(
              '✅ Login successful, triggering app re-initialization'
            );

            // ✅ Use setTimeout to ensure the app init service runs after data is stored
            setTimeout(() => {
              const appInitService = this.injector.get(AppInitService);
              appInitService.onUserLogin().catch((err) => {
                console.error('❌ App re-initialization failed:', err);
              });
            }, 500);
          }
        }),
        catchError((error) => {
          console.error('❌ AuthService login error:', error);
          throw error;
        })
      );
  }

  // ✅ ENHANCED: Set user credentials with UserService integration
  setUserCredentialFromBackend(loginResponse: any): void {
    if (loginResponse.access_token) {
      localStorage.setItem('access_token', loginResponse.access_token);

      const userData =
        loginResponse.details?.user || loginResponse.user || loginResponse;
      localStorage.setItem('user_data', JSON.stringify(userData));

      if (loginResponse.eniyan) {
        localStorage.setItem('eniyan', loginResponse.eniyan);
      }

      // ✅ CRITICAL: Update UserService with new user data
      const userService = this.injector.get(UserService);
      userService.updateFullProfile(userData);

      this.currentUserSubject.next(userData);
      this.userLoggedInSubject.next(true);

      console.log('✅ Credentials stored and all services updated');
    } else {
      console.error('❌ No access token in login response');
      throw new Error('No access token received');
    }
  }

  // ✅ ENHANCED: Notify all components of profile updates
  notifyProfileUpdated(): void {
    console.log('🔄 AuthService: Notifying all components of profile update');
    this.profileUpdatedSubject.next(true);

    // Force reload user data from storage
    this.loadStoredUser();

    // Also trigger UserService refresh
    setTimeout(() => {
      const userService = this.injector.get(UserService);
      userService.refreshFromStorage();
    });
  }

  // ✅ NEW: Method to force reload user data
  reloadUserData(): void {
    this.loadStoredUser();
    this.profileUpdatedSubject.next(true);
  }

  private loadStoredUser(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        this.currentUserSubject.next(parsedData);
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
  }

  logoutUser(): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.logoutUser}`;
    const token = this.getToken();

    console.log('🚀 Logging out...');

    // No token? Just clear local data and redirect
    if (!token) {
      console.warn('⚠️ No token found, clearing local data only');
      this.clearAuthData();
      setTimeout(() => this.router.navigate(['/auth/login']), 300);
      return of({ message: 'Local logout completed' });
    }

    return this.http
      .post<any>(
        url,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .pipe(
        tap((res) => {
          console.log('✅ Server logout successful:', res);
          this.clearAuthData();
          setTimeout(() => this.router.navigate(['/auth/login']), 300);
        }),
        catchError((error) => {
          console.error('❌ Server logout failed, clearing local data:', error);
          this.clearAuthData();
          setTimeout(() => this.router.navigate(['/auth/login']), 300);
          return throwError(() => error);
        })
      );
  }

  // setUserCredentialFromBackend(loginResponse: any): void {
  //   // console.log('💾 Storing user credentials...');

  //   if (loginResponse.access_token) {
  //     // Store token
  //     localStorage.setItem('access_token', loginResponse.access_token);

  //     // Store user data with multiple fallbacks
  //     const userData =
  //       loginResponse.details?.user || loginResponse.user || loginResponse;
  //     localStorage.setItem('user_data', JSON.stringify(userData));

  //     // Store encoded user data if provided
  //     if (loginResponse.eniyan) {
  //       localStorage.setItem('eniyan', loginResponse.eniyan);
  //     }

  //     // console.log('✅ Credentials stored successfully');
  //   } else {
  //     console.error('❌ No access token in login response');
  //     throw new Error('No access token received');
  //   }
  // }

  // ✅ NEW: Validate stored tokens

  validateStoredToken(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (!token || !userData) {
      return false;
    }

    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  // In auth.service.ts - ENHANCE the clearAuthData method
  private clearAuthData(): void {
    const keysToRemove = [
      'access_token',
      'user_data',
      'eniyan',
      'registration_email',
      'user_profile_data',
      'profile_image',
      'security_questions',
      'profile_was_saved',
    ];

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // ✅ CRITICAL: Reset subjects
    this.currentUserSubject.next(null);
    this.userLoggedInSubject.next(false);
    this.profileUpdatedSubject.next(false);

    console.log('🧹 All auth data cleared completely');
  }

  // ============ USER MANAGEMENT ============
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: any): void {
    try {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };

      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(updatedUser));

      // Notify subscribers
      this.currentUserSubject.next(updatedUser);

      console.log('✅ AuthService: Current user updated');
    } catch (error) {
      console.error('❌ Error updating current user in AuthService:', error);
    }
  }

  // private loadStoredUser(): void {
  //   const userData = localStorage.getItem('user_data');
  //   if (userData) {
  //     try {
  //       this.currentUserSubject.next(JSON.parse(userData));
  //     } catch (e) {
  //       console.error('Error parsing stored user data:', e);
  //     }
  //   }
  // }

  decodeScouterDetails(): any {
    try {
      const eniyan = localStorage.getItem('eniyan');
      if (eniyan) {
        return JSON.parse(atob(eniyan));
      }

      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }

      return null;
    } catch (e) {
      console.error('Error decoding scouter details:', e);
      return null;
    }
  }

  decodeTalentDetails(): any {
    try {
      const eniyan = localStorage.getItem('eniyan');
      if (eniyan) {
        return JSON.parse(atob(eniyan));
      }
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (e) {
      console.error('Error decoding talent details:', e);
      return null;
    }
  }

  // ============ TOKEN MANAGEMENT ============
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // ============ PASSWORD RESET ============
  forgotPassword(email: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.forgotPasswords}`;
    return this.http.post<any>(url, { email });
  }

  // ============ SECURITY QUESTIONS ============
  public getMySecurityQuestions(uniqueId: string): Observable<any> {
    const url = `${environment.baseUrl}/${
      endpoints.getMySecurityQuestions
    }?uniqueId=${uniqueId.trim()}`;

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        tap((response) => {
          // console.log('🔍 Raw security questions response:', response);
        }),
        catchError((error) => {
          console.error('❌ Error fetching security questions:', error);
          return throwError(() => error);
        })
      );
  }

  public getMySecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    let url = `${environment?.baseUrl}/${
      endpoints?.getMySecurityQuestionsWithAnswers
    }?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public ValidateScouterSecurityQ(question: any): Observable<any> {
    let body = JSON.stringify(question);
    let url = `${environment?.baseUrl}/${endpoints?.validateScouterSecurityQuestions}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public createScouterSecurityQuestion(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    let url = `${environment?.baseUrl}/${endpoints?.createScouterSecurityQuestions}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public updateTalentSecurityQuestions(
    payload: any,
    talentId: string
  ): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentSecurityQuestions}?talentId=${encodedTalentId}`;
    return this.http.put<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  updateScouterSecurityQuestions(
    scouterId: string,
    securityQuestions: any[]
  ): Observable<any> {
    const url = `${this.baseUrl}/login/v1/auth/update-scouter-security-questions`;

    const params = new HttpParams().set('scouterId', scouterId);

    return this.http.put(url, { securityQuestions }, { params }).pipe(
      timeout(15000),
      tap((res) =>
        console.log('✅ Security questions updated successfully:', res)
      ),
      catchError((error) => {
        console.error('❌ Failed to update security questions:', error);
        return throwError(() => error);
      })
    );
  }
}
