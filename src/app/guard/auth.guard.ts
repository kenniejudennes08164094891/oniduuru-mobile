import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthRedirectGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('authToken'); // or however you store auth state

    if (token) {
      // ✅ If already logged in → redirect away
      this.router.navigate(['/scouter/dashboard']); // or dashboard
      return false;
    }

    // ❌ Not logged in → allow access to login/signup
    return true;
  }
}
