import {Component, Input, OnInit} from '@angular/core';
import {ModalController, Platform} from '@ionic/angular';
import {BaseModal} from 'src/app/base/base-modal.abstract';
import {EndpointService} from 'src/app/services/endpoint.service';
import {FundWalletReceiptModalComponent} from '../fund-wallet-receipt-modal/fund-wallet-receipt-modal.component';
import {ToastsService} from 'src/app/services/toasts.service';
import {PaymentService} from 'src/app/services/payment.service';
import {AuthService} from "../../../services/auth.service";
import {Browser} from '@capacitor/browser';
import {Subject, firstValueFrom, debounceTime, distinctUntilChanged, filter, from, of} from "rxjs";
import {catchError, map, switchMap} from "rxjs/operators";

@Component({
  selector: 'app-fund-wallet-popup-modal',
  templateUrl: './fund-wallet-popup-modal.component.html',
  styleUrls: ['./fund-wallet-popup-modal.component.scss'],
  standalone: false,
})
export class FundWalletPopupModalComponent extends BaseModal implements OnInit {
  @Input() isModalOpen: boolean = false;
  @Input() currentUser: any = null;

  // 🔹 Form model
  fundType: 'Fund Self' | 'Fund Others' | null = 'Fund Others';
  walletAccNo: string = '';
  walletName: string | null = null;
  reason: string = '';
  agreed: boolean = false;

  formSubmitted = false;
  amount: number | null = null;
  formattedAmount: string = '';

  // Validation error messages
  validationErrors = {
    amount: '',
    walletAccNo: '',
    walletName: '',
    reason: '',
    fundType: '',
    agreed: ''
  };

  // Payment processing state
  isProcessing: boolean = false;
  submitText: string = "Create Fund Deposit";
  walletProfile: any = {};

