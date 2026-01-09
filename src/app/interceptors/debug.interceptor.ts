// src/app/interceptors/debug-interceptor.service.ts
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable()
export class DebugInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Log the outgoing request
    console.group(` HTTP Request: ${req.method} ${req.url}`);
    console.log(' Headers:', req.headers.keys().map(k => `${k}: ${req.headers.get(k)}`));
    // console.log(' Body:', req.body);
    console.groupEnd();

    const startTime = Date.now();
    
    // Add a unique request ID for tracking
    const requestId = Math.random().toString(36).substring(7);
    console.log(`Request ID: ${requestId} - ${req.method} ${req.url}`);
    
    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            console.group(` HTTP Response [${requestId}]: ${req.method} ${req.url} (${duration}ms)`);
            console.log(' Status:', event.status);
            console.log(' Response:', event.body);
            console.groupEnd();
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          console.group(` HTTP Error [${requestId}]: ${req.method} ${req.url} (${duration}ms)`);
          console.log(' Error:', error);
          if (error instanceof HttpErrorResponse) {
            console.log(' Status:', error.status);
            console.log(' Error body:', error.error);
            console.log(' URL:', error.url);
          }
          console.groupEnd();
        },
        finalize: () => {
          console.log(`🏁 Request completed [${requestId}]`);
        }
      })
    );
  }
}