// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { NavController, AnimationController } from '@ionic/angular';
// import { ToastsService } from 'src/app/services/toasts.service';
// import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
// import { AuthService } from 'src/app/services/auth.service'; // Add AuthService

// @Component({
//   selector: 'app-hire-talent-page',
//   templateUrl: './hire-talent-page.component.html',
//   styleUrls: ['./hire-talent-page.component.scss'],
//   standalone: false,
// })
// export class HireTalentPageComponent implements OnInit {
//   headerHidden: boolean = false;
//   otpArray = new Array(4);
//   otp: string[] = new Array(4).fill('');
//   countdown: number = 120;
//   private timer: any;
//   userEmail: string = '';
//   starredEmail: string = '';

//   constructor(
//     private router: Router,
//     private navCtrl: NavController,
//     private toastService: ToastsService,
//     private animationCtrl: AnimationController,
//     private scouterEndpointsService: ScouterEndpointsService,
//     private authService: AuthService // Add AuthService
//   ) {}

//   ngOnInit() {
//     this.loadUserEmail();
//     this.sendInitialOtp(); // Send OTP automatically when page loads
//     this.startCountdown();
    
//     setTimeout(() => {
//       const firstInput = document.querySelector('input') as HTMLInputElement;
//       if (firstInput) firstInput.focus();
//     }, 0);
//   }

//   private loadUserEmail(): void {
//     // Method 1: Try to get from current user
//     const currentUser = this.authService.getCurrentUser();
//     console.log('🔍 Current user from AuthService:', currentUser);
    
//     if (currentUser?.email) {
//       this.userEmail = currentUser.email;
//       this.starredEmail = this.getStarredEmail(currentUser.email);
//       console.log('✅ Email from AuthService:', this.userEmail);
//       return;
//     }

//     // Method 2: Try localStorage
//     const userData = localStorage.getItem('user_data');
//     if (userData) {
//       try {
//         const parsedUser = JSON.parse(userData);
//         console.log('🔍 User data from localStorage:', parsedUser);
        
//         // Try multiple possible email fields
//         this.userEmail = parsedUser.email || 
//                         parsedUser.details?.user?.email || 
//                         parsedUser.details?.email || 
//                         parsedUser.user?.email || 
//                         '';
        
//         if (this.userEmail) {
//           this.starredEmail = this.getStarredEmail(this.userEmail);
//           console.log('✅ Email from localStorage:', this.userEmail);
//           return;
//         }
//       } catch (error) {
//         console.error('Error parsing user data:', error);
//       }
//     }

//     // Method 3: Try registration email
//     const registrationEmail = localStorage.getItem('registration_email');
//     if (registrationEmail) {
//       this.userEmail = registrationEmail;
//       this.starredEmail = this.getStarredEmail(registrationEmail);
//       console.log('✅ Email from registration:', this.userEmail);
//       return;
//     }

//     console.warn('❌ No email found in any storage location');
//     this.userEmail = '';
//     this.starredEmail = 'user@example.com'; // Fallback
//   }

//   // Helper method to create starred email (e.g., j****@gmail.com)
//   private getStarredEmail(email: string): string {
//     if (!email || !email.includes('@')) {
//       return 'u****@example.com';
//     }
    
//     const [localPart, domain] = email.split('@');
//     if (localPart.length <= 2) {
//       return `${localPart.charAt(0)}****@${domain}`;
//     }
    
//     const firstChar = localPart.charAt(0);
//     const lastChar = localPart.charAt(localPart.length - 1);
//     return `${firstChar}****${lastChar}@${domain}`;
//   }

//   // Send OTP automatically when page loads - IMPROVED
//   private sendInitialOtp(): void {
//     if (!this.userEmail) {
//       console.warn('❌ No email found for automatic OTP');
//       this.toastService.openSnackBar('No email found. Please contact support.', 'danger');
//       return;
//     }

//     console.log('🔄 Sending initial OTP to:', this.userEmail);
    
//     this.scouterEndpointsService.resendOtp({ email: this.userEmail }).subscribe({
//       next: (response) => {
//         console.log('✅ Initial OTP sent successfully:', response);
//         this.toastService.openSnackBar(`OTP sent to ${this.starredEmail}`, 'success');
//       },
//       error: (error) => {
//         console.error('❌ Failed to send initial OTP:', error);
        
//         let errorMessage = 'Failed to send OTP. Please try again.';
//         if (error?.error?.message) {
//           errorMessage = error.error.message;
//         } else if (error?.status === 0) {
//           errorMessage = 'Network error. Please check your connection.';
//         } else if (error?.status === 404) {
//           errorMessage = 'OTP service unavailable. Please contact support.';
//         }
        
