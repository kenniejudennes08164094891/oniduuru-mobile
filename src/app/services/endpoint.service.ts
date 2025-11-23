import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { JwtInterceptorService } from './jwt-interceptor.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { PaginationParams } from 'src/app/models/mocks';

@Injectable({
  providedIn: 'root',
})
export class EndpointService {
  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
    private authService: AuthService
  ) {}

  fetchTalentProfile(talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.fetchTalentProfile}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  createTalentProfile(talent: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.onboardTalent}`;
    return this.http.post<any>(url, JSON.stringify(talent), {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  updateTalentProfile(talentId: string, talent: any): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentProfile}/${encoded}`;
    return this.http.patch<any>(url, JSON.stringify(talent), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchSkillDropdown(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchDropdownItems}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  createTalentMarketProfileData(payload: any, talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.createTalentMarketProfile}?${encoded}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchTalentMarketProfile(talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getTalentMarketProfile}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  updateTalentMarketProfileData(payload: any, talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentMarketProfile}/${encoded}`;
    return this.http.patch<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchMarketsByTalent(
    talentId: string,
    pagination: PaginationParams = { limit: 10, pageNo: 1 },
    statusParams: string = '',
    scouterId: string = ''
  ): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getMarketsByTalentId}/${encoded}`;

    const params = new HttpParams()
      .set('statusParams', statusParams?.trim() ?? '')
      .set('scouterId', scouterId?.trim() ?? '')
      .set('limit', String(pagination?.limit ?? 10))
      .set('pageNo', String(pagination?.pageNo ?? 1));

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params,
    });
  }

  uploadTalentPicture(data: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.uploadTalentProfilePic}`;
    return this.http.post<any>(url, JSON.stringify(data), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  replaceTalentPicture(data: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.updateTalentProfilePic}`;
    return this.http.patch<any>(url, JSON.stringify(data), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  getTalentPicture(talentId: any): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getPictureByTalentId}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  getScouterPicture(scouterId: any): Observable<any> {
    const encoded = encodeURIComponent(scouterId);
    const url = `${environment.baseUrl}/${endpoints.getPictureByScouterId}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  createTalentSecurityQuestion(payload: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.createTalentSecurityQuestions}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  updateTalentSecurityQuestions(payload: any, talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentSecurityQuestions}?talentId=${encoded}`;
    return this.http.put<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  getMySecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestionsWithAnswers}?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  fetchUrlFromCloudinary(apiUrl: string, formData: FormData): Observable<any> {
    return this.http.post<any>(apiUrl, formData);
  }

  fetchCloudinarySecrets(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.cloudinaryGetSecrets}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  // ================================================================
  // ✅ TALENT REEL APIs
  // ================================================================
  uploadTalentReel(payload: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.uploadTalentReel}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchTalentReel(talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getTalentReel}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  replaceTalentReel(payload: any, talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.replaceTalentReel}/${encoded}`;
    return this.http.patch<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchTalentStats(talentId: string): Observable<any> {
    const encoded = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.talentDashboardStats}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  fetchScouterMarketStatsWithTalent(talentId: string, scouterId: string): Observable<any> {
    const encodedTalent = encodeURIComponent(talentId);
    const encodedScouter = encodeURIComponent(scouterId);
    const url = `${environment.baseUrl}/${endpoints.scouterMarketWithTalent}/${encodedScouter}/${encodedTalent}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  createWalletAccount(payload: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.createWalletAccount}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchMyWallet(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyWallet}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  fundsDeposit(payload: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fundsDeposit}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchMyDeposits(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyDeposits}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  fetchSingleDeposit(depositId: string): Observable<any> {
    const encoded = encodeURIComponent(depositId);
    const url = `${environment.baseUrl}/${endpoints.fetchSingleDeposit}/${encoded}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  calculateCharge(payload: any): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.calculateCharge}`;
    return this.http.post<any>(url, JSON.stringify(payload), {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public withdrawFunds(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.withdrawFunds}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchMyWithdrawals(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyWithdrawals}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public transferFunds(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.transferFunds}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchMyTransfers(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyTransfers}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public walletStats(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.walletStats}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public histogramData(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.histogramData}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }


}
