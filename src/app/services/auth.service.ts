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
import {ToastsService} from "./toasts.service";

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
    private injector: Injector,
    private toastr: ToastsService
  ) {
    this.loadStoredUser();
    this.checkInitialAuthState();
  }

  private checkInitialAuthState(): void {
    const token = this.getToken();
    const userData = localStorage.getItem('user_data');
    this.userLoggedInSubject.next(!!(token && userData));
  }

// Add this to your AuthService
  testApiConnection(): Observable<any> {
    const testUrl = `${this.baseUrl}/health`; // or any health check endpoint
    return this.http.get(testUrl).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('🔌 API Connection Test Failed:', error);
        return throwError(() => new Error('API server is unreachable'));
      })
    );
  }

  // In auth.service.ts, add this to see request/response details
  private debugRequestResponse(url: string, body: any, response: any, error?: any) {
    console.group('🔍 HTTP Request Debug');
    console.log('URL:', url);
    console.log('Method: POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    console.log('Body:', body);
    if (response) {
      console.log('Response:', response);
    }
    if (error) {
      console.log('Error:', {
        status: error.status,
        statusText: error.statusText,
        error: error.error,
        headers: error.headers
      });
    }
    console.groupEnd();
  }

  // ============ LOGIN & AUTHENTICATION ============
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.userLogin}`;

    // ✅ DEBUG: Enhanced request logging
    console.log('🚀 Making login request to:', url);
    //console.log('📝 Request payload:', credentials);

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
          // ✅ ENHANCED: Better error logging
          console.error('❌ AuthService login error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
            message: error.message,
            headers: error.headers,
          });

          // Log the actual server response if available
          if (error.error) {
            console.error('🔍 Server error response:', error.error);
          }

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
    sessionStorage.clear();
    localStorage.clear();
    this.toastr.openSnackBar('🚀 Logging out...', 'success');
    setTimeout(() => this.router.navigate(['/auth/login']), 300);
    const url = `${this.baseUrl}/${endpoints.logoutUser}`;
    const token = this.getToken();

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
      const fetchSession = localStorage.getItem('user_data') || localStorage.getItem('user_profile_data');
      return fetchSession ? JSON.parse(fetchSession) : {};
    } catch (e) {
      console.error('Error decoding scouter details:', e);
      return null;
    }
  }

  decodeTalentDetails(): any {
    try {
      const fetchSession = localStorage.getItem('user_data') || localStorage.getItem('user_profile_data');
      return fetchSession ? JSON.parse(fetchSession) : {};
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
    const base = `${environment.baseUrl}/${endpoints.getMySecurityQuestions}`;

    // Build candidates: prefer full uniqueId (may be "scouter/1234/...") then numeric id
    const candidates: string[] = [];
    if (uniqueId && uniqueId.trim() !== '') {
      candidates.push(
        `${base}?uniqueId=${encodeURIComponent(uniqueId.trim())}`
      );
      // extract numeric part if present
      const numericMatch = String(uniqueId).match(/(\d+)/);
      if (numericMatch && numericMatch[1]) {
        candidates.push(
          `${base}?uniqueId=${encodeURIComponent(numericMatch[1])}`
        );
      }
    }

    if (candidates.length === 0) {
      return throwError(
        () => new Error('Invalid uniqueId for security questions')
      );
    }

    const headers = this.jwtInterceptor.customHttpHeaders; // will include Authorization when token exists

    const tryFetch = (urls: string[], idx = 0): Observable<any> => {
      const url = urls[idx];
      return this.http.get<any>(url, { headers }).pipe(
        tap(() => {
          // success log suppressed
        }),
        catchError((error) => {
          console.error(
            '❌ Error fetching security questions from',
            url,
            error?.status || error?.message
          );
          if (idx < urls.length - 1) {
            return tryFetch(urls, idx + 1);
          }
          return throwError(() => error);
        })
      );
    };

    return tryFetch(candidates);
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
    const url = `${environment?.baseUrl}/${endpoints?.createScouterSecurityQuestions}`;

    // Use authenticated headers when available; fall back to no-auth headers
    const headers = this.jwtInterceptor.customHttpHeaders;

    return this.http.post<any>(url, body, { headers }).pipe(
      tap((res) => console.log('✅ Created scouter security questions:', res)),
      catchError((error) => {
        console.error('❌ Error creating scouter security questions:', error);
        return throwError(() => error);
      })
    );
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
