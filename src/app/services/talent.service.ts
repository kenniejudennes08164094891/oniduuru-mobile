import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { endpoints } from '../models/endpoint';

@Injectable({
  providedIn: 'root'
})
export class TalentService {

  constructor(private http: HttpClient) {}

  // Create Talent Profile
  createTalentProfile(talent: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.onboardTalent}`;
    return this.http.post(url, talent, {
      headers: { 'No-Auth': 'true' }
    });
  }

  // Verify OTP
  verifyOTP(params: { otp: string; phoneNumber: string; email: string }): Observable<any> {
    const url =
      `${environment.baseUrl}/${endpoints.verifyOTP}` +
      `?otp=${params.otp}` +
      `&phoneNumber=${params.phoneNumber}` +
      `&email=${params.email}`;

    return this.http.post(url, {}, {
      headers: { 'No-Auth': 'true' }
    });
  }

  // Resend OTP
  resendOTP(params: { phoneNumber: string; email: string }): Observable<any> {
    const url =
      `${environment.baseUrl}/${endpoints.resendOTP}` +
      `?phoneNumber=${params.phoneNumber}` +
      `&email=${params.email}`;

    return this.http.get(url, {
      headers: { 'No-Auth': 'true' }
    });
  }
}
