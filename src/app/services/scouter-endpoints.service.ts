// scouter-endpoints.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { map, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { JwtInterceptorService } from '../services/jwt-interceptor.service';
import { FilterScouterParam, PaginationParams } from 'src/app/models/mocks';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ScouterEndpointsService {
  private baseUrl = environment.baseUrl;

  private tokenKey = 'access_token';

  public getToken(): string | null {
    const token = localStorage.getItem(this.tokenKey);
    return token;
  }

  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
    private toast: ToastController
  ) {}

  private debugEndpointFormats(scouterId: string): void {
    const possibleEndpoints = [
      // Try different formats
      `scouters/v1/edit-scouter-profile/${scouterId}`,
      `scouters/v1/edit-scouter-profile/scouter/${scouterId.split('/').pop()}`,
      `scouters/v1/edit-scouter-profile/${scouterId.split('/').pop()}`,
      `scouters/v1/scouter-profile/${scouterId}`,
      `scouters/v1/scouter-profile/${scouterId.split('/').pop()}`,
    ];

    console.log('🔍 Possible endpoint formats:');
    possibleEndpoints.forEach((endpoint, index) => {
      console.log(`Option ${index + 1}: ${endpoint}`);
    });
  }

  // ============ AUTHENTICATION & ONBOARDING ============
  completeScouterRegistration(tempUserId: string): Observable<any> {
    return this.http.post(`${endpoints.onboardScouter}/complete`, {
      id: tempUserId,
    });
  }

  // In your scouter-endpoints.service.ts
  createScouterProfile(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/scouter/create-scouter-profile`,
      payload
      // { headers: this.jwtInterceptor.customNoAuthHttpHeaders }
    );
  }

  resendOtp(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/scouter/resend-otp`,
      payload
      //    {
      //   headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      // }
    );
  }

  verifyOtp(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/scouter/verify-otp`,
      payload
      //   {
      //   headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      // }
    );
  }

  // ============ PROFILE MANAGEMENT ============

  public fetchScouterProfile(scouterId: string): Observable<any> {
    if (!scouterId || scouterId.trim() === '') {
      return throwError(() => new Error('Invalid scouterId provided'));
    }

    // Try multiple endpoint formats
    const endpointsToTry = [
      `${
        environment?.baseUrl
      }/scouters/v1/fetch-scouter-profile/${encodeURIComponent(scouterId)}`,
      `${environment?.baseUrl}/scouters/v1/scouter-profile/${encodeURIComponent(
        scouterId
      )}`,
      `${environment?.baseUrl}/scouters/v1/get-profile/${encodeURIComponent(
        scouterId
      )}`,
    ];

    console.log('🔍 Attempting profile fetch with endpoints:', endpointsToTry);

    return this.tryEndpoints(endpointsToTry);
  }

  private tryEndpoints(
    endpoints: string[],
    index: number = 0
  ): Observable<any> {
    if (index >= endpoints.length) {
      return throwError(() => new Error('All profile endpoints failed'));
    }

    const url = endpoints[index];
    console.log(`🔄 Trying endpoint ${index + 1}: ${url}`);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(15000),
        catchError((error) => {
          console.warn(`❌ Endpoint ${index + 1} failed:`, error?.message);

          if (index < endpoints.length - 1) {
            // Try next endpoint
            return this.tryEndpoints(endpoints, index + 1);
          } else {
            // All endpoints failed
            return throwError(
              () =>
                new Error(
                  `All profile endpoints failed. Last error: ${error?.message}`
                )
            );
          }
        })
      );
  }

  // In scouter-endpoints.service.ts
  public updateScouterProfile(
    scouterId: string,
    scouter: any
  ): Observable<any> {
    const encodedScouterId = encodeURIComponent(scouterId);
    const url = `${environment.baseUrl}/scouters/v1/edit-scouter-profile/${encodedScouterId}`;

    console.log('🚀 UPDATE PROFILE REQUEST:', { url, payload: scouter });

    return this.http
      .patch(url, scouter, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(30000),
        map((response: any) => {
          console.log('📥 RAW BACKEND RESPONSE:', response);

          // Handle empty but successful responses
          if (response === null || response === undefined) {
            console.warn(
              '⚠️ Backend returned null response - operation likely succeeded'
            );
            return {
              success: true,
              message: 'Profile updated successfully',
              // Include the sent data so frontend has something to work with
              data: scouter,
            };
          }

          // If response is empty object but status is 200, consider success
          if (
            typeof response === 'object' &&
            Object.keys(response).length === 0
          ) {
            console.warn(
              '⚠️ Backend returned empty object - operation likely succeeded'
            );
            return {
              success: true,
              message: 'Profile updated successfully',
              data: scouter,
            };
          }

          return response;
        }),
        catchError((error) => {
          console.error('❌ Profile update failed:', error);

          let errorMessage = 'Failed to update profile';
          if (error.status === 404) {
            errorMessage =
              'Profile update endpoint not found. Please contact support.';
          } else if (error.status === 401) {
            errorMessage = 'Session expired. Please login again.';
          } else if (error.status === 422) {
            errorMessage = 'Invalid data. Please check your inputs.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  // Call this method in ngOnInit after loadInitialData()

  // Enhanced extractNumericId method
  private extractNumericId(scouterId: any): string | null {
    if (!scouterId) return null;

    console.log('🔍 Extracting numeric ID from:', scouterId);

    if (typeof scouterId === 'string') {
      // Handle format like "6985/29September2025"
      if (scouterId.includes('/')) {
        const parts = scouterId.split('/');
        const numericPart = parts.find((part) => /^\d+$/.test(part));
        if (numericPart) {
          console.log('✅ Extracted numeric part:', numericPart);
          return numericPart;
        }
      }

      // If it's already numeric, return as is
      if (/^\d+$/.test(scouterId)) {
        return scouterId;
      }
    }

    // If it's an object, try to get the ID property
    if (typeof scouterId === 'object') {
      return scouterId.id || scouterId.scouterId || scouterId._id;
    }

    return String(scouterId);
  }

  // Enhanced alternative endpoint handler
  private tryAlternativeEndpoints(
    urls: string[],
    payload: any
  ): Observable<any> {
    if (urls.length === 0) {
      // All formats failed - provide detailed error
      const error = new Error(`
      All endpoint formats failed for profile update.
      
      Possible issues:
      1. Backend endpoint might be different
      2. Scouter ID format might be incorrect
      3. PATCH method might not be supported
      4. Endpoint might require different parameters
      
      Please check:
      - Backend API documentation
      - Scouter ID format in user data
      - Network tab for exact request/response
    `);
      return throwError(() => error);
    }

    const currentUrl = urls[0];
    console.log(`🔄 Trying alternative endpoint: ${currentUrl}`);

    return this.http
      .patch(currentUrl, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((response) => {
          console.log(
            `✅ SUCCESS with alternative endpoint: ${currentUrl}`,
            response
          );
        }),
        catchError((error) => {
          console.error(`❌ Failed with: ${currentUrl}`, error);

          if (urls.length > 1) {
            return this.tryAlternativeEndpoints(urls.slice(1), payload);
          }

          // Final error with all attempted URLs
          const finalError = new Error(`
          All update endpoints failed. Attempted URLs:
          ${urls.map((url) => `- ${url}`).join('\n')}
          
          Last error: ${error.message}
          Status: ${error.status}
        `);
          return throwError(() => finalError);
        })
      );
  }

  // Add a method to test the endpoint
  public testUpdateEndpoint(scouterId: string): void {
    const numericId = this.extractNumericId(scouterId);

    const testPayload = {
      fullName: 'Test User',
      phoneNumber: '08012345678',
      email: 'test@example.com',
      location: 'Test Location',
      scoutingPurpose: 'Testing',
      organizationType: JSON.stringify(['Test']),
      payRange: '50k',
    };

    console.log('🧪 TESTING UPDATE ENDPOINT:');
    console.log('Scouter ID:', scouterId);
    console.log('Numeric ID:', numericId);
    console.log('Test Payload:', testPayload);

    this.updateScouterProfile(scouterId, testPayload).subscribe({
      next: (res) => console.log('✅ TEST SUCCESS:', res),
      error: (err) => console.error('❌ TEST FAILED:', err),
    });
  }

  // ============ PROFILE PICTURE MANAGEMENT ============

  // ✅ FIX: Use POST for both upload and replace to avoid CORS issues

  public uploadScouterPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    let url = `${environment?.baseUrl}/${endpoints.uploadProfilePic}`;
    console.log('📷 Uploading profile picture to:', url);

    return this.http
      .post<any>(url, body, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Profile picture upload failed:', error);
          return throwError(() => error);
        })
      );
  }

  public uploadScouterPictureFormData(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/scouters/v1/upload-profile-picture`;

    return this.http
      .post(url, formData, {
        headers: {
          // Let browser set Content-Type with boundary automatically
          Authorization: `Bearer ${this.getToken()}`,
        },
      })
      .pipe(
        tap((res) => console.log('✅ FormData upload successful:', res)),
        catchError((error) => {
          console.error('❌ FormData upload failed:', error);
          return throwError(() => error);
        })
      );
  }

  public replaceScouterPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    // ✅ Use POST with the upload endpoint instead of PATCH with update endpoint
    let url = `${environment?.baseUrl}/${endpoints.uploadProfilePic}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // In scouter-endpoints.service.ts

  // In scouter-endpoints.service.ts - UPDATE getScouterPicture method
  public getScouterPicture(scouterId: any): Observable<any> {
    // Ensure we have a valid numeric ID
    const numericId = this.extractNumericId(scouterId);
    if (!numericId) {
      console.error('❌ Invalid scouter ID for profile picture:', scouterId);
      return of(null);
    }

    let url = `${environment?.baseUrl}/${endpoints.getPictureByScouterId}/${numericId}`;
    console.log('📷 Fetching profile picture from:', url);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        catchError((error) => {
          // Handle different error scenarios gracefully
          if (error.status === 401) {
            console.log(
              '📷 401 from profile picture endpoint - likely no picture exists'
            );
            // Return null instead of throwing to prevent breaking the flow
            return of(null);
          } else if (error.status === 404) {
            console.log('📷 No profile picture found for user:', numericId);
            return of(null);
          } else {
            console.error('📷 Error loading profile picture:', error);
            return of(null); // Still return null for other errors
          }
        })
      );
  }

  public removeProfilePicture(scouterId: any): Observable<any> {
    const numericId = this.extractNumericId(scouterId);
    if (!numericId) {
      return throwError(() => new Error('Invalid scouter ID'));
    }

    let url = `${environment?.baseUrl}/${endpoints.deleteProfilePicture}/${numericId}`;
    console.log('📷 Removing profile picture from:', url);

    return this.http
      .delete<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Failed to remove profile picture:', error);
          return throwError(() => error);
        })
      );
  }

  // ============ PAYMENT & RECEIPTS ============
  verifyPaymentStatus(data: any): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.verifyPayment}`;
    return this.http.post<any>(url, data, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchScouterReceipt(scouterId: any): Observable<any> {
    const encodedScouterId = encodeURIComponent(scouterId);
    const url = `${this.baseUrl}/${endpoints.scouterPaymentRecipt}/${encodedScouterId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ============ TALENT & SKILLSETS ============
  fetchAllSkillsets(): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.fetchAllTalentSkillsets}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  fetchSkillDropdown(): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.fetchDropdownItems}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ============ SCOUTER MANAGEMENT ============
  fetchAllScouters(pagination: PaginationParams): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.fetchAllScouters}`;
    const params = new HttpParams()
      .set('limit', String(pagination?.limit))
      .set('pageNo', String(pagination?.pageNo));

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params,
    });
  }

  toggleScouterStatus(data: any, uniqueIdentifier: string): Observable<any> {
    const encodedScouterId = encodeURIComponent(uniqueIdentifier);
    const url = `${this.baseUrl}/${endpoints.toggleScouterStatus}/${encodedScouterId}`;
    return this.http.patch<any>(url, data, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  toggleScouterPaymentStatus(
    data: any,
    uniqueIdentifier: string
  ): Observable<any> {
    const encodedScouterId = encodeURIComponent(uniqueIdentifier);
    const url = `${this.baseUrl}/${endpoints.toggleScouterPaymentStatus}/${encodedScouterId}`;
    return this.http.patch<any>(url, data, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  filterScouterParam(filterParam: FilterScouterParam): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.filterScouterParam}`;
    return this.http.post<any>(url, filterParam, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // scouter-endpoints.service.ts

  logComplaint(payload: {
    fullName: string;
    uniqueId: string;
    complaint: string;
    role: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/${endpoints.logComplaint}`;
    console.log('📝 Sending complaint to:', url, payload);

    return this.http
      .post<any>(url, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((res) => console.log('✅ Complaint logged successfully:', res)),
        catchError((error) => {
          console.error('❌ Failed to log complaint:', error);
          return throwError(() => error);
        })
      );
  }

  // ============ NOTIFICATIONS ============

  /// In scouter-endpoints.service.ts
  fetchAllNotifications(receiverId?: string): Observable<any> {
    const url = `${this.baseUrl}/utility/v1/get-all-notifications`;
    const params = receiverId
      ? new HttpParams().set('receiverId', receiverId)
      : undefined;

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params,
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Notifications API Error:', error);
          // Return empty notifications array on error
          return of({ notifications: [] });
        })
      );
  }

  // createNotification(payload: {
  //   senderId: string;
  //   receiverId: string;
  //   message: string;
  // }): Observable<any> {
  //   const url = `${this.baseUrl}/${endpoints.NOT}`;
  //   return this.http.post<any>(url, payload, {
  //     headers: this.jwtInterceptor.customHttpHeaders,
  //   });
  // }

  // Update your service methods with better error handling
  clearMyNotifications(payload: {
    receiverId: string;
    loggedInUniqueId: string;
  }): Observable<any> {
    const url = `${this.baseUrl}/utility/v1/clear-my-notifications`;
    return this.http
      .post<any>(url, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Clear notifications error:', error);
          return throwError(() => ({
            message: error.error?.message || 'Failed to clear notifications',
            status: error.status,
          }));
        })
      );
  }

  // Add to scouter-endpoints.service.ts

  // Market Engagements
  getAllMarketsByScouter(
    scouterId: string,
    params?: {
      statusParams?: string;
      talentId?: string;
      limit?: number;
      pageNo?: number;
    }
  ): Observable<any> {
    const encodedScouterId = encodeURIComponent(scouterId);
    const url = `${this.baseUrl}/market/v1/get-all-markets/scouter/${encodedScouterId}`;

    let httpParams = new HttpParams();

    if (params?.statusParams) {
      httpParams = httpParams.set('statusParams', params.statusParams);
    }

    if (params?.talentId) {
      httpParams = httpParams.set('talentId', params.talentId);
    }

    if (params?.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    if (params?.pageNo) {
      httpParams = httpParams.set('pageNo', params.pageNo.toString());
    }

    console.log('📊 Fetching market engagements:', { url, params });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: httpParams,
      })
      .pipe(
        timeout(15000),
        catchError((error) => {
          console.error('❌ Failed to fetch market engagements:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message || 'Failed to load market engagements'
              )
          );
        })
      );
  }
}

// When adding new endpoints to your services, follow this pattern:

// In scouter-endpoints.service.ts
// yourNewMethod(data: any): Observable<any> {
//   const url = `${this.baseUrl}/${endpoints.yourNewEndpoint}`;
//   return this.http.post<any>(url, data, {
//     headers: this.jwtInterceptor.customHttpHeaders,
//   });
// }

// // For public endpoints (no auth required)
// yourPublicMethod(data: any): Observable<any> {
//   const url = `${this.baseUrl}/${endpoints.yourPublicEndpoint}`;
//   return this.http.post<any>(url, data, {
//     headers: this.jwtInterceptor.customNoAuthHttpHeaders,
//   });
// }

// // For file uploads
// uploadFile(data: FormData): Observable<any> {
//   const url = `${this.baseUrl}/${endpoints.uploadFile}`;
//   return this.http.post<any>(url, data, {
//     headers: this.jwtInterceptor.customFormDataHttpHeaders,
//   });
// }
