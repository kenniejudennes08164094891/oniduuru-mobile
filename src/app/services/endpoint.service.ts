import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';
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

  // ✅ Talent Profile APIs
  public fetchTalentProfile(talentId: string): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.fetchTalentProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public createTalentProfile(talent: any): Observable<any> {
    const body = JSON.stringify(talent);
    const url = `${environment.baseUrl}/${endpoints.onboardTalent}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public updateTalentProfile(talentId: string, talent: any): Observable<any> {
    const body = JSON.stringify(talent);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Skill Dropdown
  public fetchSkillDropdown(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchDropdownItems}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Talent Market Profile APIs
  public createTalentMarketProfileData(
    payload: any,
    talentId: string
  ): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.createTalentMarketProfile}?${encodedTalentId}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchTalentMarketProfile(talentId: string): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getTalentMarketProfile}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public updateTalentMarketProfileData(
    payload: any,
    talentId: string
  ): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentMarketProfile}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchMarketsByTalent(
    talentId: string,
    paginationParams: PaginationParams = { limit: 10, pageNo: 1 },
    statusParams: string = '',
    scouterId: string = ''
  ): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getMarketsByTalentId}/${encodedTalentId}`;

    const params = new HttpParams()
      .set('statusParams', statusParams?.trim() ?? '')
      .set('scouterId', scouterId?.trim() ?? '')
      .set('limit', String(paginationParams.limit ?? 10))
      .set('pageNo', String(paginationParams.pageNo ?? 1));

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params,
    });
  }

  // ✅ Profile Picture APIs
  public uploadTalentPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    const url = `${environment.baseUrl}/${endpoints.uploadTalentProfilePic}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public replaceTalentPicture(data: any): Observable<any> {
    const body = JSON.stringify(data);
    const url = `${environment.baseUrl}/${endpoints.updateTalentProfilePic}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public getTalentPicture(talentId: any): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getPictureByTalentId}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public getScouterPicture(scouterId: any): Observable<any> {
    const encodedScouterId = encodeURIComponent(scouterId);
    const url = `${environment.baseUrl}/${endpoints.getPictureByScouterId}/${encodedScouterId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Security Question APIs
  public createTalentSecurityQuestion(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.createTalentSecurityQuestions}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public updateTalentSecurityQuestions(
    payload: any,
    talentId: string
  ): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentSecurityQuestions}?talentId=${encodedTalentId}`;
    return this.http.put<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public getMySecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    const url = `${environment.baseUrl}/${
      endpoints.getMySecurityQuestionsWithAnswers
    }?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Cloudinary Helpers
  public fetchUrlFromCloudinary(
    apiUrl: string,
    formData: FormData
  ): Observable<any> {
    return this.http.post<any>(apiUrl, formData);
  }

  public fetchCloudinarySecrets(): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.cloudinaryGetSecrets}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // ✅ Talent Reel APIs
  public uploadTalentReel(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.uploadTalentReel}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchTalentReel(talentId: string): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getTalentReel}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public replaceTalentReel(payload: any, talentId: string): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.replaceTalentReel}/${encodedTalentId}`;
    return this.http.patch<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  // --------------------------
  // Wallets APIs
  // --------------------------
  public createWalletProfile(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.createWalletProfile}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchMyWallet(
    wallet_id?: string | null,
    uniqueId?: string | null
  ): Observable<any> {
    let params = new HttpParams();

    // Add parameters if provided and not null
    if (wallet_id) {
      params = params.set('wallet_id', wallet_id);
    }
    if (uniqueId) {
      params = params.set('uniqueId', uniqueId);
    }

    const url = `${environment.baseUrl}/${endpoints.fetchMyWallet}`;
    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params,
      })
      .pipe(
        catchError((error) => {
          // Handle specific wallet not found error gracefully
          if (
            error.status === 400 &&
            error.error?.message === 'Wallet not found'
          ) {
            // Return a specific structure for wallet not found
            return of({
              walletNotFound: true,
              message: 'Wallet profile not created yet',
            });
          }
          // Re-throw other errors
          return throwError(() => error);
        })
      );
  }

  public fundsDeposit(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.fundsDeposit}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchMyDeposits(pagination: any = {}): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyDeposits}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public fetchSingleDeposit(depositId: string): Observable<any> {
    const encodedId = encodeURIComponent(depositId);
    const url = `${environment.baseUrl}/${endpoints.fetchSingleDeposit}/${encodedId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  public calculateCharge(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.calculateCharge}`;
    return this.http.post<any>(url, body, {
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

  // --------------------------
  // Verification & THIRD PARTY APIs (BVN, NIN, banks, countries, business verify)
  // --------------------------

  // ✅ BVN Validation - Fixed to handle your API's response structure
  public validateBVN(bvn: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.validateMyBVN}`;
    const params = new HttpParams().set('bvn', String(bvn || ''));

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
        params,
      })
      .pipe(
        map((response: any) => {
          console.log('BVN API Response:', response);

          // If we get any response at all, consider it success for now
          // Adjust this based on your actual API success criteria
          return {
            success: true,
            data: response,
            message: 'BVN verification completed',
          };
        }),
        catchError((error) => {
          console.error('BVN Error:', error);

          // Direct handling of 400 responses
          if (error.status === 400) {
            return throwError(() => ({
              status: 400,
              message: 'The BVN number appears to be invalid',
              userMessage: 'Please check your BVN number and try again',
              details: error.error,
            }));
          }

          return throwError(() => error);
        })
      );
  }

  // ✅ NIN Validation - Separate function with proper error handling
  public validateNIN(nin: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.validateMyNIN}`;
    const params = new HttpParams().set('nin', String(nin || ''));

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
        params,
      })
      .pipe(
        map((response: any) => {
          console.log('NIN API Response:', response);

          // Handle successful response structure
          if (response && response.status === true) {
            return {
              success: true,
              data: response.data,
              message: response.message || 'NIN verified successfully',
            };
          }

          // If we get here but no error was thrown, it's still a failure
          throw new Error('NIN verification failed - invalid number');
        }),
        catchError((error) => {
          console.error('NIN Validation Error:', error);

          // Handle 400 responses with specific messages
          if (error.status === 400) {
            const errorMessage = error.error?.message || 'Invalid NIN';
            return throwError(() => ({
              status: 400,
              message: errorMessage,
              userMessage: 'Invalid NIN number. Please check and try again.',
            }));
          }

          // Handle other errors
          return throwError(() => ({
            status: error.status || 500,
            message: error.message || 'NIN verification service unavailable',
            userMessage:
              'NIN verification service unavailable. Please try again later.',
          }));
        })
      );
  }

  // ✅ Get Nigerian Banks - Fixed response handling
  public getNigerianBanks(): Observable<any[]> {
    const url = `${environment.baseUrl}/${endpoints.getNubanBanks}`;

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        map((response: any) => {
          // Handle different response structures
          if (Array.isArray(response)) {
            return response; // Direct array response
          } else if (response && Array.isArray(response.data)) {
            return response.data; // Wrapped response {data: [...]}
          } else {
            console.warn('Unexpected banks response structure:', response);
            return this.getFallbackBanks();
          }
        }),
        catchError((error) => {
          console.error('Banks Fetch Error:', error);
          return of(this.getFallbackBanks());
        })
      );
  }

  // ✅ Get All Countries - Enhanced to handle the actual API response structure
  public getAllCountries(): Observable<any[]> {
    const url = `${environment.baseUrl}/${endpoints.getAllCountryFlags}`;

    console.log('🌍 Fetching countries from:', url);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        map((response: any) => {
          console.log('🌍 Raw countries API response:', response);

          // Handle the actual API response structure: {message: "...", data: [...]}
          if (response && Array.isArray(response.data)) {
            console.log(
              '🌍 Countries data array found, count:',
              response.data.length
            );
            return response.data;
          } else if (Array.isArray(response)) {
            console.log('🌍 Direct array response, count:', response.length);
            return response;
          } else {
            console.warn(
              '🌍 Unexpected countries response structure:',
              response
            );
            return this.getFallbackCountries();
          }
        }),
        catchError((error) => {
          console.error('🌍 Countries Fetch Error:', {
            status: error.status,
            message: error.message,
            url: url,
            error: error.error,
          });
          return of(this.getFallbackCountries());
        })
      );
  }
  // ✅ Account Verification - Fixed to handle actual API response structure
  public verifyAccountNumber(payload: {
    bankCode: string;
    bankName: string;
    bankAccountNo: string;
  }): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.verifyAcctNum}`;

    return this.http
      .post<any>(url, body, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        map((response: any) => {
          console.log('Account Verification Response:', response);

          // Handle the actual API response structure
          if (
            response &&
            (response.message?.toLowerCase().includes('success') ||
              response.statusCode === 200 ||
              response.statusCode === 201 ||
              response.accountName)
          ) {
            return {
              success: true,
              data: response.data || response,
              message: response.message || 'Account verified successfully',
              accountName: response.accountName || response.data?.accountName,
            };
          }

          // If we get here but no error was thrown, it's still a failure
          throw new Error('Account verification failed - invalid response');
        }),
        catchError((error) => {
          console.error('Account Verification Error:', error);

          // Handle 400 responses with specific messages
          if (error.status === 400) {
            const errorMessage =
              error.error?.message || 'Invalid account details';
            return throwError(() => ({
              status: 400,
              message: errorMessage,
              userMessage:
                'Account verification failed. Please check account number and bank details.',
            }));
          }

          // Handle other errors
          return throwError(() => ({
            status: error.status || 500,
            message:
              error.message || 'Account verification service unavailable',
            userMessage:
              'Account verification service temporarily unavailable. Please try again later.',
          }));
        })
      );
  }

  // ✅ Business Verification - Complete implementation
  public verifyBusiness(payload: {
    SearchType: string;
    searchTerm: string;
  }): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.verifyBusiness}`;

    return this.http
      .post<any>(url, body, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        map((response: any) => {
          console.log('Business Verification Response:', response);

          // Check for successful business verification based on actual API response
          if (
            response &&
            (response.message?.toLowerCase().includes('successful') ||
              response.message?.toLowerCase().includes('verified') ||
              response.statusCode === 200 ||
              response.statusCode === 201)
          ) {
            return {
              success: true,
              data: response,
              message: response.message || 'Business verified successfully',
            };
          }

          throw new Error('Business verification failed - invalid response');
        }),
        catchError((error) => {
          console.error('Business Verification Error:', error);

          if (error.status === 400) {
            const errorMessage =
              error.error?.message || 'Invalid business details';
            return throwError(() => ({
              status: 400,
              message: errorMessage,
              userMessage:
                'Invalid RC number or company name. Please check and try again.',
            }));
          }

          return throwError(() => ({
            status: error.status || 500,
            message:
              error.message || 'Business verification service unavailable',
            userMessage:
              'Business verification service unavailable. Please try again later.',
          }));
        })
      );
  }

  // ==================== FALLBACK DATA ====================
  private getFallbackBanks(): any[] {
    return [
      { bankName: 'Access Bank Nigeria Plc', cbnCode: '044', bankCode: 'ABP' },
      {
        bankName: 'Zenith Bank International',
        cbnCode: '057',
        bankCode: 'ZIB',
      },
      {
        bankName: 'First Bank of Nigeria Plc',
        cbnCode: '011',
        bankCode: 'FBN',
      },
      { bankName: 'Guaranty Trust Bank Plc', cbnCode: '058', bankCode: 'GTB' },
      {
        bankName: 'United Bank for Africa Plc',
        cbnCode: '033',
        bankCode: 'UBA',
      },
      { bankName: 'Union Bank Nigeria Plc', cbnCode: '032', bankCode: 'UBN' },
      { bankName: 'WEMA Bank Plc', cbnCode: '035', bankCode: 'WEMA' },
      {
        bankName: 'First City Monument Bank',
        cbnCode: '214',
        bankCode: 'FCMB',
      },
      { bankName: 'Stanbic IBTC Bank Plc', cbnCode: '221', bankCode: 'IBTC' },
      { bankName: 'Sterling Bank Plc', cbnCode: '232', bankCode: 'SBP' },
    ];
  }

  private getFallbackCountries(): any[] {
    return [
      {
        name: 'Nigeria',
        countryName: 'Nigeria',
        code: 'NG',
        flag: '🇳🇬',
        currency: 'NGN',
      },
      {
        name: 'Ghana',
        countryName: 'Ghana',
        code: 'GH',
        flag: '🇬🇭',
        currency: 'GHS',
      },
      {
        name: 'Kenya',
        countryName: 'Kenya',
        code: 'KE',
        flag: '🇰🇪',
        currency: 'KES',
      },
      {
        name: 'South Africa',
        countryName: 'South Africa',
        code: 'ZA',
        flag: '🇿🇦',
        currency: 'ZAR',
      },
      {
        name: 'United Kingdom',
        countryName: 'United Kingdom',
        code: 'GB',
        flag: '🇬🇧',
        currency: 'GBP',
      },
      {
        name: 'United States',
        countryName: 'United States',
        code: 'US',
        flag: '🇺🇸',
        currency: 'USD',
      },
    ];
  }
}
