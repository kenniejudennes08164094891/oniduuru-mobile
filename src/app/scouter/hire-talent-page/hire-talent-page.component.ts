import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// import { ToastController } from '@ionic/angular';
import { NavController, AnimationController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';

@Component({
  selector: 'app-hire-talent-page',
  templateUrl: './hire-talent-page.component.html',
  styleUrls: ['./hire-talent-page.component.scss'],
  standalone: false,
})
export class HireTalentPageComponent implements OnInit {
  headerHidden: boolean = false;

  otpArray = new Array(4); // 4-digit OTP
  otp: string[] = new Array(4).fill('');
  countdown: number = 120;
  private timer: any;

  constructor(
    private router: Router,

    private navCtrl: NavController,
    private toastService: ToastsService,
    private animationCtrl: AnimationController
  ) {}

  ngOnInit() {
    this.startCountdown();
    setTimeout(() => {
      const firstInput = document.querySelector('input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 0);
  }

  // Handle OTP input
  onOtpInput(event: any, index: number) {
    const input = event.target;

    // move to next input if not last
    if (input.value && index < this.otpArray.length - 1) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    // Auto-submit when last box filled
    const enteredOtp = this.otp.join('');
    if (enteredOtp.length === this.otpArray.length && !this.otp.includes('')) {
      this.verifyOtp();
      this.navCtrl.navigateForward('/scouter/hire-talent/welcome-to-oniduuru', {
        animated: true,
        animation: (baseEl, opts) => {
          const animation = this.animationCtrl
            .create()
            .addElement(baseEl.querySelector('.ion-page'))
            .duration(400)
            .fromTo('opacity', '0', '1');

          return animation;
        },
      });
    }
  }

  goToDashboard() {
    this.router.navigate(['/scouter/dashboard']);
  }

  // Handle key events (backspace, arrow keys)
  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prevInput = (event.target as HTMLInputElement)
        .previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  // Start countdown
  startCountdown() {
    this.countdown = 120;
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  // Resend OTP
  resendOtp() {
    // console.log('Resend OTP triggered');

    this.startCountdown();
  }

  // Verify OTP
  async verifyOtp() {
    const enteredOtp = this.otp.join('');
    // console.log('Entered OTP:', enteredOtp);

    if (enteredOtp.length === 4) {
      // since your otpArray is 4
      // console.log('OTP Verified ✅');
      // const toast = await this.toast.create({
      //   message: 'OTP Verified ✅',
      //   duration: 2000,
      //   color: 'success',
      //   position: 'bottom',
      // });
      // await toast.present();
      this.toastService.openSnackBar('OTP Verified ✅', 'success');

      // this.router.navigate(['/scouter/view-hires']);
    } else {
      // const toast = await this.toast.create({
      //   message: 'Incomplete OTP ❌',
      //   duration: 2000,
      //   color: 'danger',
      //   position: 'bottom',
      // });
      // await toast.present();
      this.toastService.openSnackBar('Incomplete OTP ❌', 'danger');
    }
  }
}
