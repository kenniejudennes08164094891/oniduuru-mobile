// auth.service.ts
import { Injectable, Inject, Injector } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { timeout, catchError, delay, retry, map } from 'rxjs/operators';
import { JwtInterceptorService } from '../services/jwt-interceptor.service';
import { FilterScouterParam, PaginationParams } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';
import { UserService } from './user.service';
import { AppInitService } from './app-init.service';
import { ToastsService } from './toasts.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.baseUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

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

  // ============ LOGIN & AUTHENTICATION ============
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.userLogin}`;
    console.log('Making login request to:', url);
    console.log('Request payload:', credentials);

    return this.http
      .post<any>(url, credentials, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })
      .pipe(
        timeout(15000),
        retry({
          count: 2,
          delay: (error, retryCount) => {
            if (error.status === 500 && retryCount < 2) {
              console.log(`Retrying login request (attempt ${retryCount + 1})...`);
              return of(null).pipe(delay(1000));
            }
            throw error;
          },
        }),
        tap((response) => {
          if (response?.access_token) {
            this.setUserCredentialFromBackend(response);
            this.userLoggedInSubject.next(true);

            console.log('Login successful, triggering app re-initialization');
            setTimeout(() => {
              const appInitService = this.injector.get(AppInitService);
              appInitService.onUserLogin().catch((err) => {
                console.error('App re-initialization failed:', err);
              });
            }, 500);
          }
        }),
        catchError((error) => {
          console.error('Backend Error Analysis:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            headers: error.headers,
            error: error.error,
            request: {
              method: 'POST',
              url: url,
              body: credentials,
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            },
          });
          throw error;
        })
      );
  }

  logoutUser(): Observable<any> {
    sessionStorage.clear();
    localStorage.clear();
    this.toastr.openSnackBar('Logging out...', 'success');
    setTimeout(() => this.router.navigate(['/auth/login']), 300);

    const url = `${this.baseUrl}/${endpoints.logoutUser}`;
    const token = this.getToken();

    if (!token) {
      console.warn('No token found, clearing local data only');
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
          console.log('Server logout successful:', res);
          this.clearAuthData();
          setTimeout(() => this.router.navigate(['/auth/login']), 300);
        }),
        catchError((error) => {
          console.error('Server logout failed, clearing local data:', error);
          this.clearAuthData();
          setTimeout(() => this.router.navigate(['/auth/login']), 300);
          return throwError(() => error);
        })
      );
  }

  validateStoredToken(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (!token || !userData) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        this.clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearAuthData();
      return false;
    }
  }

  setUserCredentialFromBackend(loginResponse: any): void {
    if (loginResponse.access_token) {
      localStorage.setItem('access_token', loginResponse.access_token);

      const userData =
        loginResponse.details?.user || loginResponse.user || loginResponse;
      localStorage.setItem('user_data', JSON.stringify(userData));

      if (loginResponse.eniyan) {
        localStorage.setItem('eniyan', loginResponse.eniyan);
      }

      const userService = this.injector.get(UserService);
      userService.updateFullProfile(userData);

      this.currentUserSubject.next(userData);
      this.userLoggedInSubject.next(true);

      console.log('Credentials stored and all services updated');
    } else {
      console.error('No access token in login response');
      throw new Error('No access token received');
    }
  }

  notifyProfileUpdated(): void {
    this.profileUpdatedSubject.next(true);
    this.loadStoredUser();

    setTimeout(() => {
      const userService = this.injector.get(UserService);
      userService.refreshFromStorage();
    });
  }

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
    this.currentUserSubject.next(null);
    this.userLoggedInSubject.next(false);
    this.profileUpdatedSubject.next(false);
    console.log('All auth data cleared completely');
  }

  // ============ USER MANAGEMENT ============
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: any): void {
    try {
      const currentUser = this.getCurrentUser();
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    } catch (error) {
      console.error('Error updating current user in AuthService:', error);
    }
  }

  decodeScouterDetails(): any {
    try {
      const eniyan = localStorage.getItem('eniyan');
      if (eniyan) return JSON.parse(atob(eniyan));

      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
    } catch (e) {
      console.error('Error decoding scouter details:', e);
      return null;
    }
  }

  decodeTalentDetails(): any {
    try {
      const eniyan = localStorage.getItem('eniyan');
      if (eniyan) return JSON.parse(atob(eniyan));

      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) : null;
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
    const candidates: string[] = [];

    if (uniqueId && uniqueId.trim() !== '') {
      candidates.push(`${base}?uniqueId=${encodeURIComponent(uniqueId.trim())}`);
      const numericMatch = String(uniqueId).match(/(\d+)/);
      if (numericMatch && numericMatch[1]) {
        candidates.push(`${base}?uniqueId=${encodeURIComponent(numericMatch[1])}`);
      }
    }

    if (candidates.length === 0) {
      return throwError(() => new Error('Invalid uniqueId for security questions'));
    }

    const headers = this.jwtInterceptor.customHttpHeaders;

    const tryFetch = (urls: string[], idx = 0): Observable<any> => {
      const url = urls[idx];
      return this.http.get<any>(url, { headers }).pipe(
        catchError((error) => {
          console.error('Error fetching security questions from', url, error?.status || error?.message);
          if (idx < urls.length - 1) return tryFetch(urls, idx + 1);
          return throwError(() => error);
        })
      );
    };

    return tryFetch(candidates);
  }

  public getMySecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestionsWithAnswers}?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public ValidateScouterSecurityQ(question: any): Observable<any> {
    const body = JSON.stringify(question);
    const url = `${environment.baseUrl}/${endpoints.validateScouterSecurityQuestions}`;
    return this.http.post<any>(url, body, { headers: this.jwtInterceptor.customNoAuthHttpHeaders });
  }

  public createScouterSecurityQuestion(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.createScouterSecurityQuestions}`;
    const headers = this.jwtInterceptor.customHttpHeaders;

    return this.http.post<any>(url, body, { headers }).pipe(
      tap((res) => console.log('Created scouter security questions:', res)),
      catchError((error) => {
        console.error('Error creating scouter security questions:', error);
        return throwError(() => error);
      })
    );
  }

  public updateTalentSecurityQuestions(payload: any, talentId: string): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentSecurityQuestions}?talentId=${encodedTalentId}`;
    return this.http.put<any>(url, body, { headers: this.jwtInterceptor.customNoAuthHttpHeaders });
  }

  updateScouterSecurityQuestions(scouterId: string, securityQuestions: any[]): Observable<any> {
    const url = `${this.baseUrl}/login/v1/auth/update-scouter-security-questions`;
    const params = new HttpParams().set('scouterId', scouterId);

    return this.http.put(url, { securityQuestions }, { params }).pipe(
      timeout(15000),
      tap((res) => console.log('Security questions updated successfully:', res)),
      catchError((error) => {
        console.error('Failed to update security questions:', error);
        return throwError(() => error);
      })
    );
  }
}
