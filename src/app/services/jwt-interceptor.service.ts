import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class JwtInterceptorService {

  constructor() {
    this.getUserData();
  }

  getUserData(): any {
    let user: any = localStorage.getItem('eniyan');
    if (user !== null) {
      let parseUser = JSON.parse(atob(user));
      let accessToken = parseUser?.access_token;
      return accessToken;
    }
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.get('Skip-Interceptor') === 'true') {
      return next.handle(req);
    }
    let token: any = this.getUserData();
    let jwToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
    return next.handle(jwToken);
  }

  public customNoAuthHttpHeaders: any = new HttpHeaders({
    'Content-Type': 'application/json',
    'accept': '*/*',
  })


  public customHttpHeaders: any = new HttpHeaders({
    'Content-Type': 'application/json',
    'accept': '*/*',
    'Authorization': `Bearer ${this.getUserData()}`,
  })

  public customFormDataHttpHeaders = new HttpHeaders({
    // 'Content-Type': 'multipart/form-data',
    'accept': '*/*',
    'Authorization': `Bearer ${this.getUserData()}`,
  })

}
