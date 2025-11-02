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

  constructor(private router: Router) {}

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && typeof payload.exp === 'number') {
        return Date.now() >= payload.exp * 1000;
      }
      return false;
    } catch {
      return true;
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.get('Skip-Interceptor') === 'true') {
      const modifiedReq = req.clone({ headers: req.headers.delete('Skip-Interceptor') });
      return next.handle(modifiedReq);
    }

    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.getToken();

    if (!token) {
      this.handleUnauthorized();
      return throwError(() => new Error('No authentication token available'));
    }

    if (this.isTokenExpired(token)) {
      return this.handleAuthError(req, next);
    }

    const clonedReq = this.addTokenToRequest(req, token);
    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error, req, next))
    );
  }

  private addTokenToRequest(req: HttpRequest<any>, token: string): HttpRequest<any> {
    const headers: any = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
    const existingCt = req.headers.get('Content-Type');
    if (existingCt) {
      headers['Content-Type'] = existingCt;
    }
    return req.clone({ setHeaders: headers });
  }

  private handleError(error: HttpErrorResponse, req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (error.status === 401) {
      if (this.isNonCriticalEndpoint(req.url)) {
        return throwError(() => error);
      }
      return this.handleAuthError(req, next);
    }
    return throwError(() => error);
  }

  private isNonCriticalEndpoint(url: string): boolean {
    const nonCriticalEndpoints = [
      '/get-profile-picture',
      '/get-profile-image',
      '/profile-picture',
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
    return publicEndpoints.some((endpoint) => url.includes(endpoint)) || isScouterRegistration || url.includes('verify-user-email');
  }

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
    this.router.navigate(['/auth/login'], { queryParams: { redirectReason: 'session_expired', returnUrl: this.router.url } });
  }

  public get customNoAuthHttpHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
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
    return new HttpHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' });
  }

  public get customFormDataHttpHeaders(): HttpHeaders {
    const token = this.getToken();
    if (token && !this.isTokenExpired(token)) {
      return new HttpHeaders({ Accept: 'application/json', Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders({ Accept: 'application/json' });
  }

  public customFormDataNoAuthHttpHeaders = new HttpHeaders({ accept: '*/*' });
}
