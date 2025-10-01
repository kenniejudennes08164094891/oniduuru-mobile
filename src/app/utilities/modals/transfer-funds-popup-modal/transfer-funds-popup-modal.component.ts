import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { ModalController, Platform, ToastController } from '@ionic/angular';
import { BaseModal } from 'src/app/base/base-modal.abstract';
import { MockRecentHires } from 'src/app/models/mocks';
import { imageIcons } from 'src/app/models/stores';
import { PaymentService } from 'src/app/services/payment.service';
import { TransferFundsReceiptModalComponent } from '../transfer-funds-receipt-modal/transfer-funds-receipt-modal.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-transfer-funds-popup-modal',
  templateUrl: './transfer-funds-popup-modal.component.html',
  styleUrls: ['./transfer-funds-popup-modal.component.scss'],
  standalone: false,
})
export class TransferFundsPopupModalComponent
  extends BaseModal
  implements OnInit
{
  @Input() isModalOpen: boolean = false;

  images = imageIcons;
  hires = MockRecentHires;

  formSubmitted = false;

  walletAccNo: string = '';
  walletName: string = '';
  agreed: boolean = false;

  // banks = banks;

  // User’s chosen bank (single value)
  bank: string | null = null;

  selectedBank: string | null = null;
  isBankDropdownOpen = false;

  // form fields
  // bank: string | null = null;
  accountNumber: string = '';
  amount: number | null = null;
  walletId: string = '0033392845'; // default (can be replaced)
  // agreed: boolean = false;

  // file preview
  selectedFile: File | null = null;
  previewUrl: string | ArrayBuffer | null = null;


  transferForm!: FormGroup;

  constructor(
    modalCtrl: ModalController,
    platform: Platform,
    private paymentService: PaymentService,
    private toastCtrl: ToastController,
    private ngZone: NgZone,
    private fb: FormBuilder // ✅ inject FormBuilder
  ) {
    super(modalCtrl, platform);
  }

  override ngOnInit() {
    this.transferForm = this.fb.group({
      // bank: [null, Validators.required],  // uncomment if you want bank dropdown back
      accountNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{10,11}$/), // ✅ only 10–11 digits allowed
        ],
      ],
      walletName: ['', [Validators.required, Validators.minLength(3)]],
      amount: [
        null,
        [Validators.required, Validators.min(100)], // must be ≥ 100
      ],
      agreeTerms: [false, Validators.requiredTrue], // ✅ must tick checkbox
    });
  }

  async createFundTransfer() {
    if (this.transferForm.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Please fill all fields correctly.',
        duration: 2000,
        color: 'danger',
      });
      await toast.present();
      return;
    }

    const formData = this.transferForm.value;

    const transfer = {
      amount: formData.amount,
      transactionId: 'TX-' + Date.now(),
      status: 'Successful',
      date: new Date().toISOString(),
      bank: formData.bank,
      nubamAccNo: formData.accountNumber,
      walletId: '0033392845',
      fromName: 'Omosehin Kehinde Jude',
      toName: formData.walletName,
      fromWalletId: '0325062797',
      toWalletId: formData.accountNumber,
    };

    // ✅ Close this form modal
    await this.modalCtrl.dismiss(transfer, 'transferSuccess');
  }

  toggleBankDropdown() {
    this.isBankDropdownOpen = !this.isBankDropdownOpen;
  }

  // selectBank(bank: string) {
  //   this.selectedBank = bank;
  //   this.isBankDropdownOpen = false;
  //   this.bank = bank; // ✅ keep it as string
  // }
  // ngOnInit() {}

  closeModal() {
    this.modalCtrl.dismiss();
  }

  //   images = imageIcons;
  // selectedFile: File | null = null;
  // previewUrl: string | ArrayBuffer | null = null;

  override dismiss() {
    super.dismiss();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => {
        this.ngZone.run(() => {
          this.previewUrl = reader.result as string;
        });
      };
      reader.readAsDataURL(file);
    }
  }
  removeScreenshot() {
    this.selectedFile = null;
    this.previewUrl = null;
  }
}
