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
    private toast: ToastsService,
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

  async submitForm(): Promise<any> {
  this.loginText = "signing in...";

  setTimeout(async (): Promise<void> => {
    try {
      const res = await firstValueFrom(this.authService.loginUser(this.loginForm.value));
      console.log(' Login response:', res); 
      if (res) {
        const role = res?.details?.user?.role;
        const talentId = res?.details?.user?.talentId;

        // ✅ Store full user credential (as before)
        this.authService.setUserCredential(res);
        

        // ✅ NEW: Store talentId separately for profile page use
        if (talentId) {
          localStorage.setItem('talentId', talentId);
        }

        this.toast.openSnackBar(`${res?.message}`, 'success');

        // ✅ Redirect based on role
        await this.router.navigateByUrl(
          role === 'scouter'
            ? '/scouter/dashboard'
            : role === 'talent'
            ? '/talent/dashboard'
            : '/auth/login'
        );
      }
    } catch (err: Error | any) {
      console.error('error from login >>', err);
      this.loginText = 'Login';
      this.toast.openSnackBar(err?.error?.message ?? 'Oops!...a login error occurred!', 'error');
    }
  }, 1200);
}




  ngOnInit() {
    this.getLoginForm();
  }


}
