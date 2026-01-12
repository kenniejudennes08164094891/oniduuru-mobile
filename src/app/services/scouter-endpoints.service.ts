// scouter-endpoints.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, of, tap, throwError } from 'rxjs';
import { map, retry, timeout } from 'rxjs/operators';
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

  // ============ AUTHENTICATION & ONBOARDING ============
  completeScouterRegistration(tempUserId: string): Observable<any> {
    return this.http.post(`${endpoints.onboardScouter}/complete`, {
      id: tempUserId,
    });
  }

  // In your scouter-endpoints.service.ts
  createScouterProfile(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/${endpoints.onboardScouter}`, // ✅ USING CONSTANT
      payload
      // { headers: this.jwtInterceptor.customNoAuthHttpHeaders }
    );
  }

  // In scouter-endpoints.service.ts - FIXED OTP METHODS

  // In scouter-endpoints.service.ts - FIXED OTP METHODS

  resendOtp(payload: {
    email?: string;
    phoneNumber?: string;
  }): Observable<any> {
    // Convert payload to query parameters
    let params = new HttpParams();

    if (payload.email) {
      params = params.set('email', payload.email);
    }

    if (payload.phoneNumber) {
      params = params.set('phoneNumber', payload.phoneNumber);
    }

    console.log('🔍 Resend OTP GET Query Params:', params.toString());

    // Use GET method as per API documentation
    return this.http.get<any>(`${this.baseUrl}/${endpoints.resendOTP}`, {
      params,
    });
  }

  verifyOtp(payload: {
    otp: string;
    email?: string;
    phoneNumber?: string;
  }): Observable<any> {
    // Convert payload to query parameters
    let params = new HttpParams().set('otp', payload.otp);

    if (payload.email) {
      params = params.set('email', payload.email);
    }

    if (payload.phoneNumber) {
      params = params.set('phoneNumber', payload.phoneNumber);
    }

    console.log('🔍 Verify OTP Query Params:', params.toString());

    // Use POST method as per API documentation
    return this.http.post<any>(
      `${this.baseUrl}/${endpoints.verifyOTP}`,
      {}, // Empty body since we're using query params
      { params }
    );
  }

  // ============ PROFILE MANAGEMENT ============

  fetchScouterProfile(scouterId: string): Observable<any> {
    // Try multiple patterns
    const urlPatterns = [
      // Pattern 1: Query parameter (most likely)
      `${this.baseUrl}/${
        endpoints.fetchScouterProfile
      }?scouterId=${encodeURIComponent(scouterId)}`,
      // Pattern 2: Path parameter
      `${this.baseUrl}/${endpoints.fetchScouterProfile}/${encodeURIComponent(
        scouterId
      )}`,
      // Pattern 3: Alternative endpoint
      `${this.baseUrl}/scouters/v1/get-scouter-profile/${encodeURIComponent(
        scouterId
      )}`,
    ];

    console.log('🔍 Trying scouter profile endpoints:', urlPatterns);

    return this.tryEndpointsSequentially(urlPatterns);
  }

  private tryEndpointsSequentially(urls: string[]): Observable<any> {
    return new Observable((observer) => {
      let currentIndex = 0;

      const tryNext = () => {
        if (currentIndex >= urls.length) {
          observer.error(new Error('All profile endpoints failed'));
          return;
        }

        const url = urls[currentIndex];
        console.log(`🔄 Trying endpoint ${currentIndex + 1}: ${url}`);

        this.http
          .get<any>(url, {
            headers: this.jwtInterceptor.customHttpHeaders,
          })
          .subscribe({
            next: (response) => {
              console.log(`✅ Endpoint ${currentIndex + 1} succeeded`);
              observer.next(response);
              observer.complete();
            },
            error: (error) => {
              console.log(
                `❌ Endpoint ${currentIndex + 1} failed: ${error.status}`
              );
              currentIndex++;

              // If it's a 404, try next endpoint
              if (error.status === 404 && currentIndex < urls.length) {
                setTimeout(tryNext, 100);
              } else {
                observer.error(error);
              }
            },
          });
      };

      tryNext();
    });
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
    // Normalize scouterId and try multiple URL formats to be resilient to
    // different backend routing conventions (e.g. with/without `scouter/` or
    // with appended metadata like dates).
    const numericId = this.extractNumericId(scouterId) || scouterId;

    // Also check if the payload contains an 'id' field (some backends use a
    // separate numeric id like details.id = '29'). Prefer explicit ids from
    // the payload when present.
    const payloadId =
      scouter && (scouter.id || scouter.details?.id || scouter.scouterId);

    const candidateUrls = [] as string[];

    if (payloadId) {
      // If payloadId is an object or contains slashes, try to extract numeric
      const pId = typeof payloadId === 'string' ? payloadId : String(payloadId);
      const pNumeric = this.extractNumericId(pId) || pId;
      candidateUrls.push(
        `${environment.baseUrl}/scouters/v1/edit-scouter-profile/${pNumeric}`
      );
      candidateUrls.push(
        `${environment.baseUrl}/scouters/v1/edit-scouter-profile/scouter/${pNumeric}`
      );
    }

    // Standard candidates based on the provided scouterId
    candidateUrls.push(
      `${environment.baseUrl}/${endpoints.updateScouterProfile}/${numericId}`
    );
    candidateUrls.push(
      `${environment.baseUrl}/scouters/v1/edit-scouter-profile/scouter/${numericId}`
    );
    candidateUrls.push(
      `${
        environment.baseUrl
      }/scouters/v1/edit-scouter-profile/${encodeURIComponent(scouterId)}`
    );

    console.log(
      '🚀 UPDATE PROFILE REQUEST - Trying URLs:',
      candidateUrls,
      'payload:',
      scouter
    );

    // Ensure we use application/json for PATCH (some backends reject merge-patch)
    const headers = this.jwtInterceptor.customHttpHeaders.set(
      'Content-Type',
      'application/json'
    );

    // Try each candidate URL until one succeeds
    return this.tryAlternativeEndpoints(candidateUrls, scouter).pipe(
      timeout(30000),
      map((response: any) => {
        console.log('📥 RAW BACKEND RESPONSE:', response);

        if (response === null || response === undefined) {
          console.warn(
            '⚠️ Backend returned null response - operation likely succeeded'
          );
          return {
            success: true,
            message: 'Profile updated successfully',
            data: scouter,
          };
        }

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
        console.error(
          '❌ Profile update failed after trying candidate URLs:',
          error
        );

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
    // Normalize payload and strip any data URL prefix
    const payload = this.normalizePicturePayload(data);
    const url = `${environment?.baseUrl}/${endpoints.uploadProfilePic}`;
    console.log(
      '📷 Uploading profile picture to:',
      url,
      'payload scouterId:',
      payload.scouterId
    );

    // Send object (let HttpClient set JSON headers) but ensure Auth header is present
    const headers = this.jwtInterceptor.customHttpHeaders.set(
      'Content-Type',
      'application/json'
    );

    // Primary attempt: send JSON payload
    return this.http.post<any>(url, payload, { headers }).pipe(
      tap((res) => console.log('✅ Upload response:', res)),
      catchError((error) => {
        console.warn(
          '❌ Profile picture upload failed, attempting fallbacks:',
          error?.status || error?.message
        );

        // Normalize server message (can be string or array)
        let serverMessage = '';
        try {
          const msg = error?.error?.message;
          if (Array.isArray(msg)) serverMessage = msg.join(' ');
          else if (typeof msg === 'string') serverMessage = msg;
          else if (typeof error?.message === 'string')
            serverMessage = error.message;
        } catch (e) {
          serverMessage = String(error?.message || '');
        }

        serverMessage = serverMessage.toLowerCase();

        // If server explicitly indicates create/replace semantics or returns a
        // 400, prefer calling the update (replace) endpoint directly.
        if (error?.status === 400 || serverMessage.includes('replace')) {
          console.warn(
            'ℹ️ Server indicates replace/create semantics. Calling update endpoint...'
          );
          return this.updateScouterPictureDirect(payload);
        }

        // Next attempt: try the upload endpoint with numeric-only scouterId OR
        // the original scouterId if numeric fails. But prefer trying numeric
        // only if it differs from the original.
        const numericId =
          this.extractNumericId(payload.scouterId) || payload.scouterId;
        const numericPayload = { ...payload, scouterId: String(numericId) };

        return this.http.post<any>(url, numericPayload, { headers }).pipe(
          tap((r) =>
            console.log('✅ Upload with numeric scouterId succeeded:', r)
          ),
          catchError((uploadErr) => {
            const numericMsg = String(
              uploadErr?.error?.message || uploadErr?.message || ''
            ).toLowerCase();

            // If numeric attempt fails because the scouter does not exist,
            // try the update endpoint with the original payload (server
            // might be enforcing replace semantics tied to the full scouter
            // path or the authenticated user).
            if (
              numericMsg.includes('does not exist') ||
              uploadErr?.status === 401
            ) {
              console.warn(
                'ℹ️ Numeric id attempt failed. Trying update endpoint with original payload...'
              );
              return this.updateScouterPictureDirect(payload);
            }

            // As a last resort, attempt a multipart/form-data upload that
            // includes both the binary file and the base64 payload field the
            // backend's validators sometimes expect.
            try {
              const form = this.createFormDataFromPayload(payload);
              return this.uploadScouterPictureFormData(form);
            } catch (fmErr) {
              console.error('❌ Failed to construct FormData fallback:', fmErr);
              return throwError(() => uploadErr);
            }
          })
        );
      })
    );
  }

  // Direct update (replace) call that does NOT fall back to upload. This is
  // used when the server indicates create/replace semantics require the
  // explicit update endpoint.
  public updateScouterPictureDirect(payload: any): Observable<any> {
    const updateUrl = `${environment?.baseUrl}/${endpoints.updateProfilePic}`;
    const headers = this.jwtInterceptor.customHttpHeaders.set(
      'Content-Type',
      'application/json'
    );

    console.log(
      '📷 Calling direct update endpoint for profile picture:',
      updateUrl,
      payload.scouterId
    );

    return this.http.post<any>(updateUrl, payload, { headers }).pipe(
      tap((res) => console.log('✅ Update (replace) response:', res)),
      catchError((err) => {
        console.error('❌ Direct update endpoint failed:', err);
        return throwError(() => err);
      })
    );
  }

  // Create FormData from payload.base64Picture
  private createFormDataFromPayload(payload: {
    scouterId: string;
    base64Picture: string;
  }): FormData {
    if (!payload || !payload.base64Picture)
      throw new Error('No base64 picture present');

    const base64 = payload.base64Picture.replace(
      /^data:image\/[a-zA-Z]+;base64,/,
      ''
    );
    // Convert base64 to Blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const form = new FormData();
    // Some backend validators expect the base64 payload field even in a
    // multipart request. Attach both the binary file and the base64 string
    // to maximize compatibility.
    form.append('file', blob, 'profile.jpg');
    form.append('scouterId', String(payload.scouterId));
    form.append('base64Picture', base64);
    return form;
  }

  public uploadScouterPictureFormData(formData: FormData): Observable<any> {
    const url = `${this.baseUrl}/scouters/v1/upload-profile-picture`;
    // Use interceptor-provided headers which include Authorization when available
    const headers = this.jwtInterceptor.customFormDataHttpHeaders;

    return this.http.post(url, formData, { headers }).pipe(
      tap((res) => console.log('✅ FormData upload successful:', res)),
      catchError((error) => {
        console.error('❌ FormData upload failed:', error);
        return throwError(() => error);
      })
    );
  }

  public replaceScouterPicture(data: any): Observable<any> {
    // Normalize payload and strip any data URL prefix
    const payload = this.normalizePicturePayload(data);

    const updateUrl = `${environment?.baseUrl}/${endpoints.updateProfilePic}`;
    const headers = this.jwtInterceptor.customHttpHeaders.set(
      'Content-Type',
      'application/json'
    );

    console.log(
      '📷 Replacing profile picture via update endpoint:',
      updateUrl,
      'scouterId:',
      payload.scouterId
    );

    // First try the explicit update endpoint. If it does not exist (404) or
    // server indicates create/replace mismatch, fall back to the upload
    // endpoint which some environments accept for replace operations.
    return this.http.post<any>(updateUrl, payload, { headers }).pipe(
      tap((res) => console.log('✅ Replace (update endpoint) response:', res)),
      catchError((err) => {
        console.warn(
          '⚠️ Replace via update endpoint failed:',
          err?.status || err?.message
        );

        // If update endpoint missing or server suggests using upload, try upload endpoint
        const shouldFallback =
          err?.status === 404 ||
          (err?.error?.message &&
            String(err.error.message).toLowerCase().includes('replace'));

        if (shouldFallback) {
          const uploadUrl = `${environment?.baseUrl}/${endpoints.uploadProfilePic}`;
          console.log(
            '� Falling back to upload endpoint for replace:',
            uploadUrl
          );
          return this.http.post<any>(uploadUrl, payload, { headers }).pipe(
            tap((r) => console.log('✅ Replace via upload succeeded:', r)),
            catchError((uploadErr) => {
              console.error(
                '❌ Fallback replace via upload failed:',
                uploadErr
              );
              return throwError(() => uploadErr);
            })
          );
        }

        return throwError(() => err);
      })
    );
  }

  // Helper to normalize scouterId and strip data URL prefix from base64
  private normalizePicturePayload(data: any): {
    scouterId: string;
    base64Picture: string;
  } {
    const rawId = data?.scouterId || data?.uniqueId || '';
    let numericId = rawId;

    // If we have a JWT token, prefer the scouterId encoded in it to avoid
    // submitting a scouterId that does not match the authenticated user.
    try {
      const token = this.getToken();
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = payloadRaw.padEnd(
            payloadRaw.length + ((4 - (payloadRaw.length % 4)) % 4),
            '='
          );
          const decoded = JSON.parse(atob(padded));

          // Prefer the full scouter path (e.g. "scouter/6985/29September2025")
          const tokenScouterRaw =
            decoded?.scouterId ||
            decoded?.details?.user?.scouterId ||
            decoded?.details?.scouterId ||
            null;

          if (
            typeof tokenScouterRaw === 'string' &&
            tokenScouterRaw.includes('scouter/')
          ) {
            // backend expects the full string format in some environments
            numericId = tokenScouterRaw;
            console.log(
              '🔐 Using token scouterId (full format) for picture payload:',
              numericId
            );
          } else if (tokenScouterRaw) {
            // If token contains only a numeric id, don't override formats that include 'scouter/'
            const tokenNumeric =
              this.extractNumericId(tokenScouterRaw) || String(tokenScouterRaw);
            // Only override if original rawId is empty — otherwise keep original format
            if (!rawId || rawId === '') {
              numericId = String(tokenNumeric);
              console.log(
                '🔐 Using token scouterId (numeric) for picture payload:',
                numericId
              );
            }
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not decode JWT to enforce scouterId:', err);
    }

    let base64 = data?.base64Picture || data?.base64 || '';
    if (typeof base64 === 'string') {
      // Remove data URL prefix if present
      base64 = base64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
    }

    return {
      scouterId: String(numericId),
      base64Picture: base64,
    };
  }

  // In scouter-endpoints.service.ts

  // In scouter-endpoints.service.ts - UPDATE getScouterPicture method
  public getScouterPicture(scouterId: any): Observable<any> {
    // Ensure we have a valid numeric ID
    const numericId = this.extractNumericId(scouterId);
    const candidates: string[] = [];

    // Prefer the full scouter path first (e.g. "scouter/5042/...") because
    // some environments expect the complete identifier. Then try numeric id.
    if (typeof scouterId === 'string' && scouterId.trim() !== '') {
      candidates.push(
        `${environment?.baseUrl}/${
          endpoints.getPictureByScouterId
        }/${encodeURIComponent(scouterId)}`
      );
    }

    if (numericId) {
      candidates.push(
        `${environment?.baseUrl}/${endpoints.getPictureByScouterId}/${numericId}`
      );
    }

    if (candidates.length === 0) {
      console.error('❌ Invalid scouter ID for profile picture:', scouterId);
      return of(null);
    }

    console.log(
      '📷 Attempting to fetch profile picture using candidates:',
      candidates
    );

    const tryFetch = (urls: string[]): Observable<any> => {
      if (urls.length === 0) return of(null);
      const url = urls[0];
      return this.http
        .get<any>(url, { headers: this.jwtInterceptor.customHttpHeaders })
        .pipe(
          catchError((error) => {
            console.warn(
              '⚠️ Picture fetch failed for:',
              url,
              'status:',
              error?.status
            );
            // If 401/404 treat as no picture and try next candidate
            if (urls.length > 1) return tryFetch(urls.slice(1));
            // Final fallback: return null so UI can continue
            return of(null);
          })
        );
    };

    return tryFetch(candidates);
  }

  public removeProfilePicture(scouterId: any): Observable<any> {
    // Try multiple id formats: numeric-only, raw, and token-derived full path
    const attempts: string[] = [];
    const numericId = this.extractNumericId(scouterId);
    if (numericId) attempts.push(String(numericId));

    if (typeof scouterId === 'string' && scouterId.trim() !== '') {
      attempts.push(scouterId);
    }

    // If token contains a full scouter path, try that too
    try {
      const token = this.getToken();
      if (token) {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const payloadRaw = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = payloadRaw.padEnd(
            payloadRaw.length + ((4 - (payloadRaw.length % 4)) % 4),
            '='
          );
          const decoded = JSON.parse(atob(padded));
          const tokenScouter =
            decoded?.scouterId || decoded?.details?.user?.scouterId || null;
          if (tokenScouter && typeof tokenScouter === 'string') {
            attempts.push(tokenScouter);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not decode token for delete attempts:', err);
    }

    // Deduplicate attempts, keep order
    const uniqueAttempts = Array.from(new Set(attempts.filter(Boolean)));

    if (uniqueAttempts.length === 0) {
      return throwError(() => new Error('Invalid scouter ID'));
    }

    const tryDelete = (ids: string[]): Observable<any> => {
      if (ids.length === 0) {
        return throwError(() => new Error('All delete attempts failed'));
      }

      const id = ids[0];
      const url = `${environment?.baseUrl}/${
        endpoints.deleteProfilePicture
      }/${encodeURIComponent(id)}`;
      console.log(
        '📷 Attempting delete profile picture using id:',
        id,
        'url:',
        url
      );

      return this.http
        .delete<any>(url, { headers: this.jwtInterceptor.customHttpHeaders })
        .pipe(
          tap((res) => console.log('✅ Delete succeeded with id:', id, res)),
          catchError((err) => {
            console.warn(
              '⚠️ Delete failed for id:',
              id,
              err?.status || err?.message
            );
            // Try next id format
            return tryDelete(ids.slice(1));
          })
        );
    };

    return tryDelete(uniqueAttempts);
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
    const url = `${this.baseUrl}/${endpoints.clearMyNotifications}`;
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

    // ✅ FIX: Ensure limit is between 0-10 as per API requirement
    const limit = params?.limit ? Math.min(Math.max(0, params.limit), 10) : 10;
    httpParams = httpParams.set('limit', limit.toString());

    if (params?.pageNo) {
      httpParams = httpParams.set('pageNo', params.pageNo.toString());
    }

    console.log('📊 Fetching market engagements:', {
      url,
      limit,
      pageNo: params?.pageNo,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: httpParams,
      })
      .pipe(
        timeout(15000),
        map((response) => this.transformMarketResponse(response)),
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

  private transformMarketResponse(response: any): any {
    if (!response) return { data: [], total: 0 };

    // Transform the API response to match your frontend structure
    const transformedData =
      response.data?.map((item: any) => ({
        // Basic fields
        id: item.talentId || item.id || Math.random().toString(),
        profilePic: item.profilePicture || 'assets/images/default-avatar.png',
        name: item.talentName || 'Unknown Talent',
        email: item.talentEmail || 'No email',
        date: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : 'N/A',
        startDate: item.startDate
          ? new Date(item.startDate).toLocaleDateString()
          : 'N/A',
        amount: item.amount || item.price || 0,
        offerStatus: this.mapStatus(item.status),
        status: this.mapActiveStatus(item.status),

        // ✅ CRITICAL: Get the actual backend IDs for reconsider endpoint
        marketHireId: item.marketHireId || item.marketId || item.id,

        // ✅ Construct talentId with date format: "talent/ID/Date"
        talentIdWithDate:
          item.talentIdWithDate ||
          this.constructTalentIdWithDate(item.talentId, item.createdAt),

        // Additional fields for the detail view
        jobDescription: item.jobDescription || 'No description provided',
        yourComment: item.scouterComment || '',
        yourRating: item.scouterRating || 0,
        talentComment: item.talentComment || '',
        talentRating: item.talentRating || 0,

        // ✅ Store original backend data for debugging
        _originalData: item,
      })) || [];

    return {
      data: transformedData,
      total: response.total || response.count || transformedData.length,
      currentPage: response.currentPage || 1,
      totalPages: response.totalPages || 1,
    };
  }

  // Helper to construct talentId with date format
  private constructTalentIdWithDate(
    talentId: string,
    createdAt: string
  ): string {
    if (!talentId) return '';

    const date = createdAt ? new Date(createdAt) : new Date();
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    return `talent/${talentId}/${day}${month}${year}`;
    // Or return `talent/${talentId}/${day}-${month}-${year}` based on your backend
  }

  private mapStatus(
    apiStatus: string
  ): 'Offer Accepted' | 'Awaiting Acceptance' | 'Offer Rejected' {
    const statusMap: { [key: string]: any } = {
      'offer-accepted': 'Offer Accepted',
      'awaiting-acceptance': 'Awaiting Acceptance',
      'offer-declined': 'Offer Rejected',
    };
    return statusMap[apiStatus] || 'Awaiting Acceptance';
  }

  private mapActiveStatus(apiStatus: string): 'Active' | 'Pending' | 'Away' {
    const statusMap: { [key: string]: any } = {
      'offer-accepted': 'Active',
      'awaiting-acceptance': 'Pending',
      'offer-declined': 'Away',
    };
    return statusMap[apiStatus] || 'Pending';
  }

  // ============ DASHBOARD STATISTICS ============

  /**
   * Fetch Scouter's Dashboard Statistics
   * GET /dashboard/v1/dashboard-statistics/get-scouter-stats/{scouterId}
   * Used by: Super admins and Scouters only
   */
  // Enhanced version with market ID handling for super admins
  public getScouterStats(
    scouterId: string,
    includeMarketIds: boolean = false
  ): Observable<any> {
    if (!scouterId || scouterId.trim() === '') {
      return throwError(() => new Error('Invalid scouterId provided'));
    }

    const encodedScouterId = encodeURIComponent(scouterId);
    let url = `${this.baseUrl}/${endpoints.scouterDashboardStats}/${encodedScouterId}`;

    // Add query parameter for market IDs if requested (for super admins)
    let params = new HttpParams();
    if (includeMarketIds) {
      params = params.set('includeMarketIds', 'true');
    }

    console.log('📊 Fetching scouter dashboard stats:', url);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: includeMarketIds ? params : undefined,
      })
      .pipe(
        timeout(15000),
        tap((response) =>
          console.log('✅ Scouter stats fetched successfully:', response)
        ),
        catchError((error) => {
          console.error('❌ Failed to fetch scouter stats:', error);

          // Provide more specific error messages
          let errorMessage = 'Failed to load dashboard statistics';
          if (error.status === 404) {
            errorMessage = 'Dashboard statistics not found';
          } else if (error.status === 403) {
            errorMessage = 'Access denied to dashboard statistics';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }

          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Fetch Scouter's Market Stats with a particular Talent
   * GET /dashboard/v1/dashboard-statistics/get-scouter-talent-stats/{scouterId}/{talentId}
   * Used by: Super admins, Scouters, and Talents
   */
  public getScouterTalentStats(
    scouterId: string,
    talentId: string
  ): Observable<any> {
    if (
      !scouterId ||
      scouterId.trim() === '' ||
      !talentId ||
      talentId.trim() === ''
    ) {
      return throwError(
        () => new Error('Invalid scouterId or talentId provided')
      );
    }

    const encodedScouterId = encodeURIComponent(scouterId);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${this.baseUrl}/${endpoints.scouterTalentStats}/${encodedScouterId}/${encodedTalentId}`;

    console.log('📊 Fetching scouter-talent market stats:', url);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(15000),
        tap((response) =>
          console.log('✅ Scouter-talent stats fetched successfully:', response)
        ),
        catchError((error) => {
          console.error('❌ Failed to fetch scouter-talent stats:', error);
          return throwError(
            () =>
              new Error(
                error.error?.message ||
                  'Failed to load scouter-talent statistics'
              )
          );
        })
      );
  }

  /**
   * Fetch all dashboard statistics for scouter (convenience method)
   * Combines multiple stats endpoints if needed
   */
  public getScouterDashboardData(scouterId: string): Observable<any> {
    return this.getScouterStats(scouterId).pipe(
      catchError((error) => {
        console.error(
          '❌ Failed to fetch comprehensive dashboard data:',
          error
        );
        // Return fallback data structure
        return of({
          totalMarketEngagement: 0,
          totalOfferAccepted: 0,
          totalOfferRejected: 0,
          totalOfferAwaitingAcceptance: 0,
          marketPercentages: {
            accepted: 0,
            rejected: 0,
            awaiting: 0,
          },
        });
      })
    );
  }

  // Add to ScouterEndpointsService

  /**
   * Update scouter's comment and rating for a market engagement
   * PATCH /market/v1/market-comment/scouter/{marketHireId}
   */
  updateMarketComment(
    marketHireId: string,
    payload: {
      scouterId: string;
      remark: string;
      rating: number;
    },
    retryCount: number = 3
  ): Observable<any> {
    const encodedMarketHireId = encodeURIComponent(marketHireId);
    const url = `${this.baseUrl}/market/v1/market-comment/scouter/${encodedMarketHireId}`;

    console.log('📝 Updating market comment:', { marketHireId, payload });

    return this.http
      .patch<any>(url, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(15000),
        tap((response) =>
          console.log('✅ Market comment updated successfully:', response)
        ),
        catchError((error) => {
          console.error('❌ Failed to update market comment:', error);

          // Retry logic for network errors
          if (
            retryCount > 0 &&
            (error.status === 0 || error.status === 502 || error.status === 503)
          ) {
            console.log(
              `🔄 Retrying market comment update... ${retryCount} attempts left`
            );
            return this.updateMarketComment(
              marketHireId,
              payload,
              retryCount - 1
            );
          }

          return throwError(
            () =>
              new Error(
                error.error?.message || 'Failed to update market comment'
              )
          );
        })
      );
  }

  // Add to scouter-endpoints.service.ts
  /**
   * Toggle market offer status (for reconsidering offers)
   * PATCH /market/v1/toggle-market-status/{talentId}/{scouterId}/{marketHireId}
   */
  toggleMarketStatus(
    payload: {
      hireStatus: string;
      amountToPay: string;
      dateOfHire: string;
      jobDescription: string;
      startDate: string;
      satisFactoryCommentByScouter: string;
    },
    params: {
      talentId: string;
      scouterId: string;
      marketHireId: string;
    }
  ): Observable<any> {
    const encodedTalentId = encodeURIComponent(params.talentId);
    const encodedScouterId = encodeURIComponent(params.scouterId);
    const encodedMarketHireId = encodeURIComponent(params.marketHireId);

    const url = `${this.baseUrl}/market/v1/toggle-market-status/${encodedTalentId}/${encodedScouterId}/${encodedMarketHireId}`;

    console.log('🔄 Toggling market offer status:', {
      url,
      payload,
      params,
    });

    return this.http
      .patch<any>(url, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(15000),
        tap((response) =>
          console.log('✅ Market offer toggled successfully:', response)
        ),
        catchError((error) => {
          console.error('❌ Failed to toggle market offer:', error);
          return throwError(
            () =>
              new Error(error.error?.message || 'Failed to update offer status')
          );
        })
      );
  }
}

