import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password-reset-success',
  templateUrl: './forgot-password-reset-success.component.html',
  styleUrls: ['./forgot-password-reset-success.component.scss'],
})
export class ForgotPasswordResetSuccessComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
  }

 async goToLogin(): Promise<void> {
   await this.router.navigate(['/auth/login']);
  }

 async cancel(): Promise<void> {
   await this.router.navigate(['/auth/forgot-password']);
  }
}
