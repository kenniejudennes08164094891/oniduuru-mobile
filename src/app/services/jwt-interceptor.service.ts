import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptorService {

  constructor() {}

  // ✅ Always fetch the latest stored token
  getUserData(): string | null {
    let user: any = localStorage.getItem('eniyan');
    if (user) {
      try {
        let parseUser = JSON.parse(atob(user));
        // ✅ match your actual response key: access_token
        let accessToken = parseUser?.access_token;
        return accessToken || null;
      } catch (error) {
        console.error('Error parsing token from localStorage:', error);
        return null;
      }
    }
    return null;
  }

  // ✅ Automatically attach Authorization header to requests
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.get('Skip-Interceptor') === 'true') {
      return next.handle(req);
    }

    const token = this.getUserData();

    const jwToken = req.clone({
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {}
    });

    return next.handle(jwToken);
  }

  // ✅ Use getter methods so the latest token is always used
  public get customNoAuthHttpHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*',
    });
  }

  public get customHttpHeaders(): HttpHeaders {
    const token = this.getUserData();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*',
      'Authorization': token ? `Bearer ${token}` : '',
    });
  }

  public get customFormDataHttpHeaders(): HttpHeaders {
    const token = this.getUserData();
    return new HttpHeaders({
      'accept': '*/*',
      'Authorization': token ? `Bearer ${token}` : '',
    });
  }
}
