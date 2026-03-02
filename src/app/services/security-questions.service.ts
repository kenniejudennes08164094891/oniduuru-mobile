// src/app/services/security-questions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, timer } from 'rxjs';
import {
  timeout,
  catchError,
  tap,
  retryWhen,
  mergeMap,
  filter,
  switchMap,
  take,
} from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { endpoints } from '../models/endpoint';
import { AuthService } from './auth.service';
import { JwtInterceptorService } from './jwt-interceptor.service';

export interface SecurityQuestion {
  id?: string;
  question: string;
  answer: string;
  isHashed?: boolean;
  showAnswer?: boolean;
  originalAnswer?: string;
  revealAttempt?: string;
  revealed?: boolean;
  verifyInProgress?: boolean;
  masked?: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SecurityQuestionsService {
  constructor(
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService,
  ) {}

  /**
   * Get security questions with answers
   * Response format: { message: string, data: "base64encodedJSON" }
   */
  getSecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    const encodedId = encodeURIComponent(uniqueId);
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestionsWithAnswers}?uniqueId=${encodedId}`;

    console.log('🔗 Fetching security questions from:', url);
    console.log('🔍 Using uniqueId:', uniqueId);

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        // Give the backend a reasonable amount of time, then abort
        timeout(15000),
        // retry only for network failures or server errors (status 0 or >= 500)
        retryWhen((errors: Observable<any>) =>
          errors.pipe(
            mergeMap((err: any) => {
              const status = err.status || 'unknown';
              console.log('🔁 retryWhen check status:', status);

              // if it's a network failure or server error, delay then retry once
              if (err.status === 0 || err.status >= 500) {
                return timer(1000);
              }

              // otherwise rethrow so the observable errors out immediately
              return throwError(() => err);
            }),
            take(1),
          ),
        ),
        tap((response) => {
          console.log('✅ Security questions response received:', response);
        }),
        catchError((error: any) => {
          // Classify error for better UI feedback
          const errorResponse = {
            status: error?.status || 'unknown',
            message: error?.error?.message || error?.message || 'Unknown error',
            type: 'error',
            originalError: error,
          };

          console.error('❌ Error fetching security questions:', errorResponse);

          // Specific handling for each error type
          if (error?.status === 0) {
            // Network error
            return throwError(() => ({
              ...errorResponse,
              type: 'network',
              displayMessage: 'Network error. Please check your connection.',
            }));
          } else if (error?.status === 403) {
            // 403 Forbidden - user exists but has no security questions
            console.log('ℹ️ No security questions found for this user');
            return of({
              data: null,
              message: 'no-questions',
              type: 'no-data',
            });
          } else if (error?.status === 404) {
            // 404 Not Found - user or endpoint doesn't exist
            console.log('ℹ️ User or security questions endpoint not found');
            return of({
              data: null,
              message: 'not-found',
              type: 'no-data',
            });
          } else if (error.name === 'TimeoutError') {
            // Request timeout
            return throwError(() => ({
              ...errorResponse,
              type: 'timeout',
              displayMessage: 'Request timed out. Please try again.',
            }));
          } else if (error?.status === 401) {
            // Unauthorized - token may be invalid or expired
            console.warn('🔒 Unauthorized when fetching security questions');
            return throwError(() => ({
              ...errorResponse,
              type: 'unauthorized',
              displayMessage: 'Unauthorized. Please log in again.',
            }));
          } else if (error?.status >= 500) {
            // Server error
            return throwError(() => ({
              ...errorResponse,
              type: 'server',
              displayMessage: 'Server error. Please try again later.',
            }));
          } else {
            // Other 4xx or unknown errors
            return throwError(() => ({
              ...errorResponse,
              type: 'other',
              displayMessage: error?.error?.message || 'Failed to load security questions',
            }));
          }
        }),
      );
  }

  /**
   * Get basic security questions (fallback)
   */
  getBasicSecurityQuestions(uniqueId: string): Observable<any> {
    const encodedId = encodeURIComponent(uniqueId);
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestions}?uniqueId=${encodedId}`;

    return this.http
      .get<any>(url, {
        headers: this.jwtInterceptor.customHttpHeaders,
      })
      .pipe(
        timeout(10000),
        catchError((error) => throwError(() => error)),
      );
  }
}
