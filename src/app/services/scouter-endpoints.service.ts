// endpoint.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { JwtInterceptorService } from '../services/jwt-interceptor.service';
import { FilterScouterParam, PaginationParams } from 'src/app/models/mocks';

@Injectable({
  providedIn: 'root',
})
export class ScouterEndpointsService {
  private baseUrl = environment.baseUrl;
  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService
  ) {}

  public fetchScouterProfile(scouterId: string): Observable<any> {
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.fetchScouterProfile}/${encodedScouterId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Fetch scouter profile
  // fetchScouterProfile(scouterId: string): Observable<any> {
  //   const url = `${this.baseUrl}/${endpoints.fetchScouterProfile}/${scouterId}`;
  //   return this.http.get(url);
  // }

  // ✅ Update scouter profile
  // updateScouterProfile(scouterId: string, body: any): Observable<any> {
  //   const url = `${this.baseUrl}/${endpoints.updateScouterProfile}/${scouterId}`;
  //   return this.http.patch(url, body);
  // }

  // ✅ Upload profile picture (POST)
  uploadProfilePic(scouterId: string, base64Picture: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.uploadProfilePic}`;
    return this.http.post(url, { scouterId, base64Picture });
  }

  // ✅ Update profile picture (PATCH)
  updateProfilePic(scouterId: string, base64Picture: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.updateScouterProfile}`;
    return this.http.patch(url, { scouterId, base64Picture });
  }

  // ✅ Get profile picture by scouterId
  getProfilePic(scouterId: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.getPictureByScouterId}/${scouterId}`;
    return this.http.get(url);
  }

  // ✅ Delete profile picture
  deleteProfilePic(scouterId: string): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.deleteProfilePicture}/${scouterId}`;
    return this.http.delete(url);
  }

  public updateScouterProfile(
    scouterId: string,
    scouter: any
  ): Observable<any> {
    const body = JSON.stringify(scouter);
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.updateScouterProfile}/${encodedScouterId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // inside ScouterEndpointsService
  public updateScouterSecurityQuestions(
    scouterId: string,
    securityQuestions: any[]
  ): Observable<any> {
    const url = `${this.baseUrl}/${
      endpoints.updateScouterSecurityQuestions
    }/${encodeURIComponent(scouterId)}`;
    const body = JSON.stringify({ securityQuestions }); // send as object
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public uploadScouterPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints?.uploadProfilePic}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public replaceScouterPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints?.updateProfilePic}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public getScouterPicture(scouterId: any): Observable<any> {
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.getPictureByScouterId}/${encodedScouterId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public removeProfilePicture(scouterId: any): Observable<any> {
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.deleteProfilePicture}/${encodedScouterId}`;
    return this.http.delete<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public verifyPaymentStatus(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints?.verifyPayment}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchScouterReciept(scouterId: any): Observable<any> {
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.scouterPaymentRecipt}/${encodedScouterId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchAllSkillsets(): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.fetchAllTalentSkillsets}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchSkillDropdown(): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.fetchDropdownItems}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchAllTalentByLocations(
    pagination: PaginationParams
  ): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.fetchAllTalents}?location=${pagination?.location}`;
    const params: HttpParams = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  public fetchAllTalentBySkillsets(
    pagination: PaginationParams
  ): Observable<any> {
    const params: HttpParams = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));
    const skillParams = pagination.skillset?.map(
      (skill: any) => `skillset=${encodeURIComponent(skill)}`
    );
    const querySkillString = '?' + skillParams.join('&');
    let url = `${environment?.baseUrl}/${endpoints?.fetchAllTalents}${querySkillString}`;
    // console.log("skills url>>", url);
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  public fetchAllTalentByLocation(
    pagination: PaginationParams
  ): Observable<any> {
    const params: HttpParams = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));
    const locationParams = encodeURIComponent(pagination?.location);
    let url = `${environment?.baseUrl}/${endpoints?.fetchAllTalents}?location=${locationParams}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  public fetchAllTalentByDefinedSkillLevel(
    pagination: PaginationParams,
    arrayToFilter: any
  ): Observable<any> {
    const body = JSON.stringify(arrayToFilter);
    const params: HttpParams = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));
    const skillLevelParams = encodeURIComponent(pagination?.skillLevel);
    let url = `${environment?.baseUrl}/${endpoints?.filterSkillLevel}?skillLevel=${skillLevelParams}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  public fetchAllScouters(pagination: PaginationParams): Observable<any> {
    const params: HttpParams = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));
    // const searchParams = encodeURIComponent(pagination?.search);   ?search=${search}
    let url = `${environment?.baseUrl}/${endpoints?.fetchAllScouters}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  public toogleScouterStatus(
    data: any,
    uniqueIdentifier: string
  ): Observable<any> {
    const body = JSON.stringify(data);
    let encodedScouterId = encodeURIComponent(uniqueIdentifier);
    let url = `${environment?.baseUrl}/${endpoints?.toggleScouterStatus}/${encodedScouterId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public toogleScouterPaymentStatus(
    data: any,
    uniqueIdentifier: string
  ): Observable<any> {
    const body = JSON.stringify(data);
    let encodedScouterId = encodeURIComponent(uniqueIdentifier);
    let url = `${environment?.baseUrl}/${endpoints?.toggleScouterPaymentStatus}/${encodedScouterId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public filterScouterParam(filterParam: FilterScouterParam): Observable<any> {
    const body = JSON.stringify(filterParam);
    let url = `${environment?.baseUrl}/${endpoints?.filterScouterParam}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }
}
