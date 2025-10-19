import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { JwtInterceptorService } from "./jwt-interceptor.service";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";
import { endpoints } from "../models/endpoint";
import { Observable } from "rxjs";

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
  public createTalentProfile(talent: any): Observable<any> {
    let body = JSON.stringify(talent);
    let url = `${environment?.baseUrl}/${endpoints?.onboardTalent}`;
    return this.http.post<any>(url, body, { headers: this.jwtInterceptor.customNoAuthHttpHeaders });
  }
  public updateTalentProfile(talentId: string, talent: any): Observable<any> {
    const body = JSON.stringify(talent);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
  }
   public fetchTalentProfile(talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.fetchTalentProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }
   public uploadTalentReel(formData: FormData | any): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.uploadTalentReel}`;
    return this.http.post<any>(url, formData, { headers: this.jwtInterceptor?.customFormDataHttpHeaders });
  }
  public createTalentMarketProfileData(payload: any, talentId: string):Observable<any>{
    const body = JSON.stringify(payload);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.createTalentMarketProfile}?${encodedTalentId}`;
    return this.http.post<any>(url,body, {headers: this.jwtInterceptor.customHttpHeaders});
  }
   public fetchTalentMarketProfile(talentId: string):Observable<any>{
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.getTalentMarketProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, {headers: this.jwtInterceptor.customHttpHeaders});
  }
   public updateTalentMarketProfileData(payload: any, talentId: string):Observable<any>{
    const body = JSON.stringify(payload);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentMarketProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url,body, {headers: this.jwtInterceptor.customHttpHeaders});
  }
}
