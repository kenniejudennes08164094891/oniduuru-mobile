import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap, throwError } from 'rxjs';
import { JwtInterceptorService } from './jwt-interceptor.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { PaginationParams, resendOTP, verifyOTP } from 'src/app/models/mocks';

@Injectable({
  providedIn: 'root',
})
export class EndpointService {
  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
    private authService: AuthService,
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
    talentId: string,
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
    talentId: string,
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
    scouterId: string = '',
    searchText: string = '',
  ): Observable<any> {
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.getMarketsByTalentId}/${encodedTalentId}`;

    let params = new HttpParams()
      .set('limit', String(paginationParams.limit ?? 10))
      .set('pageNo', String(paginationParams.pageNo ?? 1));

    // Add optional parameters only if they have values
    if (statusParams?.trim()) {
      params = params.set('statusParams', statusParams.trim());
    }

    if (scouterId?.trim()) {
      params = params.set('scouterId', scouterId.trim());
    }

    if (searchText?.trim()) {
      params = params.set('searchText', searchText.trim());
    }

    console.log('🔍 Fetching market records:', {
      url,
      params: params.toString(),
      talentId,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params,
      })
      .pipe(
        tap((response) => {
          console.log('📊 Market records response:', response);
        }),
        catchError((error) => {
          console.error('❌ Error fetching market records:', error);
          return throwError(() => error);
        }),
      );
  }

  // Add these methods to your EndpointService class in endpoint.service.ts

  /**
   * Toggle market status (accept/decline offer)
   * PATCH /market/v1/toggle-market-status/{talentId}/{scouterId}/{marketHireId}
   */
  // Update the toggleMarketStatus method in endpoint.service.ts
  public toggleMarketStatus(
    talentId: string,
    scouterId: string,
    marketHireId: string,
    status: 'offer-accepted' | 'offer-declined',
    hireData?: any,
  ): Observable<any> {
    // Encode the parameters
    const encodedTalentId = encodeURIComponent(talentId);
    const encodedScouterId = encodeURIComponent(scouterId);
    const encodedMarketHireId = encodeURIComponent(marketHireId);

    const url = `${environment.baseUrl}/${endpoints.toggleMarketStatus}/${encodedTalentId}/${encodedScouterId}/${encodedMarketHireId}`;

    // Convert amount to string - FIX: Ensure amountToPay is a string
    let amountToPay = '';
    if (hireData?.amount || hireData?.amountToPay) {
      const amount = hireData.amount || hireData.amountToPay;
      // Convert to string
      amountToPay = String(amount);
    }

    // Format the date properly
    let dateOfHire = '';
    if (hireData?.date || hireData?.dateOfHire) {
      const date = hireData.date || hireData.dateOfHire;
      // Convert to proper date format if needed
      if (typeof date === 'string') {
        dateOfHire = date;
      } else {
        // If it's a Date object or timestamp, format it
        dateOfHire = new Date(date).toISOString();
      }
    }

    // Create the request body with real data if available
    const body = {
      hireStatus: status,
      amountToPay: amountToPay, // Now a string
      dateOfHire: dateOfHire,
      jobDescription: hireData?.jobDescription || '',
      startDate: hireData?.startDate || '',
      satisFactoryCommentByScouter:
        hireData?.satisFactoryCommentByScouter || '',
    };

    console.log('🔍 Toggle market status request:', {
      url,
      talentId,
      scouterId,
      marketHireId,
      status,
      body,
    });

    return this.http
      .patch<any>(url, body, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Market status toggle response:', response);
        }),
        catchError((error) => {
          console.error('❌ Error toggling market status:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Submit talent's comment/rating on market dealings
   * PATCH /market/v1/market-comment/talent/{marketHireId}
   */
  public submitTalentMarketComment(
    marketHireId: string,
    payload: {
      talentId: string;
      remark: string;
      rating: number;
      paymentMethod: 'WALLET' | 'BANK_TRANSFER';
    },
  ): Observable<any> {
    const encodedMarketHireId = encodeURIComponent(marketHireId);
    const url = `${environment.baseUrl}/${endpoints.talentComment}/${encodedMarketHireId}`;

    console.log('🔍 Submitting talent market comment:', {
      url,
      marketHireId,
      payload,
    });

    return this.http
      .patch<any>(url, payload, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Talent market comment response:', response);
        }),
        catchError((error) => {
          console.error('❌ Error submitting talent comment:', error);
          return throwError(() => error);
        }),
      );
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
    talentId: string,
  ): Observable<any> {
    const body = JSON.stringify(payload);
    const encodedTalentId = encodeURIComponent(talentId);
    const url = `${environment.baseUrl}/${endpoints.updateTalentSecurityQuestions}?talentId=${encodedTalentId}`;
    return this.http.put<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public getMySecurityQuestions(uniqueId: string): Observable<any> {
    let url = `${environment?.baseUrl}/${
      endpoints?.getMySecurityQuestions
    }?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }
  public validateTalentSecurityQuestion(payload: {
    talentId: string;
    answerSecurityQuestion: {
      question: string;
      answer: string;
    };
  }): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.validateTalentSecurityQuestion}`;
    return this.http.post<any>(url, payload, {
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
    formData: FormData,
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
    uniqueId?: string | null,
  ): Observable<any> {
    let params = new HttpParams();
    if (wallet_id && wallet_id.trim() !== '') {
      params = params.set('wallet_id', wallet_id.trim());
    }
    if (uniqueId && uniqueId.trim() !== '') {
      params = params.set('uniqueId', uniqueId.trim());
    }

    const url = `${environment.baseUrl}/${endpoints.fetchMyWallet}`;

    // 🔍 CRITICAL DEBUG LOGGING
    console.log('🔍 [DEBUG] Wallet Fetch Request:', {
      url: url,
      params: params.toString(),
      uniqueId_value_sent: uniqueId,
      wallet_id_value_sent: wallet_id,
      full_request_url: `${url}?${params.toString()}`,
      auth_headers_present:
        this.jwtInterceptor.customHttpHeaders.has('Authorization'), // Check if auth header exists
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders, // Ensure this contains the Authorization token
        params: params,
      })
      .pipe(
        catchError((error) => {
          console.error('❌ Wallet fetch error:', {
            status: error.status,
            message: error.message,
            error: error.error,
            url: url,
            params: params.toString(),
          });

          // Handle specific wallet not found error gracefully
          if (
            error.status === 400 &&
            (error.error?.message === 'Wallet not found' ||
              error.error?.message?.includes('Wallet') ||
              error.error?.message?.includes('wallet'))
          ) {
            // Return a specific structure for wallet not found
            return of({
              walletNotFound: true,
              message: 'Wallet profile not created yet',
              statusCode: 400,
            });
          }

          // Handle 404 - endpoint not found
          if (error.status === 404) {
            return of({
              walletNotFound: true,
              message: 'Wallet service unavailable',
              statusCode: 404,
            });
          }

          // Re-throw other errors
          return throwError(() => error);
        }),
      );
  }

  // Add this method to your EndpointService class

  // ✅ Fetch wallet stats
  public fetchWalletStats(uniqueId: string): Observable<any> {
    const url = `${environment.baseUrl}/wallets/v1/my-wallet-stats`;

    const params = new HttpParams().set('uniqueId', uniqueId);

    console.log('🔍 [DEBUG] Making wallet stats API call:', {
      url: url,
      params: params.toString(),
      fullUrl: `${url}?${params.toString()}`,
      uniqueId: uniqueId,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: params,
      })
      .pipe(
        tap((response) => {
          console.log('📡 Wallet Stats API Raw Response:', response);
        }),
        catchError((error) => {
          console.error('❌ Wallet stats fetch error:', {
            status: error.status,
            message: error.message,
            error: error.error,
            url: url,
            params: params.toString(),
          });
          return throwError(() => error);
        }),
      );
  }

  public fetchMonthlyStats(uniqueId: string, year: string): Observable<any> {
    // DON'T encode the uniqueId - your API expects the format "scouter/6985/29September2025"
    // Encoding changes slashes to %2F which might not be what the API expects
    const url = `${environment.baseUrl}/wallets/v1/my-monthly-stats`;

    const params = new HttpParams()
      .set('uniqueId', uniqueId) // Don't encode here
      .set('year', year);

    console.log('🔍 [DEBUG] Making histogram API call:', {
      url: url,
      params: params.toString(),
      fullUrl: `${url}?${params.toString()}`,
      uniqueId: uniqueId,
      year: year,
      isUniqueIdEncoded: uniqueId.includes('%2F'), // Check if it's already encoded
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: params,
      })
      .pipe(
        tap((response) => {
          console.log('📡 Histogram API Raw Response:', response);
        }),
        catchError((error) => {
          console.error('❌ Histogram data fetch error:', {
            status: error.status,
            message: error.message,
            error: error.error,
            url: url,
            params: params.toString(),
          });
          return throwError(() => error);
        }),
      );
  }

  public fundsDeposit(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.fundsDeposit}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  //  Fetch deposits with filtering
  public fetchMyDeposits(
    uniqueId: string,
    statusParams?: string,
    limit: number = 10,
    pageNo: number = 1,
  ): Observable<any> {
    const url = `${environment.baseUrl}/wallets/v1/fetch-my-deposits`;

    let params = new HttpParams()
      .set('uniqueId', uniqueId)
      .set('limit', limit.toString())
      .set('pageNo', pageNo.toString());

    if (statusParams && statusParams.trim()) {
      params = params.set('statusParams', statusParams);
    }

    console.log('🔍 [DEBUG] Fetch deposits request:', {
      url: url,
      params: params.toString(),
      fullUrl: `${url}?${params.toString()}`,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: params,
      })
      .pipe(
        tap((response) => {
          console.log('📡 Deposits API Response:', response);
        }),
        catchError((error) => {
          console.error('❌ Deposits fetch error:', error);
          return throwError(() => error);
        }),
      );
  }

  //  Fetch single deposit
  public fetchSingleDeposit(
    depositReferenceNumber: string,
    uniqueId: string,
  ): Observable<any> {
    const url = `${environment.baseUrl}/wallets/v1/fetch-single-deposit`;

    const params = new HttpParams()
      .set('depositReferenceNumber', depositReferenceNumber)
      .set('uniqueId', uniqueId);

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  //  Create Paystack customer code
  public createPaystackCustomerCode(payload: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  }): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/api-service/v1/paystack/customer-code`;

    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }

  //  Calculate transaction charge
  public calculateTransactionCharge(amount: string): Observable<any> {
    const url = `${environment.baseUrl}/wallets/v1/calculate-transaction-charge`;

    const params = new HttpParams().set('amount', amount);

    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
      params: params,
    });
  }

  // Add these methods to your EndpointService class

  /**
   * Withdraw funds from wallet
   * POST /wallets/v1/withdraw-funds
   */
  public withdrawFunds(payload: {
    amount: number;
    designatedNubanBank: string;
    designatedNubanAcctNo: string;
    wallet_id: string;
    isTermsAgreed: string; // Must be "true" as string
    bankAccountName: string;
  }): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.withdrawFunds}`;

    console.log('💰 Withdraw funds request:', {
      url,
      payload: { ...payload, isTermsAgreed: payload.isTermsAgreed },
    });

    return this.http
      .post<any>(url, body, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Withdraw funds response:', response);
        }),
        catchError((error) => {
          console.error('❌ Withdraw funds error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetch my withdrawals with filtering
   * GET /wallets/v1/fetch-my-withdrawals
   */
  public fetchMyWithdrawals(
    uniqueId: string,
    statusParams?: string,
    limit: number = 10,
    pageNo: number = 1,
  ): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyWithdrawals}`;

    let params = new HttpParams()
      .set('uniqueId', uniqueId)
      .set('limit', limit.toString())
      .set('pageNo', pageNo.toString());

    if (statusParams && statusParams.trim()) {
      params = params.set('statusParams', statusParams.trim());
    }

    console.log('🔍 [DEBUG] Fetch withdrawals request:', {
      url: url,
      params: params.toString(),
      fullUrl: `${url}?${params.toString()}`,
      uniqueId,
      statusParams: statusParams || 'all',
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: params,
      })
      .pipe(
        tap((response) => {
          console.log('📡 Withdrawals API Response:', response);
        }),
        catchError((error) => {
          console.error('❌ Withdrawals fetch error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetch single withdrawal
   * GET /wallets/v1/fetch-single-withdrawal
   */
  public fetchSingleWithdrawal(
    withdrawalReferenceNumber: string,
    uniqueId: string,
  ): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchSingleWithdrawal}`;

    const params = new HttpParams()
      .set('withdrawalReferenceNumber', withdrawalReferenceNumber)
      .set('uniqueId', uniqueId);

    console.log('🔍 Fetch single withdrawal:', {
      url,
      withdrawalReferenceNumber,
      uniqueId,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params: params,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Single withdrawal response:', response);
        }),
        catchError((error) => {
          console.error('❌ Single withdrawal fetch error:', error);
          return throwError(() => error);
        }),
      );
  }

  // --------------------------
  // Transfer Funds APIs
  // --------------------------

  /**
   * Transfer funds from your wallet to other wallets
   * POST /wallets/v1/transfer-funds
   */
  public transferFunds(payload: {
    amount: number;
    designatedWalletAcct: string; // The wallet ID you're sending funds to
    originatingWalletAcct: string; // Your wallet ID you're removing money from
    marketHireId?: string; // Optional: if this is a market hire payment
  }): Observable<any> {
    const body = JSON.stringify(payload);
    const url = `${environment.baseUrl}/${endpoints.transferFunds}`;

    console.log('💰 Transfer funds request:', {
      url,
      payload,
    });

    return this.http
      .post<any>(url, body, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Transfer funds response:', response);
        }),
        catchError((error) => {
          console.error('❌ Transfer funds error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetch my transfers with filtering
   * GET /wallets/v1/fetch-my-transfers
   */
  public fetchMyTransfers(
    uniqueId: string,
    statusParams?: string,
    limit: number = 10,
    pageNo: number = 1,
  ): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchMyTransfers}`;

    let params = new HttpParams()
      .set('uniqueId', uniqueId)
      .set('limit', limit.toString())
      .set('pageNo', pageNo.toString());

    if (statusParams && statusParams.trim()) {
      params = params.set('statusParams', statusParams);
    }

    console.log('🔍 [DEBUG] Fetch transfers request:', {
      url,
      params: params.toString(),
      fullUrl: `${url}?${params.toString()}`,
      uniqueId,
      statusParams,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params,
      })
      .pipe(
        tap((response) => {
          console.log('📡 Transfers API Response:', response);
        }),
        catchError((error) => {
          console.error('❌ Transfers fetch error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Fetch single transfer
   * GET /wallets/v1/fetch-single-transfer
   */
  public fetchSingleTransfer(transferReferenceId: string): Observable<any> {
    const url = `${environment.baseUrl}/wallets/v1/fetch-single-transfer`;

    const params = new HttpParams().set(
      'transferReferenceId',
      transferReferenceId,
    );

    console.log('🔍 Fetch single transfer:', {
      url,
      transferReferenceId,
    });

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
        params,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Single transfer response:', response);
        }),
        catchError((error) => {
          console.error('❌ Single transfer fetch error:', error);
          return throwError(() => error);
        }),
      );
  }

  /**
   * Calculate transaction charge (reuse existing method)
   * GET /wallets/v1/calculate-transaction-charge
   */
  // Already have calculateTransactionCharge(amount: string)

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

  //  BVN OTP Verification - UPDATED
  public verifyBVNWithPhone(bvn: string, phoneNumber: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.validateMyBVN}`;
    const params = new HttpParams()
      .set('bvn', String(bvn || ''))
      .set('phoneNumber', String(phoneNumber || ''));

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
        params,
      })
      .pipe(
        map((response: any) => {
          console.log('BVN OTP Verification Response:', response);

          // Handle different success response structures
          if (response) {
            // Check for session ID in different possible locations
            const sessionId =
              response.data?.sessionId ||
              response.sessionId ||
              response.data?.data?.sessionId ||
              response.session_id;

            return {
              success: true,
              message: response.message || 'OTP sent successfully',
              sessionId: sessionId,
              data: response,
            };
          }

          throw new Error('Failed to send OTP');
        }),
        catchError((error) => {
          console.error('BVN OTP Error:', error);

          // Check for specific error messages
          if (error.status === 400) {
            const errorMsg = error.error?.message || 'Invalid BVN';
            return throwError(() => ({
              status: 400,
              message: errorMsg,
              userMessage: errorMsg.includes('Invalid')
                ? 'Please check your BVN number and try again'
                : 'Unable to verify BVN. Please try again later',
            }));
          }

          return throwError(() => error);
        }),
      );
  }

  // Helper method to extract sessionId from response
  private extractSessionIdFromResponse(response: any): string {
    if (!response) return '';

    // Check if sessionId is nested in data object
    if (response.data && response.data.sessionId) {
      return response.data.sessionId;
    }

    // Check if it's in the root
    if (response.sessionId) {
      return response.sessionId;
    }

    // Try to find any property that might be sessionId
    const sessionKeys = ['sessionId', 'sessionID', 'session_id', 'SessionId'];
    for (const key of sessionKeys) {
      if (response[key]) {
        return response[key];
      }
      if (response.data && response.data[key]) {
        return response.data[key];
      }
    }

    return '';
  }

  //  Verify BVN OTP
  public verifyBVNOTP(sessionId: string, otp: string): Observable<any> {
    const url = `${environment.baseUrl}/${endpoints.fetchBVNDetails}`;
    const payload = { sessionId, otp };

    return this.http
      .post<any>(url, payload, {
        headers: this.jwtInterceptor.customNoAuthHttpHeaders,
      })
      .pipe(
        map((response: any) => {
          console.log('BVN OTP Validation Response:', response);

          // Check for successful OTP verification based on actual API response
          if (
            response &&
            (response.statusCode === 200 ||
              response.statusCode === 201 ||
              response.message?.toLowerCase().includes('success') ||
              response.message?.toLowerCase().includes('fetched'))
          ) {
            return {
              success: true,
              data: response.data || response,
              message: response.message || 'BVN verified successfully',
              bvnDetails: response.data || response,
            };
          }

          throw new Error('Invalid OTP or verification failed');
        }),
        catchError((error) => {
          console.error('BVN OTP Validation Error:', error);

          if (error.status === 400) {
            return throwError(() => ({
              status: 400,
              message: 'Invalid OTP',
              userMessage: 'The OTP entered is incorrect. Please try again.',
            }));
          }

          return throwError(() => error);
        }),
      );
  }

  //  BVN Validation - Fixed to handle your API's response structure
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
          console.log('BVN Validation Response:', response);

          // IMPORTANT: This API now returns OTP request, not direct verification
          // So we should handle it differently
          return {
            success: true,
            data: response,
            message: response.message || 'BVN validation initiated',
            requiresOTP: response.message?.includes('OTP'), // Flag to indicate OTP is needed
          };
        }),
        catchError((error) => {
          console.error('BVN Error:', error);

          if (error.status === 400) {
            return throwError(() => ({
              status: 400,
              message: 'The BVN number appears to be invalid',
              userMessage: 'Please check your BVN number and try again',
              details: error.error,
            }));
          }

          return throwError(() => error);
        }),
      );
  }

  //  NIN Validation - Separate function with proper error handling
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

          // Handle successful response structure from your API
          // Your API returns: {message: 'NIN has been successfully verified!', data: {...}, statusCode: 200}
          if (
            response &&
            (response.statusCode === 200 ||
              response.message?.includes('successfully'))
          ) {
            return {
              success: true,
              data: response.data || response,
              message: response.message || 'NIN verified successfully',
              statusCode: response.statusCode,
            };
          }

          // If we get here but no error was thrown, it's still a failure
          throw new Error('NIN verification failed - invalid response');
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
        }),
      );
  }

  //  Get Nigerian Banks - Fixed response handling
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
        }),
      );
  }

  //  Get All Countries - Enhanced to handle the actual API response structure
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
              response.data.length,
            );
            return response.data;
          } else if (Array.isArray(response)) {
            console.log('🌍 Direct array response, count:', response.length);
            return response;
          } else {
            console.warn(
              '🌍 Unexpected countries response structure:',
              response,
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
        }),
      );
  }
  //  Account Verification - Fixed to handle actual API response structure
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
        }),
      );
  }

  //  Business Verification - Complete implementation
  public verifyBusiness(payload: {
    SearchType: string;
    searchTerm: string;
  }): Observable<any> {
    const body = JSON.stringify(payload);

    // Try different endpoint variations since you're getting 404
    const endpointVariations = [
      `${environment.baseUrl}/${endpoints.verifyBusiness}`,
      `${environment.baseUrl}/api-service/verify-business`, // Try without /v1
      `${environment.baseUrl}/api-service/v1/business-verification`,
    ];

    console.log('🔍 Attempting business verification with payload:', payload);

    // Create a function to try endpoints sequentially
    const tryEndpoint = (index: number): Observable<any> => {
      if (index >= endpointVariations.length) {
        return throwError(
          () => new Error('All business verification endpoints failed'),
        );
      }

      const url = endpointVariations[index];
      console.log(`🔄 Trying endpoint ${index + 1}: ${url}`);

      return this.http
        .post<any>(url, body, {
          headers: this.jwtInterceptor.customNoAuthHttpHeaders,
        })
        .pipe(
          catchError((error) => {
            console.warn(`❌ Endpoint ${index + 1} failed: ${error.status}`);

            // If it's a 404, try the next endpoint
            if (error.status === 404 && index < endpointVariations.length - 1) {
              return tryEndpoint(index + 1);
            }

            // For other errors or last endpoint, throw the error
            return throwError(() => error);
          }),
        );
    };

    return tryEndpoint(0).pipe(
      map((response: any) => {
        console.log('✅ Business Verification Response:', response);

        // Check for successful business verification based on actual API response
        if (
          response &&
          (response.message?.toLowerCase().includes('successful') ||
            response.message?.toLowerCase().includes('verified') ||
            response.statusCode === 200 ||
            response.statusCode === 201 ||
            response.success === true)
        ) {
          return {
            success: true,
            data: response.data || response,
            message: response.message || 'Business verified successfully',
            statusCode: response.statusCode || 200,
          };
        }

        throw new Error('Business verification failed - invalid response');
      }),
      catchError((error) => {
        console.error('Business Verification Error:', error);

        if (error.status === 404) {
          return throwError(() => ({
            status: 404,
            message: 'Business verification endpoint not found',
            userMessage:
              'Business verification service is currently unavailable. Please try again later.',
          }));
        }

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
          message: error.message || 'Business verification service unavailable',
          userMessage:
            'Business verification service unavailable. Please try again later.',
        }));
      }),
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

  public loginUser(user: any): Observable<any> {
    let body = JSON.stringify(user);
    let url = `${environment?.baseUrl}/${endpoints?.userLogin}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }
  public fetchTalentStats(talentId: string): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let url = `${environment?.baseUrl}/${endpoints?.talentDashboardStats}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }
  public fetchScouterMarketStatsWithTalent(
    talentId: string,
    scouterId: string,
  ): Observable<any> {
    let encodedTalentId = encodeURIComponent(talentId);
    let encodedScouterId = encodeURIComponent(scouterId);
    let url = `${environment?.baseUrl}/${endpoints?.scouterMarketWithTalent}/${encodedScouterId}/${encodedTalentId}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }
  public fetchMyNotifications(receiverId?: any): Observable<any> {
    let encodedReceiverId = encodeURIComponent(receiverId);
    let url = `${environment?.baseUrl}/${
      endpoints?.getMyNotifications
    }?receiverId=${receiverId === undefined ? '' : receiverId?.trim()}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }
  public clearMyNotifications(payload: any): Observable<any> {
    const body = JSON.stringify(payload);
    let url = `${environment?.baseUrl}/${endpoints?.clearMyNotifications}`;
    return this.http.post<any>(url, body, {
      headers: this.jwtInterceptor.customHttpHeaders,
    });
  }
  public verifyOTP(otpParams: verifyOTP): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.verifyOTP}?otp=${otpParams?.otp}&phoneNumber=${otpParams?.phoneNumber}&email=${otpParams?.email}`;
    return this.http.post<any>(url, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public resendOTP(resendParams: resendOTP): Observable<any> {
    let url = `${environment?.baseUrl}/${endpoints?.resendOTP}?phoneNumber=${resendParams?.phoneNumber}&email=${resendParams?.email}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customNoAuthHttpHeaders,
    });
  }

  public fetchWalletProfile(uniqueId:string):Observable<any>{
    let url = `${environment?.baseUrl}/${endpoints?.fetchMyWallet}?uniqueId=${uniqueId.trim()}`;
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders
    });
  }
}
