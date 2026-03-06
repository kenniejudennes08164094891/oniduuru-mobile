import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * ✅ Strict Authentication Guard - Validates token and prevents access to protected routes
 * This guard checks:
 * 1. Token exists in localStorage
 * 2. Token is not expired
 * 3. User data is present
 * 
 * If any check fails, user is redirected to login
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    //  No token → redirect to login
    if (!token) {
      console.warn(' No token found. Redirecting to login from:', state.url);
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    }

    // No user data → redirect to login
    if (!userData) {
      console.warn('No user data found. Redirecting to login from:', state.url);
      localStorage.removeItem('access_token');
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    }

    //  Token is expired → redirect to login
    if (!this.authService.validateStoredToken()) {
      console.warn('Token is expired. Redirecting to login from:', state.url);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      this.router.navigate(['/auth/login'], { replaceUrl: true });
      return false;
    }

    // ✅ All checks passed
    console.log('✅ Auth Guard passed for route:', state.url);
    return true;
  }
}
