// jwt-interceptor.service.ts - CLEAN MERGED VERSION
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class JwtInterceptorService implements HttpInterceptor {
  private tokenKey = 'access_token';
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private router: Router) { }

  /** Retrieves token from localStorage */
  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /** Determines if a JWT token is expired */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && typeof payload.exp === 'number') {
        const exp = payload.exp * 1000;
        return Date.now() >= exp;
      }
      return false;
    } catch {
      return true;
    }
  }

  /** Intercept outgoing HTTP requests */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip for explicit opt-outs
    if (req.headers.get('Skip-Interceptor') === 'true') {
      const modifiedReq = req.clone({ headers: req.headers.delete('Skip-Interceptor') });
      return next.handle(modifiedReq);
    }

    // Skip public endpoints
    if (this.isPublicEndpoint(req.url)) return next.handle(req);

    const token = this.getToken();
    if (!token) {
      this.handleUnauthorized();
      return throwError(() => new Error('No authentication token available'));
    }

    // Handle expired tokens
    if (this.isTokenExpired(token)) {
      return this.handleAuthError(req, next);
    }

    const clonedReq = this.addTokenToRequest(req, token);
    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, req, next))
    );
  }

  /** Add token to outgoing request headers */
  private addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const headers: any = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const existingCt = req.headers.get('Content-Type');
    if (existingCt) headers['Content-Type'] = existingCt;

    return req.clone({ setHeaders: headers });
  }

  /** Handle HTTP errors */
  private handleError(
    error: HttpErrorResponse,
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<any> {
    if (error.status === 401) {
      if (this.isNonCriticalEndpoint(req.url)) return throwError(() => error);
      return this.handleAuthError(req, next);
    }

    return throwError(() => error);
  }

  /** Retry if refresh available, else redirect */
  private handleAuthError(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.attemptTokenRecovery().pipe(
        switchMap((success: boolean) => {
          this.isRefreshing = false;
          if (success) {
            const newToken = this.getToken();
            this.refreshTokenSubject.next(newToken);
            return next.handle(this.addTokenToRequest(req, newToken!));
          } else {
            this.handleUnauthorized();
            return throwError(() => new Error('Authentication failed'));
          }
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.handleUnauthorized();
          return throwError(() => error);
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap((token) => next.handle(this.addTokenToRequest(req, token)))
      );
    }
  }

  /** Dummy refresh token logic placeholder */
  private attemptTokenRecovery(): Observable<boolean> {
    return new Observable((subscriber) => {
      const token = this.getToken();
      if (!token) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }
      setTimeout(() => {
        subscriber.next(false);
        subscriber.complete();
      }, 1000);
    });
  }

  /** Identify public endpoints that skip auth */
  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/auth/signin',
      '/auth/login',
      '/auth/create-talent-profile',
      '/auth/create-scouter-profile',
      '/auth/verifyOTP',
      '/auth/resendOTP',
      '/auth/forgot-passwords',
      '/auth/verify-user-email',
      '/talent/v1/create-talent-profile',
      '/talent/v1/verify-otp',
      '/talent/v1/resend-otp',
      '/scouter/create-scouter-profile',
      '/scouter/resend-otp',
      '/scouter/verify-otp',
      '/verify-user-email',
      '/admin/v1/admin/validateUserEmail',
      '/assets/',
      'https://api.cloudinary.com/v1_1/dosiy2cmk/video/upload',
    ];

    const isScouterRegistration =
      url.includes('scouter') && (url.includes('create') || url.includes('verify') || url.includes('resend'));

    return (
      publicEndpoints.some((endpoint) => url.includes(endpoint)) ||
      isScouterRegistration ||
      url.includes('verify-user-email')
    );
  }

  /** Allow harmless 401s for certain assets */
  private isNonCriticalEndpoint(url: string): boolean {
    const nonCriticalEndpoints = [
      '/get-profile-picture',
      '/get-profile-image',
      '/profile-picture',
      '/talent/v1/get-profile-picture',
      '/talent/v1/upload-profile-picture',
      '/talent/v1/update-profile-picture',
      '/talent/v1/delete-talent-picture',
      '/scouters/v1/get-profile-picture',
      '/scouters/v1/upload-profile-picture',
      '/scouters/v1/update-profile-picture',
      '/scouters/v1/delete-scouter-picture',
      '/upload-profile-picture',
      '/update-profile-picture',
      '/delete-scouter-picture',
    ];
    return nonCriticalEndpoints.some((endpoint) => url.includes(endpoint));
  }

  /** Clear auth data and redirect */
  private handleUnauthorized(): void {
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

    this.router.navigate(['/auth/login'], {
      queryParams: { redirectReason: 'session_expired', returnUrl: this.router.url },
    });
  }

  // ---------------------------
  // ✅ Headers
  // ---------------------------
  public get customNoAuthHttpHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  public get customHttpHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
  }

  public get customFormDataHttpHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });
    }
    return new HttpHeaders({ Accept: 'application/json' });
  }

  public customFormDataNoAuthHttpHeaders = new HttpHeaders({
    accept: '*/*',
  });
}