  designatedAcctName: string = "";
  responseMessage: string = "";
  showMessageResp: boolean | null = null;
  walletAccNo$ = new Subject<string>();
  calculatedCharge: string | number = 0;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastService: ToastsService,
    private endpointService: EndpointService,
    private authService: AuthService
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    // If currentUser is not passed via @Input, try to get it from localStorage
    if (!this.currentUser) {
      this.loadCurrentUser();
    }
    this.handleWalletAcctInput();
    this.getWalletProfile();
  }

  loadCurrentUser() {
    const userData: any = localStorage.getItem('user_data') || localStorage.getItem('user_profile_data');
    if (userData) {
      try {
        return this.currentUser = JSON.parse(userData);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }


  getWalletProfile() {
    const uniqueId = this.loadCurrentUser()?.role === "scouter" ? this.loadCurrentUser()?.scouterId : this.loadCurrentUser()?.role === "talent" ? this.loadCurrentUser()?.talentId : "";
    if (uniqueId.length > 0) {
      this.endpointService.fetchWalletProfile(uniqueId).subscribe({
        next: (response: any) => {
          console.clear();
          //console.log("wallet response>>", response?.data);
          this.walletProfile = response?.data;
        }
      })
    }
  }

  async closeModal() {
    await this.modalCtrl.dismiss();
  }

  onAmountChange(value: string) {
    // Remove non-digits
    const numericValue = value.replace(/\D/g, '');

    // Convert to number
    this.amount = numericValue ? parseInt(numericValue, 10) : null;

    // Format with commas & ₦
    this.formattedAmount = this.amount ? '₦ ' + this.amount.toLocaleString() : '';

    // Clear validation error
    this.validationErrors.amount = '';
    // calculateTransactionCharge

    if(this.fundType === 'Fund Others' && this.amount !== null){
      setTimeout(async () => {
        const calculateChargeResponse = await firstValueFrom(this.endpointService.calculateTransactionCharge(String(this.amount)));
        this.calculatedCharge = calculateChargeResponse?.data;
      },100)
    }
  }

  onWalletAccNoChange(event: any) {
    this.walletAccNo = event;
    this.walletAccNo$.next(event);
  }

  onWalletNameChange(value: string) {
    // Allow only letters and spaces, remove any numbers or special characters
    this.walletName = value.replace(/[^A-Za-z\s]/g, '');

    // Clear validation error
    this.validationErrors.walletName = '';
  }

  handleWalletAcctInput() {
    this.walletAccNo$.pipe(map((value: string) => value.replace(/\D/g, '')),
      debounceTime(1500),
      distinctUntilChanged(),
      filter((value:string) => value.length === 10),
      switchMap((value: string) => from(this.endpointService.fetchWalletProfile(undefined, value, true))
        .pipe(catchError(err => of({error: err})))))
      .subscribe((walletResponse: any) => {
      if (walletResponse?.error) {
        this.showMessageResp = false;
        this.designatedAcctName = "";
        if (walletResponse.error?.error?.statusCode === 400) {
          this.responseMessage = "Invalid wallet account!";
          this.walletAccNo = "";
        } else {
          this.responseMessage = walletResponse.error?.error?.message || "Unexpected error";
        }
      } else {
        this.showMessageResp = true;
        this.responseMessage = "Valid Wallet profile!✅";
        this.walletName = `${walletResponse.data?.firstName} ${walletResponse.data?.middleName} ${walletResponse.data?.lastName}`;
      }
    });
  }

  onReasonChange(value: string) {
    this.reason = value;
    this.validationErrors.reason = '';
  }

  onFundTypeChange(value: 'Fund Self' | 'Fund Others') {
    this.fundType = value;
    this.validationErrors.fundType = '';
  }

  onAgreedChange() {
    this.agreed = !this.agreed;
    this.validationErrors.agreed = '';
  }

  // Clear all validation errors
  clearValidationErrors() {
    this.validationErrors = {
      amount: '',
      walletAccNo: '',
      walletName: '',
      reason: '',
      fundType: '',
      agreed: ''
    };
  }

  // Validate form and set error messages
  private validateForm(): boolean {
    this.clearValidationErrors();
    let isValid = true;

    // Validate amount
    if (!this.amount || this.amount <= 0) {
      this.validationErrors.amount = 'Enter a valid amount greater than zero.';
      isValid = false;
    } else if (this.amount > 1000000) { // 10 million limit example
      this.validationErrors.amount = 'Amount cannot exceed ₦1,000,000.';
      isValid = false;
    }

    if (this.fundType === 'Fund Others') {
      // Validate wallet account number
      if (!this.walletAccNo || this.walletAccNo.length === 0) {
        this.validationErrors.walletAccNo = 'Wallet account number is required.';
        isValid = false;
      } else if (this.walletAccNo.length < 10 || this.walletAccNo.length > 11) {
        this.validationErrors.walletAccNo = 'Enter a valid wallet account number (10–11 digits).';
        isValid = false;
      } else if (!/^\d{10,11}$/.test(this.walletAccNo)) {
        this.validationErrors.walletAccNo = 'Wallet account number must contain only digits.';
        isValid = false;
      }

      // Validate wallet name
      if (!this.walletName || this.walletName.trim().length === 0) {
        this.validationErrors.walletName = 'Wallet name is required.';
        isValid = false;
      } else if (!/^[A-Za-z\s]+$/.test(this.walletName)) {
        this.validationErrors.walletName = 'Wallet name must contain only letters and spaces.';
        isValid = false;
      } else if (this.walletName.trim().length < 2) {
        this.validationErrors.walletName = 'Wallet name must be at least 2 characters.';
        isValid = false;
      } else if (this.walletName.trim().length > 50) {
        this.validationErrors.walletName = 'Wallet name cannot exceed 50 characters.';
        isValid = false;
      }

    }


    // Validate fund type
    if (!this.fundType) {
      this.validationErrors.fundType = 'Please select a fund type.';
      isValid = false;
    }

    // Validate terms agreement
    if (!this.agreed) {
      this.validationErrors.agreed = 'You must agree to the terms and conditions.';
      isValid = false;
    }

    // Validate reason (optional but with limits if provided)
    if (this.reason && this.reason.trim().length > 500) {
      this.validationErrors.reason = 'Reason cannot exceed 500 characters.';
      isValid = false;
    }

    return isValid;
  }

  // Show validation errors as toast messages
  private showValidationErrors() {
    Object.values(this.validationErrors).forEach(error => {
      if (error) {
        this.toastService.openSnackBar(error, 'warning');
      }
    });
  }

  // Submit form with validation check - Updated for Paystack integration
  async submitDeposit() {
    this.formSubmitted = true;
    this.submitText = "processing...";

    // Ensure currentUser is available
    if (!this.currentUser) {
      this.submitText = "Create Fund Deposit";
      this.loadCurrentUser();
    }

    if (!this.currentUser) {
      this.toastService.openSnackBar(
        'User information not found. Please try again.',
        'error'
      );
      this.submitText = "Create Fund Deposit";
      return;
    }

    // Validate form
    if (!this.validateForm()) {
      this.showValidationErrors();
      this.submitText = "Create Fund Deposit";
      return;
    }

    this.isProcessing = true;

    try {
      // Prepare deposit payload
      const depositPayload = {
        amount: this.amount,
        nameOfDepositor: this.currentUser?.fullName,
        depositorUniqueId: this.currentUser?.role === "scouter" ? this.currentUser?.scouterId : this.currentUser?.talentId,
        reasonForDeposit: this.reason || 'No reason provided',
        designatedWalletName: (this.walletName && this.fundType === 'Fund Others') ? this.walletName.trim() : `${this.walletProfile?.firstName ?? ''} ${this.walletProfile?.middleName ?? ''} ${this.walletProfile?.lastName ?? ''}`,
        designatedWalletAcct: this.fundType === 'Fund Others' ? this.walletAccNo : this.walletProfile?.wallet_id,
        bankDepositReceipt: '',
        identifier: this.fundType === 'Fund Self' ? 'Fund my wallet' : 'Fund others',
        isTermsAgreed: this.agreed ? 'true' : 'false',
      };
      console.log('Submitting deposit payload:', depositPayload);
      // Call the deposit endpoint
      if (this.amount && (this.amount > 1000000)) {
        this.toastService.openSnackBar("The maximum permissible deposit is ₦1,000,000", "error");
        this.submitText = "Create Fund Deposit";
      } else {
        this.endpointService.fundsDeposit(depositPayload).subscribe({
          next: async (response): Promise<any> => {
            this.isProcessing = false;
            //console.log("response>>",response);

            if (response) {
              // Success - dismiss modal and show receipt
              await this.modalCtrl.dismiss(response?.details, 'submitted');

              const receiptModal = await this.modalCtrl.create({
                component: FundWalletReceiptModalComponent,
                componentProps: {
                  depositData: response?.details,
                  date: new Date().toISOString(),
                  amount: this.amount,
                  walletName: (this.walletName && this.fundType === 'Fund Others') ? this.walletName.trim() : `${this.walletProfile?.firstName ?? ''} ${this.walletProfile?.middleName ?? ''} ${this.walletProfile?.lastName ?? ''}`,
                  walletAcctNo: this.walletAccNo,
                  identifier: this.fundType === 'Fund Self' ? 'Fund Self' : 'Fund Others',
                  status: 'Pending', // Initial status
                  reason: this.reason,
                },
                cssClass: 'fund-wallet-receipt-modal',
                initialBreakpoint: 1,
                backdropDismiss: false,
              });

              await receiptModal.present();

              this.toastService.openSnackBar(
                'Deposit request submitted successfully!',
                'success'
              );
              // Paystack payment URL returned - redirect to Paystack
              this.toastService.openSnackBar(
                'Redirecting to Paystack payment gateway...',
                'success'
              );

              // Open Paystack payment in new tab
              // window.open(response.details.authorization_url, '_blank');
              await Browser.open({
                url: response?.details?.authorization_url,
              });

              // Close modal
              await this.modalCtrl.dismiss(
                {
                  paymentInitiated: true,
                  paymentUrl: response?.details?.authorization_url,
                  depositData: depositPayload,
                },
                'submitted'
              );
            } else {
              // Unexpected response
              this.toastService.openSnackBar(
                'Deposit submitted. Please check your transaction history.',
                'success'
              );
              await this.modalCtrl.dismiss(depositPayload, 'submitted');
              this.submitText = "Create Fund Deposit";
            }
          },
          error: async (error) => {
            this.isProcessing = false;
            console.error('Deposit submission error:', error);

            let errorMessage = 'Deposit request failed. Please try again.';
            this.submitText = "Create Fund Deposit";

            if (error.status === 400) {
              errorMessage = error.error?.message || 'Invalid deposit details. Please check your inputs.';

              // Check for specific validation errors from backend
              if (error.error?.errors) {
                const backendErrors = error.error.errors;
                if (backendErrors.designatedWalletAcct) {
                  this.validationErrors.walletAccNo = backendErrors.designatedWalletAcct;
                  this.showValidationErrors();
                  return;
                }
                if (backendErrors.amount) {
                  this.validationErrors.amount = backendErrors.amount;
                  this.showValidationErrors();
                  return;
                }
              }
            } else if (error.status === 401) {
              errorMessage = 'Session expired. Please log in again.';
              this.authService.logoutUser();
            } else if (error.status === 500) {
              errorMessage = 'Server error. Please try again later.';
              this.submitText = "Create Fund Deposit";
            }

            this.toastService.openSnackBar(errorMessage, 'error');
          },
        });
      }

    } catch (error) {
      this.isProcessing = false;
      console.error('Unexpected error:', error);
      this.submitText = "Create Fund Deposit";
      this.toastService.openSnackBar(
        'An unexpected error occurred. Please try again.',
        'error'
      );
    }
  }

  // Calculate transaction charge for Fund Others cases
  calculateTransactionCharge() {
    if (this.amount && this.amount > 0) {
      this.endpointService
        .calculateTransactionCharge(this.amount.toString())
        .subscribe({
          next: (response) => {
            if (response?.data) {
              const charge = response.data;
              const totalAmount = this.amount! + charge;

              // this.toastService.openSnackBar(
              //   `Transaction charge: ₦${charge.toLocaleString()}. Total: ₦${totalAmount.toLocaleString()}`,
              //   'info'
              // );
            }
          },
          error: (error) => {
            console.error('Error calculating transaction charge:', error);
          },
        });
    }
  }

  // Optionally trigger charge calculation on amount change
  onAmountBlur() {
    if (this.amount && this.amount > 0 && this.fundType === 'Fund Others') {
      this.calculateTransactionCharge();
    }
  }

  // Handle fund type change
  onFundTypeChangeEvent(event: any) {
    this.onFundTypeChange(event.target.value);

    // Recalculate charge if amount is set and funding others
    if (this.amount && this.amount > 0 && this.fundType === 'Fund Others') {
      this.calculateTransactionCharge();
    }
  }
}
