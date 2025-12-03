import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { endpoints } from '../models/endpoint';

@Injectable({
  providedIn: 'root'
})
export class TalentService {

  constructor(private http: HttpClient) { }

  // Create Talent Profile
  createTalentProfile(talent: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.onboardTalent}`;
    return this.http.post<any>(url, talent, {
      headers: new HttpHeaders({
        "No-Auth": "true",
        "Content-Type": "application/json"
      })
    });
  }
  // Verify OTP
  verifyOTP(params: { otp: string; phoneNumber: string; email: string }): Observable<any> {

    const url = `${environment.baseUrl}/${endpoints.verifyOTP}`;

    const queryParams = new HttpParams()
      .set("otp", params.otp)
      .set("phoneNumber", params.phoneNumber)
      .set("email", params.email);

    return this.http.post<any>(url, {}, {
      headers: new HttpHeaders({ "No-Auth": "true" }),
      params: queryParams
    });
  }

  // Resend OTP
  resendOTP(params: { phoneNumber: string; email: string }): Observable<any> {

    const url = `${environment.baseUrl}/${endpoints.resendOTP}`;

    const queryParams = new HttpParams()
      .set("phoneNumber", params.phoneNumber)
      .set("email", params.email);

    return this.http.get<any>(url, {
      headers: new HttpHeaders({ "No-Auth": "true" }),
      params: queryParams
    });
  }
}
