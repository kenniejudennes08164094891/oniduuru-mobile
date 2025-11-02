import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { JwtInterceptorService } from "./jwt-interceptor.service";
import { AuthService } from "./auth.service";
import { environment } from "../../environments/environment";
import { endpoints } from "../models/endpoint";
import { Observable } from "rxjs";
import { HttpParams } from "@angular/common/http";
import { PaginationParams } from 'src/app/models/mocks';
@Injectable({
  providedIn: 'root'
})
export class EndpointService {

  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
    private authService: AuthService,

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
    return this.http.post<any>(url, formData, { headers: this.jwtInterceptor?.customHttpHeaders });
  }
  public createTalentMarketProfileData(payload: any, talentId: string): Observable<any> {
    const body = JSON.stringify(payload);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.createTalentMarketProfile}?${encodedTalentId}`;
    return this.http.post<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
  }
  public fetchTalentMarketProfile(talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.getTalentMarketProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }
  public updateTalentMarketProfileData(payload: any, talentId: string): Observable<any> {
    const body = JSON.stringify(payload);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentMarketProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
  }
  public fetchMarketsByTalent(
    talentId: string,
    paginationParams: PaginationParams = { limit: 10, pageNo: 1 },
    statusParams: string = '',
    scouterId: string = ''
  ): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment?.baseUrl}/${endpoints?.getMarketsByTalentId}/${encodedTalentId}`;

    let params = new HttpParams()
      .set('statusParams', statusParams?.trim() ?? '')
      .set('scouterId', scouterId?.trim() ?? '')
      .set('limit', String(paginationParams?.limit ?? 10))
      .set('pageNo', String(paginationParams?.pageNo ?? 1));

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params
    });
  }


  public fetchSkillDropdown(): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.fetchDropdownItems}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public uploadTalentPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints?.uploadTalentProfilePic}`;
    return this.http.post<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public replaceTalentPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentProfilePic}`;
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public getTalentPicture(talentId: any): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.getPictureByTalentId}/${encodedTalentId}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public createTalentSecurityQuestion(payload:any):Observable<any>{
    const body = JSON.stringify(payload);
    let url = `${environment?.baseUrl}/${endpoints?.createTalentSecurityQuestions}`;
    return this.http.post<any>(url, body, {headers: this.jwtInterceptor.customNoAuthHttpHeaders});
  }

  public updateTalentSecurityQuestions(payload:any, talentId: string):Observable<any>{
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentSecurityQuestions}?talentId=${encodedTalentId}`;
    return this.http.put<any>(url, body, {headers: this.jwtInterceptor.customNoAuthHttpHeaders});
  }

  public getMySecurityQuestionsWithAnswers(uniqueId: string):Observable<any>{
    let url = `${environment?.baseUrl}/${endpoints?.getMySecurityQuestionsWithAnswers}?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, {headers: this.jwtInterceptor.customHttpHeaders});
  }

  fetchUrlFromCloudinary(apiUrl:string,formData:FormData):Observable<any>{
    return this.http.post<any>(apiUrl, formData);
  }

  fetchCloudinarySecrets():Observable<any>{
    let url = `${environment?.baseUrl}/${endpoints?.cloudinaryGetSecrets}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public fetchTalentReel(talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.getTalentReel}/${encodedTalentId}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public replaceTalentReel(payload: any, talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    const body = JSON.stringify(payload);
    let url = `${environment?.baseUrl}/${endpoints?.replaceTalentReel}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor?.customHttpHeaders });
  }

  public getScouterPicture(scouterId: any): Observable<any>{
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.getPictureByScouterId}/${encodedScouterId}`;
    return this.http.get<any>(url, {headers: this.jwtInterceptor.customHttpHeaders});
  }


}
