import {Injectable} from '@angular/core';
import {LoginCredentials} from "../models/mocks";
import {Observable, of} from "rxjs";
import {dummyLogin} from "../models/stores";
import {ActivatedRoute, Router} from "@angular/router";
import {HttpClient} from "@angular/common/http";
import {JwtInterceptorService} from "./jwt-interceptor.service";
import {environment} from "../../environments/environment";
import {endpoints} from "../models/endpoint";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private jwtInterceptor: JwtInterceptorService
  ) {
  }

  setUserCredential(credential: LoginCredentials) {
    const stringifiedUser = JSON.stringify(credential);
    const encryptUser = btoa(stringifiedUser);
    localStorage.setItem('eniyan', encryptUser);
  }

  getUserCredential(): string | null {
    return localStorage.getItem('eniyan');
  }

  decodeAndParseScouter(encryptedInfo: string) {
    const decoded =  atob(encryptedInfo);
    let parsed = JSON.parse(decoded);
    const tryParse = (value:any) => {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return value === "true" ? true : value === "false" ? false : value;
      }
    };

    if (parsed.details) {
      if (parsed.details.session) {
        for (let key in parsed.details.session) {
          parsed.details.session[key] = tryParse(parsed.details.session[key]);
        }
      }
      if (parsed.details.user) {
        for (let key in parsed.details.user) {
          parsed.details.user[key] = tryParse(parsed.details.user[key]);
        }
      }
    }

    return parsed;
  }


  public decodeScouterDetails():any{
    let getUserData:any = this.getUserCredential();
    return this.decodeAndParseScouter(getUserData);
  }

   decodeAndParseTalent(encryptedInfo: string) {
    const decoded = atob(encryptedInfo);
    let parsed = JSON.parse(decoded);
    const tryParse = (value: any) => {
      if (typeof value !== "string") return value;
      try {
        return JSON.parse(value);
      } catch {
        return value === "true" ? true : value === "false" ? false : value;
      }
    };

    if (parsed.details) {
      if (parsed.details.session) {
        for (let key in parsed.details.session) {
          parsed.details.session[key] = tryParse(parsed.details.session[key]);
        }
      }
      if (parsed.details.user) {
        for (let key in parsed.details.user) {
          parsed.details.user[key] = tryParse(parsed.details.user[key]);
        }
      }
    }

    return parsed;
  }

  public decodeTalentDetails():any{
    let getUserData:any = this.getUserCredential();
    return this.decodeAndParseTalent(getUserData);
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


  public loginUser(user: any):Observable<any>{
    let body = JSON.stringify(user);
    let url = `${environment?.baseUrl}/${endpoints?.userLogin}`;
    return this.http.post<any>(url, body, {headers: this.jwtInterceptor.customNoAuthHttpHeaders});
  }


  async logoutUser(): Promise<any> {
    localStorage.clear();
    sessionStorage.clear();
    await this.router.navigate(['/auth/login'], {
      relativeTo: this.route
    })
  }

}
