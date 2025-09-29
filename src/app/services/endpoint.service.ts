import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {JwtInterceptorService} from "./jwt-interceptor.service";
import {AuthService} from "./auth.service";
import {environment} from "../../environments/environment";
import {endpoints} from "../models/endpoint";
import {Observable} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
    private authService: AuthService
  ) { }

  public getAllCountries(): Observable<any> {
    let url: string = `${environment?.baseUrl}/${endpoints?.getAllCountryFlags}`;
    return this.http.get<any>(url);
  }
}
