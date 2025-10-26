import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        const role = user.role || user.details?.user?.role;

        const routes: { [key: string]: string } = {
          scouter: '/scouter/dashboard',
          talent: '/talent/dashboard',
          admin: '/admin/dashboard',
        };

        this.router.navigateByUrl(routes[role] || '/');
        return false; // stop loading login page
      } catch {
        localStorage.clear();
        return true;
      }
    }

    return true; // allow login if not authenticated
  }
}