//         this.toastService.openSnackBar(errorMessage, 'danger');
//       }
//     });
//   }

//   // Rest of your methods with improved error handling
//   onOtpInput(event: any, index: number) {
//     const input = event.target;

//     // Only allow numbers
//     input.value = input.value.replace(/[^0-9]/g, '');

//     if (input.value && index < this.otpArray.length - 1) {
//       const nextInput = input.nextElementSibling as HTMLInputElement;
//       if (nextInput) {
//         nextInput.focus();
//       }
//     }

//     const enteredOtp = this.otp.join('');
//     if (enteredOtp.length === this.otpArray.length && !this.otp.includes('')) {
//       this.verifyOtp();
//     }
//   }

//   goToDashboard() {
//     this.router.navigate(['/scouter/dashboard']);
//   }

//   onKeyDown(event: KeyboardEvent, index: number) {
//     if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
//       const prevInput = (event.target as HTMLInputElement)
//         .previousElementSibling as HTMLInputElement;
//       if (prevInput) {
//         prevInput.focus();
//       }
//     }
//   }

//   startCountdown() {
//     this.countdown = 120;
//     clearInterval(this.timer);
//     this.timer = setInterval(() => {
//       if (this.countdown > 0) {
//         this.countdown--;
//       } else {
//         clearInterval(this.timer);
//       }
//     }, 1000);
//   }

//   // Resend OTP - IMPROVED
//   resendOtp() {
//     if (!this.userEmail) {
//       this.toastService.openSnackBar('No email found for OTP', 'danger');
//       return;
//     }

//     console.log('🔄 Resending OTP to:', this.userEmail);
    
//     this.scouterEndpointsService.resendOtp({ email: this.userEmail }).subscribe({
//       next: (response) => {
//         console.log('✅ OTP resent successfully:', response);
//         this.toastService.openSnackBar(`OTP resent to ${this.starredEmail}`, 'success');
//         this.startCountdown();
//       },
//       error: (error) => {
//         console.error('❌ Failed to resend OTP:', error);
        
//         let errorMessage = 'Failed to resend OTP. Please try again.';
//         if (error?.error?.message) {
//           errorMessage = error.error.message;
//         }
        
//         this.toastService.openSnackBar(errorMessage, 'danger');
//       }
//     });
//   }

//   // Verify OTP - IMPROVED
//   async verifyOtp() {
//     const enteredOtp = this.otp.join('');
    
//     if (enteredOtp.length !== 4) {
//       this.toastService.openSnackBar('Please enter complete 4-digit OTP', 'danger');
//       return;
//     }

//     if (!this.userEmail) {
//       this.toastService.openSnackBar('No email found for verification', 'danger');
//       return;
//     }

//     console.log('🔐 Verifying OTP:', enteredOtp, 'for email:', this.userEmail);

//     this.scouterEndpointsService.verifyOtp({
//       otp: enteredOtp,
//       email: this.userEmail
//     }).subscribe({
//       next: (response) => {
//         console.log('✅ OTP verified successfully:', response);
//         this.toastService.openSnackBar('OTP Verified ✅', 'success');
        
//         // Navigate to next page after successful verification
//         this.navigateToNextPage();
//       },
//       error: (error) => {
//         console.error('❌ OTP verification failed:', error);
        
//         let errorMessage = 'Invalid OTP. Please try again.';
//         if (error?.error?.message) {
//           errorMessage = error.error.message;
//         } else if (error?.status === 401) {
//           errorMessage = 'OTP expired. Please request a new one.';
//         } else if (error?.status === 400) {
//           errorMessage = 'Invalid OTP format.';
//         }
        
//         this.toastService.openSnackBar(errorMessage, 'danger');
        
//         // Clear OTP fields on failure
//         this.otp = new Array(4).fill('');
//         setTimeout(() => {
//           const firstInput = document.querySelector('input') as HTMLInputElement;
//           if (firstInput) firstInput.focus();
//         }, 100);
//       }
//     });
//   }


//   // Add this method to your component for paste support
// onPaste(event: ClipboardEvent): void {
//   event.preventDefault();
//   const pastedData = event.clipboardData?.getData('text').trim() || '';
//   const numbers = pastedData.replace(/[^0-9]/g, '').split('').slice(0, 4);
  
//   numbers.forEach((num, index) => {
//     if (index < this.otp.length) {
//       this.otp[index] = num;
//     }
//   });
  
//   // Auto-submit if we have 4 digits
//   if (numbers.length === 4) {
//     setTimeout(() => this.verifyOtp(), 100);
//   }
// }

