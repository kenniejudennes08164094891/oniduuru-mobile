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

  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  cancel(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
