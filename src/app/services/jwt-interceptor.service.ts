// jwt-interceptor.service.ts - UPDATED
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
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null
  );

  constructor(private router: Router) {
    // console.log('🔄 JWT Interceptor initialized');
  }

  public getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      // Check if exp claim exists and is valid
      if (payload.exp && typeof payload.exp === 'number') {
        const exp = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const isExpired = now >= exp;

        if (isExpired) {
          console.warn('⚠️ Token expired at:', new Date(exp));
          return true;
        }
        return false;
      }

      // If no expiration claim, assume valid but log warning
      console.warn('⚠️ Token has no expiration claim');
      return false;
    } catch (error) {
      console.error('❌ Token expiration check error:', error);
      return true; // If we can't parse, consider it expired
    }
  }


  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // console.log('🔐 Interceptor processing:', req.method, req.url);

    // Skip interceptor for specific requests
    if (req.headers.get('Skip-Interceptor') === 'true') {
      // console.log('⏭️ Skipping interceptor for request');
      const modifiedReq = req.clone({
        headers: req.headers.delete('Skip-Interceptor'),
      });
      return next.handle(modifiedReq);
    }

    // Check if it's a public endpoint
    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.getToken();

    // If no token for protected endpoint, redirect to login
    if (!token) {
      console.warn(
        '🚫 No token available for authenticated request - redirecting'
      );
      this.handleUnauthorized();
      return throwError(() => new Error('No authentication token available'));
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      console.warn('⚠️ Token expired - attempting recovery');
      return this.handleAuthError(req, next);
    }

    // Clone request with auth header
    let clonedReq = this.addTokenToRequest(req, token);
    // console.log('✅ Added Authorization header');

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error, req, next);
      })
    );
  }

  private addTokenToRequest(
    req: HttpRequest<any>,
    token: string
  ): HttpRequest<any> {
    // Only set auth and Accept headers here. Do not override Content-Type so
    // individual services can choose the correct media type (some backends
    // expect 'application/json' for PATCH instead of merge-patch).
    const headers: any = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    // Preserve existing Content-Type if set by the request
    const existingCt = req.headers.get('Content-Type');
    if (existingCt) {
      headers['Content-Type'] = existingCt;
    }

    return req.clone({ setHeaders: headers });
  }

  private handleError(
    error: HttpErrorResponse,
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<any> {
    console.error('❌ HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      method: req.method,
    });

    // Handle 401 Unauthorized errors - BUT BE MORE SELECTIVE
    if (error.status === 401) {
      // console.log('🔐 401 Unauthorized - checking if this is a critical endpoint');

      // Don't treat profile picture 401 as critical - it might just mean no picture exists
      if (this.isNonCriticalEndpoint(req.url)) {
        // console.log('📷 Profile picture 401 - not treating as authentication failure');
        // Just pass the error through without clearing auth
        return throwError(() => error);
      }

      // For critical endpoints, handle authentication error
      console.log('🔐 Critical endpoint 401 - handling authentication error');
      return this.handleAuthError(req, next);
    }

    // Handle CORS/preflight errors
    if (error.status === 0) {
      console.error('🌐 CORS/Network Error - Request was blocked');
    }

    // Handle 405 Method Not Allowed
    if (error.status === 405) {
      console.error('🚫 Method Not Allowed - CORS configuration issue');
    }

    return throwError(() => error);
  }

  private isNonCriticalEndpoint(url: string): boolean {
    const nonCriticalEndpoints = [
      '/get-profile-picture',
      '/get-profile-image',
      '/profile-picture',
      '/scouters/v1/get-profile-picture',
      // These endpoints may return 401 when a picture does not exist or when
      // the server signals create/replace semantics. Treat them as non-
      // critical so we don't clear the user's auth on intermediate errors.
      '/scouters/v1/upload-profile-picture',
      '/scouters/v1/update-profile-picture',
      '/scouters/v1/delete-scouter-picture',
      '/upload-profile-picture',
      '/update-profile-picture',
      '/delete-scouter-picture',
    ];
    return nonCriticalEndpoints.some((endpoint) => url.includes(endpoint));
  }

  private handleAuthError(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<any> {
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
        switchMap((token) => {
          return next.handle(this.addTokenToRequest(req, token));
        })
      );
    }
  }

  private attemptTokenRecovery(): Observable<boolean> {
    return new Observable((subscriber) => {
      // Check if token exists but might be expired
      const token = this.getToken();
      if (!token) {
        subscriber.next(false);
        subscriber.complete();
        return;
      }

      console.log('🔄 Attempting token recovery...');

      // For now, we'll just clear and redirect
      // In a real app, you would implement refresh token logic here
      setTimeout(() => {
        subscriber.next(false);
        subscriber.complete();
      }, 1000);
    });
  }

  private isPublicEndpoint(url: string): boolean {
    // Add debug logging to see what URLs are being checked
    console.log('🔍 Checking if endpoint is public:', url);

    const publicEndpoints = [
      '/auth/signin',
      '/auth/login',
      '/auth/create-talent-profile',
      '/auth/create-scouter-profile',
      '/auth/verifyOTP',
      '/auth/resendOTP',
      '/auth/forgot-passwords',
      '/auth/verify-user-email',
      '/scouter/create-scouter-profile',
      '/scouter/resend-otp',
      '/scouter/verify-otp',
      '/verify-user-email',
      '/admin/v1/admin/validateUserEmail', // 👈 ADD THIS
      '/assets/',
      'https://api.cloudinary.com/v1_1/dosiy2cmk/video/upload'
    ];

    // More flexible matching for scouter registration endpoints
    const isScouterRegistration =
      url.includes('scouter') &&
      (url.includes('create') ||
        url.includes('verify') ||
        url.includes('resend'));

    const isPublic =
      publicEndpoints.some((endpoint) => url.includes(endpoint)) ||
      isScouterRegistration ||
      url.includes('verify-user-email'); // Additional check

    console.log('✅ Endpoint public status:', isPublic, 'for URL:', url);
    return isPublic;
  }

  private handleUnauthorized(): void {
    // console.log('🔐 Clearing authentication data and redirecting to login');

    // Clear all auth-related data
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

    // Navigate to login page
    this.router.navigate(['/auth/login'], {
      queryParams: {
        redirectReason: 'session_expired',
        returnUrl: this.router.url,
      },
    });
  }

  // Headers getters
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
    } else {
      console.warn('⚠️ No valid token available for customHttpHeaders');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      });
    }
  }

  public get customFormDataHttpHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return new HttpHeaders({
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      });
    } else {
      return new HttpHeaders({
        Accept: 'application/json',
      });
    }
  }

  public customFormDataNoAuthHttpHeaders = new HttpHeaders({
    // 'Content-Type': 'multipart/form-data',
    'accept': '*/*',
  })

}