//   private navigateToNextPage(): void {
//     this.navCtrl.navigateForward('/scouter/hire-talent/welcome-to-oniduuru', {
//       animated: true,
//       animation: (baseEl, opts) => {
//         const animation = this.animationCtrl
//           .create()
//           .addElement(baseEl.querySelector('.ion-page'))
//           .duration(400)
//           .fromTo('opacity', '0', '1');
//         return animation;
//       },
//     });
//   }

//   // Add cleanup
//   ngOnDestroy() {
//     if (this.timer) {
//       clearInterval(this.timer);
//     }
//   }
// }












































import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AnimationController } from '@ionic/angular';
import { ToastsService } from 'src/app/services/toasts.service';
import { ScouterEndpointsService } from 'src/app/services/scouter-endpoints.service';
import { AuthService } from 'src/app/services/auth.service'; // Add AuthService

@Component({
  selector: 'app-hire-talent-page',
  templateUrl: './hire-talent-page.component.html',
  styleUrls: ['./hire-talent-page.component.scss'],
  standalone: false,
})
export class HireTalentPageComponent implements OnInit {
  headerHidden: boolean = false;
  otpArray = new Array(4);
  otp: string[] = new Array(4).fill('');
  countdown: number = 120;
  private timer: any;
  userEmail: string = '';
  starredEmail: string = '';

  // DEVELOPMENT FLAG - Set to true to bypass OTP
  private bypassOtp: boolean = true;


  constructor(
    private router: Router,
    private navCtrl: NavController,
    private toastService: ToastsService,
    private animationCtrl: AnimationController,
    private scouterEndpointsService: ScouterEndpointsService,
    private authService: AuthService // Add AuthService
  ) {}

  ngOnInit() {
  // Check if we should bypass OTP
    if (this.bypassOtp) {
      console.log('🚀 DEVELOPMENT MODE: Bypassing OTP verification');
      this.autoNavigateToDashboard();
      return;
    }
    


    this.loadUserEmail();
    this.sendInitialOtp(); // Send OTP automatically when page loads
    this.startCountdown();
    
    setTimeout(() => {
      const firstInput = document.querySelector('input') as HTMLInputElement;
      if (firstInput) firstInput.focus();
    }, 0);
  }



   // Auto-navigate method for development
  private autoNavigateToDashboard(): void {
    console.log('🔓 Auto-navigating to dashboard (OTP bypassed)');
    
    // Show a success message
    this.toastService.openSnackBar('OTP bypassed - Development mode', 'success');
    
    // Auto-fill OTP for visual feedback
    this.otp = ['1', '2', '3', '4'];
    
    // Navigate after a short delay
    setTimeout(() => {
      this.navigateToNextPage();
    }, 1000);
  }

