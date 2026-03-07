import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token) {
      // ✅ If already logged in → redirect away
      this.router.navigate(['/scouter/dashboard']); // or dashboard
      return false;
    }
    if (token && userData) {
      return true; // ✅ User is logged in
    }

    // ❌ No token, redirect to login
    this.router.navigate(['/auth/login'], { replaceUrl: true });
    return false;
  }
}

/**
 * Guard to protect routes that require authentication
 * Redirects to login if user is not authenticated
 */
@Injectable({
  providedIn: 'root',
})
export class ProtectedRouteGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    // ✅ User is authenticated
    if (token && userData) {
      return true;
    }

    // ❌ Not authenticated - redirect to login and replace history to prevent back button
    this.router.navigate(['/auth/login'], { replaceUrl: true });
    return false;
  }
}
