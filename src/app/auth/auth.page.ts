import {Component,OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../services/auth.service";
import {firstValueFrom} from "rxjs";
import {ToastsService} from "../services/toasts.service";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  loginForm!: FormGroup;
  showEye: boolean = false;
  loginText: string = 'Login';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toast: ToastsService
  ) {
  }

  getLoginForm() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    })
  }

  async signupSelect(): Promise<any> {
    await this.router.navigate(['/auth/signup-select'], {relativeTo: this.route});
  }

  async routeToLoginScreen(): Promise<any> {
    await this.router.navigate(['/auth/login'], {
      relativeTo: this.route
    })
  }

  async submitForm(): Promise<any> {
    this.loginText = "signing in...";
   setTimeout(async ():Promise<void> => {
     try {
       const loginResponse = await firstValueFrom(this.authService.authenticateUser(this.loginForm.value));
       if (loginResponse.isAuthenticated === true) {
         await this.router.navigateByUrl(loginResponse.route);
         this.toast.openSnackBar(loginResponse.message, 'success');
       }else{
         this.toast.openSnackBar('Oops!...Invalid login credential!', 'error');
       }
     } catch (err: Error | any) {
       console.error("error from login>>", err);
       this.loginText = "Login";
       this.toast.openSnackBar(err ?? 'Oops!...a login error occurred!', 'error');
     }
   },1200)
  }


  ngOnInit() {
    this.getLoginForm();
  }


}