  private loadUserEmail(): void {
    // Method 1: Try to get from current user
    const currentUser = this.authService.getCurrentUser();
    console.log('🔍 Current user from AuthService:', currentUser);
    
    if (currentUser?.email) {
      this.userEmail = currentUser.email;
      this.starredEmail = this.getStarredEmail(currentUser.email);
      console.log('✅ Email from AuthService:', this.userEmail);
      return;
    }

    // Method 2: Try localStorage
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('🔍 User data from localStorage:', parsedUser);
        
        // Try multiple possible email fields
        this.userEmail = parsedUser.email || 
                        parsedUser.details?.user?.email || 
                        parsedUser.details?.email || 
                        parsedUser.user?.email || 
                        '';
        
        if (this.userEmail) {
          this.starredEmail = this.getStarredEmail(this.userEmail);
          console.log('✅ Email from localStorage:', this.userEmail);
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Method 3: Try registration email
    const registrationEmail = localStorage.getItem('registration_email');
    if (registrationEmail) {
      this.userEmail = registrationEmail;
      this.starredEmail = this.getStarredEmail(registrationEmail);
      console.log('✅ Email from registration:', this.userEmail);
      return;
    }

    console.warn('❌ No email found in any storage location');
    this.userEmail = '';
    this.starredEmail = 'user@example.com'; // Fallback
  }

  // Helper method to create starred email (e.g., j****@gmail.com)
  private getStarredEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return 'u****@example.com';
    }
    
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart.charAt(0)}****@${domain}`;
    }
    
    const firstChar = localPart.charAt(0);
    const lastChar = localPart.charAt(localPart.length - 1);
    return `${firstChar}****${lastChar}@${domain}`;
  }

  // Send OTP automatically when page loads - IMPROVED
  private sendInitialOtp(): void {
    if (!this.userEmail) {
      console.warn('❌ No email found for automatic OTP');
      this.toastService.openSnackBar('No email found. Please contact support.', 'error');
      return;
    }

    console.log('🔄 Sending initial OTP to:', this.userEmail);
    
    this.scouterEndpointsService.resendOtp({ email: this.userEmail }).subscribe({
      next: (response) => {
        console.log('✅ Initial OTP sent successfully:', response);
        this.toastService.openSnackBar(`OTP sent to ${this.starredEmail}`, 'success');
      },
      error: (error) => {
        console.error('❌ Failed to send initial OTP:', error);
        
        let errorMessage = 'Failed to send OTP. Please try again.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.status === 0) {
          errorMessage = 'Network error. Please check your connection.';
        } else if (error?.status === 404) {
          errorMessage = 'OTP service unavailable. Please contact support.';
        }
        
        this.toastService.openSnackBar(errorMessage, 'error');
      }
    });
  }

  // Rest of your methods with improved error handling
  onOtpInput(event: any, index: number) {
    const input = event.target;

    // Only allow numbers
    input.value = input.value.replace(/[^0-9]/g, '');

    if (input.value && index < this.otpArray.length - 1) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }

    const enteredOtp = this.otp.join('');
    if (enteredOtp.length === this.otpArray.length && !this.otp.includes('')) {
      this.verifyOtp();
    }
  }

  goToDashboard() {
    this.router.navigate(['/scouter/dashboard']);
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otp[index] && index > 0) {
      const prevInput = (event.target as HTMLInputElement)
        .previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

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

  // Resend OTP - IMPROVED
  resendOtp() {
    if (!this.userEmail) {
      this.toastService.openSnackBar('No email found for OTP', 'error');
      return;
    }

    console.log('🔄 Resending OTP to:', this.userEmail);
    
    this.scouterEndpointsService.resendOtp({ email: this.userEmail }).subscribe({
      next: (response) => {
        console.log('✅ OTP resent successfully:', response);
        this.toastService.openSnackBar(`OTP resent to ${this.starredEmail}`, 'success');
        this.startCountdown();
      },
      error: (error) => {
        console.error('❌ Failed to resend OTP:', error);
        
        let errorMessage = 'Failed to resend OTP. Please try again.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.toastService.openSnackBar(errorMessage, 'error');
      }
    });
  }

  // Modified verifyOtp method to also accept bypass
  async verifyOtp() {
    // If bypass is enabled, skip verification
    if (this.bypassOtp) {
      console.log('🚀 DEVELOPMENT: Bypassing OTP check');
      this.navigateToNextPage();
      return;
    }
    
    const enteredOtp = this.otp.join('');
    
    if (enteredOtp.length !== 4) {
      this.toastService.openSnackBar('Please enter complete 4-digit OTP', 'error');
      return;
    }

    if (!this.userEmail) {
      this.toastService.openSnackBar('No email found for verification', 'error');
      return;
    }

    console.log('🔐 Verifying OTP:', enteredOtp, 'for email:', this.userEmail);

    this.scouterEndpointsService.verifyOtp({
      otp: enteredOtp,
      email: this.userEmail
    }).subscribe({
      next: (response) => {
        console.log('✅ OTP verified successfully:', response);
        this.toastService.openSnackBar('OTP Verified ✅', 'success');
        
        // Navigate to next page after successful verification
        this.navigateToNextPage();
      },
      error: (error) => {
        console.error('❌ OTP verification failed:', error);
        
        let errorMessage = 'Invalid OTP. Please try again.';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.status === 401) {
          errorMessage = 'OTP expired. Please request a new one.';
        } else if (error?.status === 400) {
          errorMessage = 'Invalid OTP format.';
        }
        
        this.toastService.openSnackBar(errorMessage, 'error');
        
        // Clear OTP fields on failure
        this.otp = new Array(4).fill('');
        setTimeout(() => {
          const firstInput = document.querySelector('input') as HTMLInputElement;
          if (firstInput) firstInput.focus();
        }, 100);
      }
    });
  }

  // Add this method to your component for paste support
onPaste(event: ClipboardEvent): void {
  event.preventDefault();
  const pastedData = event.clipboardData?.getData('text').trim() || '';
  const numbers = pastedData.replace(/[^0-9]/g, '').split('').slice(0, 4);
  
  numbers.forEach((num, index) => {
    if (index < this.otp.length) {
      this.otp[index] = num;
    }
  });
  
  // Auto-submit if we have 4 digits
  if (numbers.length === 4) {
    setTimeout(() => this.verifyOtp(), 100);
  }
}

  private navigateToNextPage(): void {
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

  // Add cleanup
  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}




