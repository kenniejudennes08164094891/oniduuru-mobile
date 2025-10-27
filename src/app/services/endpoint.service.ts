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

  public fetchTalentProfile(talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.fetchTalentProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public fetchSkillDropdown(): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.fetchDropdownItems}`;
    return this.http.get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders });
  }

  public updateTalentProfile(talentId: string, talent: any): Observable<any> {
    const body = JSON.stringify(talent);
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.updateTalentProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor.customHttpHeaders });
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

  public uploadTalentReel(payload:  any): Observable<any> {
    const body = JSON.stringify(payload);
    let url = `${environment?.baseUrl}/${endpoints?.uploadTalentReel}`;
    return this.http.post<any>(url, body, { headers: this.jwtInterceptor?.customFormDataHttpHeaders });
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
    return this.http.patch<any>(url, body, { headers: this.jwtInterceptor?.customFormDataHttpHeaders });
  }

}
