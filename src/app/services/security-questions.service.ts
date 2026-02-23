// src/app/services/security-questions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { timeout, catchError, tap, retry } from 'rxjs/operators';
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
    private jwtInterceptor: JwtInterceptorService
  ) {}

  /**
   * Get security questions with answers
   * Response format: { message: string, data: "base64encodedJSON" }
   */
  getSecurityQuestionsWithAnswers(uniqueId: string): Observable<any> {
    const encodedId = encodeURIComponent(uniqueId);
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestionsWithAnswers}?uniqueId=${encodedId}`;
    
    console.log('🔗 Fetching security questions from:', url);
    
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders
    }).pipe(
      timeout(15000),
      tap(response => console.log('✅ Security questions response:', response)),
      catchError(error => {
        console.error('❌ Error fetching security questions:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get basic security questions (fallback)
   */
  getBasicSecurityQuestions(uniqueId: string): Observable<any> {
    const encodedId = encodeURIComponent(uniqueId);
    const url = `${environment.baseUrl}/${endpoints.getMySecurityQuestions}?uniqueId=${encodedId}`;
    
    return this.http.get<any>(url, {
      headers: this.jwtInterceptor.customHttpHeaders
    }).pipe(
      timeout(10000),
      catchError(error => throwError(() => error))
    );
  }
}