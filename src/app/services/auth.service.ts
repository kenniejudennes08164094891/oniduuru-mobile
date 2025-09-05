import {Injectable} from '@angular/core';
import {LoginCredentials} from "../models/mocks";
import {Observable, of} from "rxjs";
import {dummyLogin} from "../models/stores";
import {ActivatedRoute, Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  setUserCredential(credential: LoginCredentials) {
    const stringifiedUser = JSON.stringify(credential);
    const encryptUser = btoa(stringifiedUser);
    localStorage.setItem('eniyan', encryptUser);
  }

  getUserCredential(): string | null {
    const userExists: string | null = localStorage.getItem('eniyan');
    return userExists ? JSON.parse(atob(userExists)) : null;
  }

  userIsLoggedIn():boolean{
    const currentUser: string | null = this.getUserCredential();
    return currentUser !== null;
  }

  authenticateUser(credential: LoginCredentials): Observable<any> {
    const validUsers: LoginCredentials[] = dummyLogin;
    const user: any = validUsers.find((userCredential: any) => (userCredential.email === credential.email) && (userCredential.password === credential.password));
    if (user) {
      this.setUserCredential(credential);
      return of({
        message: `${user.role} is logged in successfully!`,
        isAuthenticated: true,
        httpStatus: 200,
        role: user.role,
        route: user.route
      });
    }

    return of({
      message: "Invalid login credentials!",
      isAuthenticated: false,
      httpStatus: 401
    });
  }

  async logoutUser(): Promise<any> {
    localStorage.clear();
    sessionStorage.clear();
    await this.router.navigate(['/auth/login'], {
      relativeTo: this.route
    })
  }

}
