// auth.service.ts
import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, tap, throwError } from 'rxjs';
import { catchError, timeout, delay, retry } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { JwtInterceptorService } from '../services/jwt-interceptor.service';
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

  // ============ LOGIN ============
  loginUser(credentials: { email: string; password: string }): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.userLogin}`;
    // console.log('Making login request to:', url, credentials);

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
              console.log(`Retrying login attempt ${retryCount + 1}...`);
              return of(null).pipe(delay(1000));
            }
            throw error;
          },
        }),
        tap({
          next: (response) => {
            if (response?.access_token) {
              this.setUserCredentialFromBackend(response);
              this.userLoggedInSubject.next(true);
              console.log('Login successful, triggering app re-initialization');
              setTimeout(() => {
                const appInitService = this.injector.get(AppInitService);
                appInitService.onUserLogin().catch(console.error);
              }, 500);
            }
          },
          error: (error) => {
            console.error('Login request failed:', error);
          },
          complete: () => console.log('Login request completed.'),
        }),
        catchError((error) => {
          console.error('AuthService login error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            error: error.error,
          });
          return throwError(() => error);
        })
      );
  }

  // ============ LOGOUT ============
  logoutUser(): Observable<any> {
    sessionStorage.clear();
    localStorage.clear();
    this.toastr.openSnackBar('Logging out...', 'success');
    setTimeout(() => this.router.navigate(['/auth/login']), 300);

    const url = `${this.baseUrl}/${endpoints.logoutUser}`;
    const token = this.getToken();

    if (!token) {
      this.clearAuthData();
      return of({ message: 'Local logout completed' });
    }

    return this.http
      .post<any>(url, {}, { headers: { Authorization: `Bearer ${token}` } })
      .pipe(
        tap({
          next: (res) => {
            console.log('Server logout successful:', res);
            this.clearAuthData();
          },
          error: (err) => {
            console.error('Server logout failed, clearing local data:', err);
            this.clearAuthData();
          },
          complete: () => this.router.navigate(['/auth/login']),
        }),
        catchError((error) => throwError(() => error))
      );
  }

  // ============ TOKEN MANAGEMENT ============
  validateStoredToken(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');
    if (!token || !userData) return false;

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

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private clearAuthData(): void {
    [
      'access_token',
      'user_data',
      'eniyan',
      'registration_email',
      'user_profile_data',
      'profile_image',
      'security_questions',
      'profile_was_saved',
    ].forEach((key) => localStorage.removeItem(key));

    this.currentUserSubject.next(null);
    this.userLoggedInSubject.next(false);
    this.profileUpdatedSubject.next(false);
    console.log('All auth data cleared completely');
  }

  // ============ USER MANAGEMENT ============
  setUserCredentialFromBackend(loginResponse: any): void {
    if (!loginResponse.access_token) {
      throw new Error('No access token received');
    }

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
  }

  notifyProfileUpdated(): void {
    this.profileUpdatedSubject.next(true);
    this.loadStoredUser();
    setTimeout(() => {
      const userService = this.injector.get(UserService);
      userService.refreshFromStorage();
    });
  }

  private loadStoredUser(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        this.currentUserSubject.next(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(userData: any): void {
    try {
      const updatedUser = { ...this.getCurrentUser(), ...userData };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      this.currentUserSubject.next(updatedUser);
    } catch (error) {
      console.error('Error updating current user:', error);
    }
  }

  decodeScouterDetails(): any {
    try {
      const fetchSession =
        localStorage.getItem('user_data') ||
        localStorage.getItem('user_profile_data');
      return fetchSession ? JSON.parse(fetchSession) : {};
    } catch (e) {
      console.error('Error decoding scouter details:', e);
      return null;
    }
  }

  decodeTalentDetails(): any {
    try {
      const fetchSession =
        localStorage.getItem('user_data') ||
        localStorage.getItem('user_profile_data');
      return fetchSession ? JSON.parse(fetchSession) : {};
    } catch (e) {
      console.error('Error decoding talent details:', e);
      return null;
    }
  }

  // ============ SECURITY QUESTIONS ============
  getMySecurityQuestions(uniqueId: string): Observable<any> {
    const base = `${environment.baseUrl}/${endpoints.getMySecurityQuestions}`;
    const candidates: string[] = [];

    if (uniqueId?.trim()) {
      candidates.push(
        `${base}?uniqueId=${encodeURIComponent(uniqueId.trim())}`
      );
      const numericMatch = String(uniqueId).match(/(\d+)/);
      if (numericMatch?.[1]) {
        candidates.push(
          `${base}?uniqueId=${encodeURIComponent(numericMatch[1])}`
        );
      }
    }

    if (!candidates.length)
      return throwError(
        () => new Error('Invalid uniqueId for security questions')
      );

    const headers = this.jwtInterceptor.customHttpHeaders;

    const tryFetch = (urls: string[], idx = 0): Observable<any> =>
      this.http
        .get<any>(urls[idx], { headers })
        .pipe(
          catchError((error) =>
            idx < urls.length - 1
              ? tryFetch(urls, idx + 1)
              : throwError(() => error)
          )
        );

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

  // ✅ NEW: Method to force reload user data
  reloadUserData(): void {
    this.loadStoredUser();
    this.profileUpdatedSubject.next(true);
  }

  // ============ TOKEN MANAGEMENT ============
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ============ PASSWORD RESET ============
  forgotPassword(email: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.forgotPasswords}`;
    return this.http.post<any>(url, { email });
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
